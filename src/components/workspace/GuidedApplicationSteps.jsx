import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import GuidedProgressBar from "@/components/assistant/GuidedProgressBar";
import ContactInfoStep from "@/components/assistant/ContactInfoStep";
import MissingQuestionsList from "@/components/scanner/MissingQuestionsList";
import ReadyItemsList from "@/components/scanner/ReadyItemsList";
import ReviewItemsList from "@/components/scanner/ReviewItemsList";
import OpportunitiesList from "@/components/scanner/OpportunitiesList";
import QuestionGeneratorSection from "@/components/assistant/QuestionGeneratorSection";
import ReusableAnswersSection from "@/components/assistant/ReusableAnswersSection";
import { useGuidedStages } from "./useGuidedStages";

const CATEGORY_TO_TYPE = {
  preferences: "Availability",
  credentials: "Background",
  requirements: "Background",
  employment: "Experience",
  education: "Education",
  contact: "General",
  documents: "General",
  skills: "Experience",
  references: "General",
};

function mapCategoryToType(category) {
  return CATEGORY_TO_TYPE[category] || "General";
}

/**
 * The guided preparation workflow: progress checklist, contact step,
 * missing-requirements Q&A, ready/review/optional item lists, AI question
 * generator, and reusable answers.
 *
 * Owns the guided-stage checklist (via useGuidedStages) and the per-session
 * review-tracking state. Scanner answers are owned by the parent (they feed
 * the readiness header and the auto-save), so they arrive as props.
 */
export default function GuidedApplicationSteps({
  jobId,
  readiness,
  profile,
  job,
  employment,
  education,
  skills,
  reusableAnswers,
  answers,
  onAnswer,
  onAnswerSaved,
  onContactComplete,
}) {
  const { guidedStages, updateStage } = useGuidedStages(jobId);
  const [reviewedItems, setReviewedItems] = useState({});

  const handleToggleStage = (key) => updateStage(key);

  const handleContactComplete = (checked) => {
    updateStage("contact", !!checked);
    if (checked) onContactComplete?.();
  };

  const handleReview = (itemId) => {
    setReviewedItems((prev) => ({ ...prev, [itemId]: true }));
  };

  const handleSaveReusable = async (question, answer, category) => {
    const payload = {
      question,
      answer,
      question_type: mapCategoryToType(category),
      user_confirmed: true,
    };
    try {
      await base44.entities.ReusableAnswer.create(payload);
      onAnswerSaved?.();
    } catch (err) {
      console.error("Failed to save reusable answer:", err);
    }
  };

  return (
    <>
      <GuidedProgressBar stages={guidedStages} onToggle={handleToggleStage} />
      <ContactInfoStep profile={profile} completed={guidedStages.contact} onComplete={handleContactComplete} />

      <MissingQuestionsList
        items={readiness.missing}
        answers={answers}
        onAnswer={onAnswer}
        onSaveReusable={handleSaveReusable}
      />

      <ReadyItemsList items={readiness.ready} />

      <ReviewItemsList items={readiness.needsReview} reviewedItems={reviewedItems} onReview={handleReview} />

      <OpportunitiesList items={readiness.optional} />

      <div id="question-generator-section">
        <QuestionGeneratorSection
          profile={profile}
          employment={employment}
          education={education}
          skills={skills}
          job={job}
          reusableAnswers={reusableAnswers}
          onAnswerSaved={onAnswerSaved}
        />
      </div>
      <ReusableAnswersSection answers={reusableAnswers} status={readiness.sections.reusableAnswers} />
    </>
  );
}