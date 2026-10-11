import React from "react";
import { Button } from "@/components/ui/button";
import { Check, Briefcase, ArrowRight, Plus } from "lucide-react";

// Post-save acknowledgment shown after a user manually adds employment history
// during onboarding. Celebrates the accomplishment and offers the next step.
export default function BuilderEndScreen({
  savedCount = 0,
  onContinue,
  onAddAnother,
  onReturnToProfile,
  nextSectionLabel,
  nextSectionRoute,
}) {
  const positionLabel = `${savedCount} ${savedCount === 1 ? "position" : "positions"} added`;

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto px-5 py-8">
      <div className="flex-1 flex flex-col justify-center text-center">
        <div className="w-20 h-20 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-success" />
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">Job Added</h1>
        <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
          Your employment experience has been saved.
        </p>

        <div className="bg-card rounded-2xl border border-border p-5 flex items-center gap-4 mb-8 text-left">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Briefcase className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="font-heading font-semibold text-foreground">Review Employment History</p>
            <p className="text-sm text-muted-foreground">{positionLabel}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Button onClick={onContinue} className="w-full h-14 text-base font-semibold">
          {nextSectionLabel ? `Continue to ${nextSectionLabel}` : "Continue to Next Step"}
          <ArrowRight className="w-5 h-5 ml-1" />
        </Button>
        {onAddAnother && (
          <Button onClick={onAddAnother} variant="outline" className="w-full h-12 font-semibold">
            <Plus className="w-5 h-5 mr-1" />
            Add Another Position
          </Button>
        )}
      </div>
    </div>
  );
}