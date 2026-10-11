import React from "react";
import { PROFILE_SECTIONS } from "@/lib/profileSections";

export default function OnboardingProgress({ currentSectionId, completionPercentage = 0 }) {
  const currentIndex = PROFILE_SECTIONS.findIndex((s) => s.id === currentSectionId);
  if (currentIndex === -1) return null;

  const stepNumber = currentIndex + 1;
  const totalSteps = PROFILE_SECTIONS.length;
  const section = PROFILE_SECTIONS[currentIndex];
  const estimatedMinutes = section?.estimatedMinutes;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-foreground">
          Step {stepNumber} of {totalSteps}
        </span>
        <span className="text-xs text-muted-foreground">
          {completionPercentage}% complete{estimatedMinutes ? ` · ~${estimatedMinutes} min` : ""}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${completionPercentage}%` }}
        />
      </div>
    </div>
  );
}