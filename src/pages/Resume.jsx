import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProfileData } from "@/hooks/useProfileData";
import { useAuth } from "@/lib/AuthContext";
import { isGuest } from "@/lib/guestStorage";
import { generateResume } from "@/lib/resume/resumeGenerator";
import { downloadResumePdf } from "@/lib/resume/resumePdf";
import { markResumeViewed } from "@/lib/resume/resumeStorage";
import ResumeDocument from "@/components/resume/ResumeDocument";
import GuestAccountPrompt from "@/components/jobs/GuestAccountPrompt";
import { DashboardSkeleton } from "@/components/Skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Download, Printer, Briefcase } from "lucide-react";

export default function Resume() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: profileData, isLoading } = useProfileData();
  const guest = isGuest();

  const resume = useMemo(
    () => (profileData ? generateResume(profileData) : null),
    [profileData]
  );

  const [showGuestGate, setShowGuestGate] = useState(false);

  // When an authenticated user views the resume, reset the "Updated"
  // signature so the Command Center returns to the "Ready" state until
  // the next profile change.
  useEffect(() => {
    if (resume?.canGenerate) {
      markResumeViewed(resume, { user, guest, profileId: profileData?.profile?.id });
    }
  }, [resume, user, guest]);

  if (isLoading || !resume) return <DashboardSkeleton />;

  // Guest download gate — account required to save/download.
  if (showGuestGate && guest) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-6 no-print">
          <Button variant="ghost" size="sm" onClick={() => setShowGuestGate(false)} className="mb-2">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Resume
          </Button>
        </div>
        <GuestAccountPrompt
          redirectPath="/resume"
          onReturn={() => setShowGuestGate(false)}
          variant="page"
        />
      </div>
    );
  }

  if (!resume.canGenerate) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-4 no-print">
          <h1 className="text-xl font-bold text-foreground">Your resume isn't ready yet</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Add your name, a contact method, at least one experience record, and at least three skills
            to generate your resume. Your professional summary, education, and certifications will
            strengthen it but aren't required.
          </p>
          <div className="flex flex-col gap-2">
            <Button onClick={() => navigate("/profile/edit?section=employment")}>
              <Pencil className="w-4 h-4 mr-1.5" /> Continue Profile
            </Button>
            <Button variant="outline" onClick={() => navigate("/home")}>
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Command Center
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleDownload = () => {
    if (guest) {
      setShowGuestGate(true);
      return;
    }
    downloadResumePdf(resume);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Action toolbar — hidden when printing */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border no-print">
        <div className="max-w-[820px] mx-auto px-4 py-3 flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/home")}>
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Command Center
          </Button>
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={() => navigate("/profile/edit?section=about")}>
            <Pencil className="w-4 h-4 mr-1.5" /> Edit Profile
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-1.5" /> Print
          </Button>
          <Button size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-1.5" /> Download PDF
          </Button>
        </div>
      </div>

      {/* Resume preview */}
      <div className="py-6 px-4">
        <ResumeDocument resume={resume} />
      </div>

      {/* Footer actions — hidden when printing */}
      <div className="max-w-[820px] mx-auto px-4 pb-12 pt-2 flex flex-wrap gap-2 no-print">
        <Button variant="outline" onClick={() => navigate("/jobs")}>
          <Briefcase className="w-4 h-4 mr-1.5" /> Continue to Job Matches
        </Button>
      </div>
    </div>
  );
}