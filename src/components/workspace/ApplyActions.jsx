import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink, CheckCircle2, Mail, Phone, FileCheck } from "lucide-react";
import ExternalApplyModal from "@/components/jobs/ExternalApplyModal";
import ReturnPrompt from "@/components/jobs/ReturnPrompt";

/**
 * The apply-flow surface: the sticky action bar, the external-apply modal,
 * and the post-apply return prompt.
 *
 * This is a presentational component — all apply-flow state and handlers
 * are owned by the `useApplyActions` hook (called in the parent) and arrive
 * via the `apply` prop bag. Shared record updates are delegated back to the
 * parent through the hook's callbacks.
 */
export default function ApplyActions({ job, apply }) {
  const {
    showApplyModal,
    setShowApplyModal,
    showReturnPrompt,
    handleApplyResponse,
    openEmployerUrl,
    handleContinueToEmployer,
    handleMarkApplied,
    saving,
    isApplied,
    destinationName,
    continueLabel,
  } = apply;

  return (
    <>
      <div className="fixed bottom-20 inset-x-0 z-30 px-4 max-w-xl mx-auto">
        <div className="bg-card rounded-2xl border border-border shadow-lg p-3 space-y-2">
          {job.local_job && job.application_method === "Email employer" && job.application_email ? (
            <Button size="sm" className="w-full h-12 font-semibold" asChild>
              <a href={`mailto:${job.application_email}`}>
                <Mail className="w-5 h-5 mr-1" />
                Email Employer
              </a>
            </Button>
          ) : job.local_job && job.application_method === "Call employer" && job.application_phone ? (
            <Button size="sm" className="w-full h-12 font-semibold" asChild>
              <a href={`tel:${job.application_phone}`}>
                <Phone className="w-5 h-5 mr-1" />
                Call Employer
              </a>
            </Button>
          ) : job.local_job && (job.application_method === "Apply in person" || job.application_method === "Employer instructions") ? (
            <Button
              size="sm"
              className="w-full h-12 font-semibold"
              onClick={() => document.getElementById("application-instructions")?.scrollIntoView({ behavior: "smooth" })}
            >
              <FileCheck className="w-5 h-5 mr-1" />
              View Application Instructions
            </Button>
          ) : (
            <Button
              size="sm"
              className="w-full h-12 font-semibold"
              onClick={handleContinueToEmployer}
              disabled={saving || (!job.application_url && !job.posting_url)}
            >
              <ExternalLink className="w-5 h-5 mr-1" />
              Continue to Employer Website
            </Button>
          )}
          <Button
            variant={isApplied ? "secondary" : "default"}
            onClick={handleMarkApplied}
            disabled={saving || isApplied}
            className="w-full h-12 font-medium"
          >
            {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
            {isApplied ? "Applied" : "Mark as Applied"}
          </Button>
        </div>
      </div>

      <ExternalApplyModal
        open={showApplyModal}
        onContinue={openEmployerUrl}
        onReview={() => setShowApplyModal(false)}
        onCancel={() => setShowApplyModal(false)}
        jobTitle={job?.job_title}
        employerName={job?.employer_name}
        destinationName={destinationName}
        continueLabel={continueLabel}
      />

      <ReturnPrompt
        open={showReturnPrompt}
        onRespond={handleApplyResponse}
        jobTitle={job?.job_title}
        employerName={job?.employer_name}
      />
    </>
  );
}