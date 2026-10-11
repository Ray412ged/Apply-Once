import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useProfileData, useInvalidateProfileData } from "@/hooks/useProfileData";
import { useSavedJobs } from "@/hooks/useSavedJobs";
import { DashboardSkeleton } from "@/components/Skeleton";
import { runEngine } from "@/lib/readiness/engine";
import NextStepCard from "@/components/dashboard/NextStepCard";
import CommandCenterHeader from "@/components/command-center/CommandCenterHeader";
import ApplicationReadinessCard from "@/components/command-center/ApplicationReadinessCard";
import ProfileSectionsGrid from "@/components/command-center/ProfileSectionsGrid";
import TransferableSkillsCard from "@/components/command-center/TransferableSkillsCard";
import OptionalEnhancementsCard from "@/components/command-center/OptionalEnhancementsCard";
import ProgressSummary from "@/components/command-center/ProgressSummary";
import ResumeStatusCard from "@/components/resume/ResumeStatusCard";
import ResumeCelebration from "@/components/resume/ResumeCelebration";

import { generateResume } from "@/lib/resume/resumeGenerator";
import {
  getResumeStatus,
  hasResumeCelebrationBeenShown,
  markResumeCelebrationShown,
} from "@/lib/resume/resumeStorage";
import { UserCheck, Bookmark, Bell, ArrowRight } from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: profileData, isLoading: profileLoading } = useProfileData();
  const { data: savedJobRecords = [] } = useSavedJobs();
  const invalidateProfileData = useInvalidateProfileData();
  const [loading, setLoading] = useState(true);
  const [activeApps, setActiveApps] = useState([]);
  const [followUps, setFollowUps] = useState([]);

  useEffect(() => {
    if (profileLoading || !profileData) return;

    async function loadData() {
      try {
        if (!profileData.profile) {
          try {
            await base44.entities.UserProfile.create({
              email: user?.email || "",
              onboarding_status: "in_progress",
              privacy_acknowledged: true,
              terms_acknowledged: true,
              consent_to_ai_processing: false,
              profile_completion_percentage: 0,
            });
            invalidateProfileData();
          } catch (err) {
            console.error("Failed to create profile:", err);
          }
          navigate("/profile/edit?section=about", { replace: true });
          return;
        }

        const applications = await base44.entities.Application.filter({}, "-created_date", 50);
        setActiveApps(
          applications.filter((a) =>
            [
              "Interested",
              "Preparing",
              "Ready for Review",
              "Readiness Started",
              "Needs Information",
              "Ready to Apply",
              "Application Started",
            ].includes(a.status)
          )
        );

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        setFollowUps(
          applications
            .filter((a) => a.follow_up_date && new Date(a.follow_up_date) >= today)
            .sort((a, b) => new Date(a.follow_up_date) - new Date(b.follow_up_date))
        );
      } catch (err) {
        console.error("Failed to load home data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [navigate, profileData, profileLoading, invalidateProfileData, user]);

  // Run the canonical readiness engine exactly once per profile snapshot.
  const engineOutput = useMemo(() => {
    if (!profileData || !profileData.profile) return null;
    return runEngine(profileData);
  }, [profileData]);

  // Live resume model — derived from the same profile data, memoized so it
  // is not regenerated on unrelated renders.
  const resume = useMemo(
    () => (profileData?.profile ? generateResume(profileData) : null),
    [profileData]
  );
  const resumeStatus = resume
    ? getResumeStatus(resume, user, profileData?.profile?.last_resume_signature)
    : "not_ready";
  const [celebrationVisible, setCelebrationVisible] = useState(false);
  useEffect(() => {
    if (resume?.canGenerate && !hasResumeCelebrationBeenShown(user)) {
      setCelebrationVisible(true);
    }
  }, [resume, user]);
  const dismissCelebration = () => {
    setCelebrationVisible(false);
    markResumeCelebrationShown(user);
  };

  if (loading || profileLoading) {
    return <DashboardSkeleton />;
  }

  const savedJobs = savedJobRecords.length;

  const firstName =
    profileData?.profile?.preferred_name || profileData?.profile?.first_name || "there";
  const completion = profileData?.percentage || 0;
  const readiness = engineOutput?.applicationReadiness;
  const sectionStatuses = engineOutput?.sectionStatuses || {};
  const nextStep = engineOutput?.nextBestStep;
  const applicationReady = readiness?.applicationReady ?? false;
  const transferableSkills = engineOutput?.transferableSkills || [];
  const optionalEnhancements = engineOutput?.optionalEnhancements || [];
  const progressHistory = engineOutput?.progressHistory || [];

  const handleNavigate = (route) => {
    if (route) navigate(route);
  };

  return (
    <div className="py-6 space-y-6 animate-fade-in">
      {/* A. Welcome & Profile Status */}
      <CommandCenterHeader
        firstName={firstName}
        applicationReady={applicationReady}
        sectionStatuses={sectionStatuses}
        completion={completion}
      />

      {/* One-time resume-ready accomplishment */}
      <ResumeCelebration visible={celebrationVisible} onDismiss={dismissCelebration} />

      {/* C. Next Best Step — the clearest primary action (exactly one) */}
      {nextStep && (
        <NextStepCard step={nextStep} onClick={() => handleNavigate(nextStep.route)} />
      )}

      {/* B. Application Readiness */}
      {readiness && <ApplicationReadinessCard readiness={readiness} />}

      {/* Resume status (live view of the profile) */}
      <ResumeStatusCard
        status={resumeStatus}
        onViewResume={() => navigate("/resume")}
        onContinueProfile={() => navigate("/profile/edit?section=employment")}
      />

      {/* D. Profile Sections */}
      <ProfileSectionsGrid sectionStatuses={sectionStatuses} onNavigate={handleNavigate} />

      {/* E. Transferable Skills */}
      <TransferableSkillsCard
        skills={transferableSkills}
        onNextStep={
          transferableSkills.length === 0 && nextStep
            ? () => handleNavigate(nextStep.route)
            : undefined
        }
        nextStepTitle={nextStep?.title}
      />

      {/* G. Progress */}
      <ProgressSummary progressHistory={progressHistory} />

      {/* F. Optional Enhancements (separate, non-punitive) */}
      <OptionalEnhancementsCard
        enhancements={optionalEnhancements}
        onNavigate={handleNavigate}
      />

      {/* Job Activity — preserves existing job-related entry points */}
      <section aria-label="Job activity">
        <h2 className="text-lg font-bold text-foreground mb-3">Job Activity</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate("/jobs")}
            className="bg-card rounded-2xl border border-border p-4 text-left hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center mb-2">
              <Bookmark className="w-5 h-5 text-success" />
            </div>
            <p className="text-2xl font-bold text-foreground">{savedJobs}</p>
            <p className="text-sm text-muted-foreground">
              {savedJobs === 1 ? "saved job" : "saved jobs"}
            </p>
          </button>

          <button
            onClick={() => navigate("/applications")}
            className="bg-card rounded-2xl border border-border p-4 text-left hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center mb-2">
              <UserCheck className="w-5 h-5 text-warning" />
            </div>
            <p className="text-2xl font-bold text-foreground">{activeApps.length}</p>
            <p className="text-sm text-muted-foreground">applications in progress</p>
          </button>

          <button
            onClick={() => navigate("/applications")}
            className="bg-card rounded-2xl border border-border p-4 text-left hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center mb-2">
              <Bell className="w-5 h-5 text-accent-foreground" />
            </div>
            <p className="text-2xl font-bold text-foreground">{followUps.length}</p>
            <p className="text-sm text-muted-foreground">
              {followUps.length === 1 ? "follow-up reminder" : "follow-up reminders"}
            </p>
          </button>
        </div>
      </section>

      {/* Upcoming follow-ups */}
      {followUps.length > 0 && (
        <section aria-label="Upcoming follow-ups">
          <h2 className="text-lg font-bold text-foreground mb-3">Upcoming Follow-ups</h2>
          <div className="space-y-2">
            {followUps.slice(0, 3).map((app) => (
              <div
                key={app.id}
                className="bg-card rounded-xl border border-border p-4 flex items-center justify-between cursor-pointer"
                onClick={() => navigate("/applications")}
              >
                <div>
                  <p className="font-medium text-foreground text-sm">{app.outcome || "Application"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Follow up by {new Date(app.follow_up_date).toLocaleDateString()}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}