import React, { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, ExternalLink, Plus, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import CopyButton from "./CopyButton";

export default function ApplicationCompanion({
  questions,
  currentStep,
  copiedIds,
  lastCopiedId,
  showReturnBanner,
  jobUrl,
  employerName,
  onCopySuccess,
  onEditAnswer,
  onNext,
  onPrev,
  onJumpTo,
  onDismissReturnBanner,
  onAddMore,
}) {
  const [showAll, setShowAll] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  if (questions.length === 0) return null;

  const current = questions[currentStep];
  const isCopied = copiedIds.includes(current.id);
  const isLast = currentStep === questions.length - 1;
  const progress = ((currentStep + 1) / questions.length) * 100;
  const allCopied = copiedIds.length === questions.length;

  const lastCopied = questions.find((q) => q.id === lastCopiedId);
  const lastCopiedIndex = questions.findIndex((q) => q.id === lastCopiedId);
  const hasNextAfterCopied = lastCopied && lastCopiedIndex >= 0 && lastCopiedIndex < questions.length - 1;

  const openEmployerApp = () => {
    if (jobUrl) {
      window.open(jobUrl, "employerApplication", "noopener,noreferrer");
    }
  };

  const handleContinue = () => {
    onDismissReturnBanner();
    if (hasNextAfterCopied) {
      onJumpTo(lastCopiedIndex + 1);
    }
  };

  const slideVariants = prefersReducedMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 } };

  return (
    <div className="space-y-3">
      {/* Return banner — shown when user returns after copying */}
      {showReturnBanner && lastCopied && (
        <div
          className="bg-success/10 border border-success/30 rounded-xl p-3 flex items-start gap-2 animate-fade-in"
          role="status"
          aria-live="polite"
        >
          <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground">
              You copied: <span className="font-medium">{lastCopied.question}</span>
            </p>
            {hasNextAfterCopied && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Next: {questions[lastCopiedIndex + 1].question}
              </p>
            )}
            <Button size="sm" className="mt-2 h-8" onClick={handleContinue}>
              Continue
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
          <button
            onClick={onDismissReturnBanner}
            className="p-1 text-muted-foreground hover:text-foreground"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Companion card */}
      <div className="border border-primary/30 rounded-xl p-4 space-y-3 bg-card">
        {/* Header with progress and view-all toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-foreground">
            Question {currentStep + 1} of {questions.length}
          </span>
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-primary font-medium hover:underline"
          >
            {showAll ? "Hide list" : "View all"}
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* All copied message */}
        {allCopied && (
          <div
            className="flex items-center gap-2 text-sm text-success font-medium bg-success/10 rounded-lg p-3"
            role="status"
            aria-live="polite"
          >
            <Check className="w-4 h-4" />
            All answers copied. Open the employer application to paste them.
          </div>
        )}

        {/* Current question and answer */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={prefersReducedMotion ? { duration: 0.1 } : { duration: 0.2 }}
            className="space-y-2"
          >
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Question</p>
              <p className="text-sm text-foreground font-medium">{current.question}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Your answer</p>
              <Textarea
                value={current.answer}
                onChange={(e) => onEditAnswer(current.id, e.target.value)}
                className="min-h-[120px] text-sm"
              />
            </div>
            {current.source === "generated" && (
              <p className="text-xs text-warning">AI draft — review before using</p>
            )}
            {current.source === "saved" && (
              <p className="text-xs text-muted-foreground">From your saved answers</p>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Primary copy action */}
        <CopyButton
          text={current.answer}
          label="Copy answer"
          size="default"
          variant="default"
          className="w-full h-12 text-base font-semibold"
          onCopySuccess={() => onCopySuccess(current.id)}
        />

        {/* Next question — appears after successful copy */}
        {isCopied && !isLast && (
          <Button
            onClick={onNext}
            className="w-full h-12 text-base font-semibold animate-fade-in"
          >
            Next question
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}

        {/* Navigation: prev / next */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPrev}
            disabled={currentStep === 0}
            className="h-9"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          {!isLast ? (
            <Button variant="ghost" size="sm" onClick={onNext} className="h-9">
              Skip
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">Last question</span>
          )}
        </div>

        {/* Open employer application — named window prevents duplicate tabs */}
        {jobUrl && (
          <Button variant="outline" onClick={openEmployerApp} className="w-full h-11">
            <ExternalLink className="w-4 h-4" />
            Open {employerName} Application
          </Button>
        )}

        {/* Add another question */}
        <Button variant="ghost" size="sm" onClick={onAddMore} className="w-full">
          <Plus className="w-4 h-4" />
          Add another question
        </Button>
      </div>

      {/* View all answers list */}
      {showAll && (
        <div className="space-y-2">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => onJumpTo(i)}
              className={`w-full text-left border rounded-lg p-3 transition-colors ${
                i === currentStep ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-medium text-muted-foreground">Q{i + 1}</span>
                {copiedIds.includes(q.id) && (
                  <span className="flex items-center gap-1 text-xs text-success font-medium">
                    <Check className="w-3 h-3" />
                    Copied
                  </span>
                )}
              </div>
              <p className="text-sm text-foreground truncate">{q.question}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}