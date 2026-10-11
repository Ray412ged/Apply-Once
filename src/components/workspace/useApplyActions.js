import { useState, useEffect, useCallback } from "react";
import { recordActivity } from "@/lib/recordActivity";

/**
 * Owns the apply-flow state for the Application Workspace.
 *
 * The apply flow genuinely spans two UI locations — the header action buttons
 * at the top of the page and the sticky action bar at the bottom — so the
 * state is encapsulated here (called once by the thin parent) and distributed
 * to both surfaces as explicit props.
 *
 * Shared record mutations (Application status updates, employer-opened flag)
 * are delegated back to the parent via callbacks; this hook owns only the
 * apply-specific state: the external-apply modal, the post-apply return
 * prompt, the pending-external-apply tracker, and the in-flight saving flag.
 *
 * @param {object} params
 * @param {object} params.job - the active JobPosting
 * @param {object} params.application - the active Application record
 * @param {string} params.atsType - detected ATS type for the job
 * @param {string} params.notes - current workspace notes (used by Mark as Submitted)
 * @param {(partial: object) => Promise<object|null>} params.onApplicationUpdate - persists a partial Application update
 * @param {() => void} params.onEmployerOpened - records that the employer site was opened
 */
export function useApplyActions({ job, application, atsType, notes, onApplicationUpdate, onEmployerOpened }) {
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showReturnPrompt, setShowReturnPrompt] = useState(false);
  const [pendingExternalApply, setPendingExternalApply] = useState(false);
  const [saving, setSaving] = useState(false);

  // Surface the return prompt when the user returns from the employer site.
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "visible" && pendingExternalApply) {
        setPendingExternalApply(false);
        setShowReturnPrompt(true);
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [pendingExternalApply]);

  const needsExternalModal =
    job?.local_job && job?.application_method === "External website" && job?.posting_url;

  const openEmployerUrl = useCallback(async () => {
    setShowApplyModal(false);
    onEmployerOpened();
    if (application && atsType) {
      try {
        await onApplicationUpdate({ ats_type: atsType, status: "Application Started" });
      } catch (err) {
        console.error("Failed to update application:", err);
      }
    }
    const url = job?.application_url || job?.posting_url;
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
      setPendingExternalApply(true);
    }
  }, [application, atsType, job, onApplicationUpdate, onEmployerOpened]);

  const handleContinueToEmployer = useCallback(() => {
    if (needsExternalModal) {
      setShowApplyModal(true);
    } else {
      openEmployerUrl();
    }
  }, [needsExternalModal, openEmployerUrl]);

  const handleApplyResponse = useCallback(
    async (response) => {
      setShowReturnPrompt(false);
      if (!application) return;
      try {
        if (response === "applied") {
          await onApplicationUpdate({ status: "Submitted", application_submitted_date: new Date().toISOString() });
          recordActivity("application_submitted");
        } else if (response === "withdrawn") {
          await onApplicationUpdate({ status: "Withdrawn" });
        }
      } catch (err) {
        console.error("Failed to update application:", err);
      }
    },
    [application, onApplicationUpdate]
  );

  const handleMarkApplied = useCallback(async () => {
    if (!application) return;
    try {
      setSaving(true);
      await onApplicationUpdate({
        status: "Submitted",
        application_submitted_date: new Date().toISOString(),
        notes,
      });
      recordActivity("application_submitted");
    } catch (err) {
      console.error("Failed to mark as applied:", err);
    } finally {
      setSaving(false);
    }
  }, [application, notes, onApplicationUpdate]);

  const isApplied = application?.status === "Submitted";
  const destinationName = job?.local_job
    ? `${job?.employer_name}'s hiring website`
    : "the employer's website";
  const continueLabel = job?.local_job
    ? `Continue to ${job?.employer_name}`
    : "Continue to Employer Website";

  return {
    showApplyModal,
    setShowApplyModal,
    showReturnPrompt,
    setShowReturnPrompt,
    pendingExternalApply,
    saving,
    needsExternalModal,
    handleContinueToEmployer,
    openEmployerUrl,
    handleApplyResponse,
    handleMarkApplied,
    isApplied,
    destinationName,
    continueLabel,
  };
}