import React from "react";
import ReadinessScore from "@/components/assistant/ReadinessScore";
import ApplicationSummary from "@/components/assistant/ApplicationSummary";
import MissingInfoSection from "@/components/assistant/MissingInfoSection";

/**
 * Pre-submit readiness review shown at the bottom of the workspace, after
 * all profile and preparation sections. Summarizes readiness,
 * application details, and any sections still missing information.
 */
export default function ReviewSummary({ readiness, job, application, reusableAnswers }) {
  return (
    <div className="pt-4 space-y-4">
      <ReadinessScore readiness={readiness} />
      <ApplicationSummary job={job} application={application} readiness={readiness} reusableAnswers={reusableAnswers} />
      <MissingInfoSection sections={readiness.sections} />
    </div>
  );
}