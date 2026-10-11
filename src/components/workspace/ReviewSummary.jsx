import React from "react";
import ReadinessScore from "@/components/assistant/ReadinessScore";
import ApplicationSummary from "@/components/assistant/ApplicationSummary";
import ApplicationProgress from "@/components/assistant/ApplicationProgress";
import MissingInfoSection from "@/components/assistant/MissingInfoSection";

/**
 * Pre-submit readiness review shown at the bottom of the workspace, after
 * all profile and preparation sections. Summarizes the readiness score,
 * application details, progress, and any sections still missing information.
 */
export default function ReviewSummary({ readiness, job, application, reusableAnswers, progress }) {
  return (
    <div className="pt-4 space-y-4">
      <ReadinessScore readiness={readiness} />
      <ApplicationSummary job={job} application={application} readiness={readiness} reusableAnswers={reusableAnswers} />
      {progress && <ApplicationProgress progress={progress} />}
      <MissingInfoSection sections={readiness.sections} />
    </div>
  );
}