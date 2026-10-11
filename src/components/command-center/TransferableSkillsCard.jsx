import React from "react";
import { Wrench, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Surfaces transferable skills identified by the engine from the user's
 * experience — including informal work, caregiving, volunteer work,
 * training, and self-employment. Performs no skill scoring of its own.
 *
 * When none are available yet, the empty state ties directly to the
 * engine's Next Best Step so the user has a clear path forward.
 */
export default function TransferableSkillsCard({ skills = [], onNextStep, nextStepTitle }) {
  if (skills.length === 0) {
    return (
      <section aria-label="Transferable skills">
        <div className="flex items-center gap-2 mb-3">
          <Wrench className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Transferable Skills</h2>
        </div>
        <div className="bg-card rounded-2xl border border-dashed border-border p-5 text-center">
          <p className="text-sm text-muted-foreground">
            We'll identify transferable skills from your experience — including
            volunteer work, caregiving, training, and self-employment — once you
            add it.
          </p>
          {onNextStep && (
            <Button variant="outline" onClick={onNextStep} className="mt-3 h-10 text-sm font-medium">
              {nextStepTitle || "Add your experience"}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Transferable skills">
      <div className="flex items-center gap-2 mb-3">
        <Wrench className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground">Transferable Skills</h2>
        <span className="text-sm text-muted-foreground ml-auto">{skills.length} identified</span>
      </div>
      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex flex-wrap gap-1.5">
          {skills.slice(0, 8).map((skill) => (
            <span
              key={skill.skill_name}
              className="text-xs bg-accent text-accent-foreground px-2.5 py-1 rounded-full"
            >
              {skill.skill_name}
            </span>
          ))}
          {skills.length > 8 && (
            <span className="text-xs text-muted-foreground px-2.5 py-1">
              +{skills.length - 8} more
            </span>
          )}
        </div>
      </div>
    </section>
  );
}