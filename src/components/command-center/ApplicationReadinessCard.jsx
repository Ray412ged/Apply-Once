import React from "react";
import ReadinessBreakdownCard from "@/components/dashboard/ReadinessBreakdownCard";
import { getReadinessExplanation } from "./statusHelpers";

/**
 * Surfaces the canonical Application Readiness score, status, strengths,
 * and highest-priority improvement area. All values come from the engine's
 * `applicationReadiness` object — this component performs no scoring.
 */
export default function ApplicationReadinessCard({ readiness }) {
  if (!readiness) return null;

  return (
    <ReadinessBreakdownCard
      score={readiness.score}
      status={readiness.status}
      strengths={readiness.strengths}
      improveNext={readiness.improveNext}
      notApplicable={readiness.notApplicable}
      explanation={getReadinessExplanation(readiness.status)}
    />
  );
}