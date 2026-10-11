import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useProfileData } from "@/hooks/useProfileData";
import { analyzeJobReadiness } from "@/lib/readiness/engine";
import { detectAtsType, requiresEmployerAccount } from "@/lib/atsDetection";
import { computeMatchScore } from "@/lib/matching";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft } from "lucide-react";

import AssistantHeader from "@/components/assistant/AssistantHeader";
import ReadinessSummary from "@/components/workspace/ReadinessSummary";
import GuidedApplicationSteps from "@/components/workspace/GuidedApplicationSteps";
import ApplicationProfile from "@/components/workspace/ApplicationProfile";
import ReviewSummary from "@/components/workspace/ReviewSummary";
import ApplyActions from "@/components/workspace/ApplyActions";
import ApplicationPackageCard from "@/components/workspace/ApplicationPackageCard";
import { useApplyActions } from "@/components/workspace/useApplyActions";
import { generateResume } from "@/lib/resume/resumeGenerator";
import { generateCoverLetter } from "@/lib/coverLetter/coverLetterGenerator";
import { getResumeStatus } from "@/lib/resume/resumeStorage";
import { recordActivity } from "@/lib/recordActivity";
import { getJobForMe } from "@/lib/orgJobs";

/**
 * Application Workspace — thin orchestration layer.
 *
 * Responsibilities kept here are only those that genuinely span sections:
 *   - read route params
 *   - fetch shared job / application / reusable-answer records
 *   - run the canonical readiness engine
 *   - own cross-cutting persistence state (scanner answers, selected resume,
 *     cover-letter status, notes, employer-opened flag, contact-completed
 *     counter) and the debounced auto-save
 *   - top-level loading / error states
 *
 * All display logic lives in the focused section components. Readiness is
 * computed once and passed down; profile data is never re-fetched by children.
 */
export default function ApplicationWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: profileData, isLoading: profileLoading } = useProfileData();

  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState(null);
  const [application, setApplication] = useState(null);
  const [reusableAnswers, setReusableAnswers] = useState([]);

  // Cross-cutting persistence state (feeds the single auto-save effect)
  const [answers, setAnswers] = useState({});
  const [selectedResumeId, setSelectedResumeId] = useState(null);
  const [coverLetterViewedSig, setCoverLetterViewedSig] = useState("");
  const [notes, setNotes] = useState("");
  const [openNextCounter, setOpenNextCounter] = useState(0);

  const loadedRef = useRef(false);

  // Shared profile slices (single fetch via useProfileData)
  const profile = profileData?.profile || null;
  const employment = profileData?.employmentRecords || [];
  const education = profileData?.educationRecords || [];
  const skills = profileData?.skills || [];
  const credentials = profileData?.credentials || [];
  const references = profileData?.references || [];
  const preferences = profileData?.preferences || null;
  const resumeDocs = (profileData?.documents || []).filter((d) => d.document_type === "Resume");

  // === Load shared data ===
  useEffect(() => {
    async function loadData() {
      try {
        const jobData = await getJobForMe(id);
        setJob(jobData);

        try {
          const answerRecords = await base44.entities.ReusableAnswer.list("-created_date", 50);
          setReusableAnswers(answerRecords);
        } catch (err) {
          console.error("Failed to load reusable answers:", err);
        }

        {
          const apps = await base44.entities.Application.filter({ job_posting_id: id }, "-created_date", 1);
          let app = apps[0];
          if (!app) {
            app = await base44.entities.Application.create({
              job_posting_id: id,
              status: "Readiness Started",
              application_started_date: new Date().toISOString(),
              employer_name: jobData.employer_name,
              job_title: jobData.job_title,
              job_url: jobData.posting_url || jobData.application_url || "",
              submission_method: "External Link",
            });
          } else {
            const updates = {};
            if (!app.employer_name) updates.employer_name = jobData.employer_name;
            if (!app.job_title) updates.job_title = jobData.job_title;
            if (!app.job_url) updates.job_url = jobData.posting_url || jobData.application_url || "";
            if (app.status === "Interested") updates.status = "Readiness Started";
            if (Object.keys(updates).length > 0) {
              app = await base44.entities.Application.update(app.id, updates);
            }
          }
          setApplication(app);

          try {
            if (app.scanner_answers) setAnswers(JSON.parse(app.scanner_answers));
          } catch {}
          if (app.resume_document_id) setSelectedResumeId(app.resume_document_id);
          if (app.cover_letter_signature) setCoverLetterViewedSig(app.cover_letter_signature);
          if (app.notes) setNotes(app.notes);
        }

      } catch (err) {
        console.error("Failed to load workspace data:", err);
      } finally {
        loadedRef.current = true;
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  // === Readiness analysis (single source of truth) ===
  const readiness = useMemo(() => {
    if (!job || !profileData) return null;
    return analyzeJobReadiness(job, profileData);
  }, [job, profileData]);

  // === Application package: live resume + job-tailored cover letter ===
  const resume = useMemo(
    () => (profileData?.profile ? generateResume(profileData) : null),
    [profileData]
  );
  const resumeStatus = resume
    ? getResumeStatus(resume, null, profileData?.profile?.last_resume_signature)
    : "not_ready";

  // Records a resume_generated activity event the first time a real,
  // usable resume becomes available for this application view — there's
  // no discrete "Generate" button in this workflow (the resume is derived
  // automatically from profile data), so this fires on the ready-state
  // transition instead, once per workspace visit.
  const resumeGeneratedRecordedRef = useRef(false);
  useEffect(() => {
    if (resumeStatus !== "not_ready" && resume && !resumeGeneratedRecordedRef.current) {
      resumeGeneratedRecordedRef.current = true;
      recordActivity("resume_generated");
    }
  }, [resumeStatus, resume]);
  const coverLetter = useMemo(
    () => (profileData && job ? generateCoverLetter(profileData, job) : null),
    [profileData, job]
  );
  const coverLetterStatus = !coverLetter?.canGenerate
    ? "not_ready"
    : coverLetterViewedSig && coverLetterViewedSig !== coverLetter.signature
      ? "updated"
      : "ready";

  // === Shared record update helper (used by the apply hook) ===
  const updateApplication = useCallback(
    async (partial) => {
      if (!application) return null;
      try {
        const updated = await base44.entities.Application.update(application.id, partial);
        setApplication(updated);
        return updated;
      } catch (err) {
        console.error("Failed to update application:", err);
        return null;
      }
    },
    [application]
  );

  const handleEmployerOpened = useCallback(() => {
    sessionStorage.setItem(`workspace_employer_opened_${id}`, "true");
  }, [id]);

  const refreshReusableAnswers = useCallback(async () => {
    try {
      const answerRecords = await base44.entities.ReusableAnswer.list("-created_date", 50);
      setReusableAnswers(answerRecords);
    } catch (err) {
      console.error("Failed to refresh reusable answers:", err);
    }
  }, []);

  const handleCoverLetterOpened = useCallback(() => {
    if (!coverLetter?.signature || coverLetter.signature === coverLetterViewedSig) return;
    setCoverLetterViewedSig(coverLetter.signature);
    updateApplication({ cover_letter_signature: coverLetter.signature, cover_letter_status: "ready" });
  }, [coverLetter, coverLetterViewedSig, updateApplication]);

  // === Apply flow (state + handlers encapsulated in the hook) ===
  const apply = useApplyActions({
    job,
    application,
    atsType: job?.ats_type || detectAtsType(job?.application_url) || detectAtsType(job?.posting_url),
    notes,
    onApplicationUpdate: updateApplication,
    onEmployerOpened: handleEmployerOpened,
  });

  // === Auto-save workspace state to the Application record ===
  useEffect(() => {
    if (!loadedRef.current || !application || !readiness) return;
    const answerableMissing = readiness.missing.filter((m) => m.type !== "link");
    const unansweredCount = answerableMissing.filter((m) => answers[m.id] === undefined || answers[m.id] === "").length;
    const hasAnswers = Object.keys(answers).length > 0;
    const status = unansweredCount === 0 ? "Ready to Apply" : hasAnswers ? "Needs Information" : "Readiness Started";

    const timeout = setTimeout(async () => {
      try {
        await base44.entities.Application.update(application.id, {
          scanner_answers: JSON.stringify(answers),
          readiness_score: readiness.score,
          ready_items: JSON.stringify(readiness.ready),
          needs_review_items: JSON.stringify(readiness.needsReview),
          missing_items: JSON.stringify(readiness.missing),
          optional_items: JSON.stringify(readiness.optional),
          resume_document_id: selectedResumeId,
          cover_letter_status: coverLetterStatus,
          cover_letter_signature: coverLetterViewedSig || "",
          notes,
          status,
        });
      } catch (err) {
        console.error("Workspace auto-save failed:", err);
      }
    }, 1200);
    return () => clearTimeout(timeout);
  }, [answers, selectedResumeId, coverLetterViewedSig, coverLetter, notes, application, readiness]);

  // === Computed display values ===
  const atsType = job?.ats_type || detectAtsType(job?.application_url) || detectAtsType(job?.posting_url);
  const showAtsNotice = atsType && requiresEmployerAccount(atsType);
  const matchResult = job
    ? computeMatchScore(job, { profile, education, employment, skills, credentials, preferences })
    : null;
  const answerableMissing = readiness?.missing.filter((m) => m.type !== "link") || [];
  const unansweredCount = answerableMissing.filter((m) => answers[m.id] === undefined || answers[m.id] === "").length;

  const handleAnswer = useCallback((itemId, value) => {
    setAnswers((prev) => ({ ...prev, [itemId]: value }));
  }, []);

  // === Loading / error states ===
  if (loading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">We couldn't find that job.</p>
        <Button onClick={() => navigate("/jobs")} className="mt-4">Back to Jobs</Button>
      </div>
    );
  }

  if (!readiness) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Unable to analyze this job.</p>
        <Button onClick={() => navigate(`/jobs/${id}`)} className="mt-4">Back to Job</Button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-5 pb-44 animate-fade-in">
      <button
        onClick={() => navigate(`/jobs/${id}`)}
        className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="w-5 h-5" />
        Back to job
      </button>

      <AssistantHeader
        job={job}
        application={application}
        onContinue={apply.handleContinueToEmployer}
        onMarkApplied={apply.handleMarkApplied}
      />

      <ReadinessSummary
        readiness={readiness}
        unansweredCount={unansweredCount}
        atsType={atsType}
        showAtsNotice={showAtsNotice}
        matchResult={matchResult}
      />

      <GuidedApplicationSteps
        jobId={id}
        readiness={readiness}
        profile={profile}
        job={job}
        employment={employment}
        education={education}
        skills={skills}
        reusableAnswers={reusableAnswers}
        answers={answers}
        onAnswer={handleAnswer}
        onAnswerSaved={refreshReusableAnswers}
        onContactComplete={() => setOpenNextCounter((c) => c + 1)}
      />

      <ApplicationProfile
        profile={profile}
        employment={employment}
        education={education}
        skills={skills}
        credentials={credentials}
        references={references}
        resumeDocs={resumeDocs}
        job={job}
        profileData={profileData}
        sectionStatuses={readiness.sections}
        notes={notes}
        onNotesChange={setNotes}
        openNextCounter={openNextCounter}
      />

      <ReviewSummary
        readiness={readiness}
        job={job}
        application={application}
        reusableAnswers={reusableAnswers}
      />

      <ApplicationPackageCard
        resumeStatus={resumeStatus}
        resumeReady={!!resume?.canGenerate}
        coverLetter={coverLetter}
        coverLetterStatus={coverLetterStatus}
        onOpenResume={() => navigate("/resume")}
        onCoverLetterOpened={handleCoverLetterOpened}
      />

      <ApplyActions job={job} apply={apply} />
    </div>
  );
}