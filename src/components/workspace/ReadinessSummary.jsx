import React from "react";
import ScannerHeader from "@/components/scanner/ScannerHeader";
import MatchExplanationSection from "@/components/scanner/MatchExplanationSection";
import AtsNotice from "@/components/assistant/AtsNotice";
import MatchScoreSection from "@/components/assistant/MatchScoreSection";

/**
 * Top-of-page readiness overview for the Application Workspace.
 *
 * Shows the readiness score header, ATS notice, match score, and match
 * explanation. The "Continue to Employer Website" CTA's scroll targets
 * live in other workspace sections, so the scroll handlers resolve element
 * IDs from the DOM directly.
 */
export default function ReadinessSummary({ readiness, unansweredCount, atsType, showAtsNotice, matchResult }) {
  const handleHighlightExperience = () =>
    document.getElementById("employment-section")?.scrollIntoView({ behavior: "smooth" });

  const handleAnswerManually = () =>
    document.getElementById("question-generator-section")?.scrollIntoView({ behavior: "smooth" });

  return (
    <>
      <ScannerHeader
        score={readiness.score}
        readyCount={readiness.itemReadyCount}
        totalItems={readiness.itemTotalCount}
        missingCount={unansweredCount}
        atsInfo={readiness.atsInfo}
        profileCompletion={readiness.profileCompletion}
        remainingQuestions={readiness.remainingQuestions}
      />

      {showAtsNotice && <AtsNotice atsType={atsType} />}

      <MatchScoreSection
        matchResult={matchResult}
        onHighlightExperience={handleHighlightExperience}
        onAnswerManually={handleAnswerManually}
      />

      {readiness.matchReasons.length > 0 && <MatchExplanationSection reasons={readiness.matchReasons} />}
    </>
  );
}