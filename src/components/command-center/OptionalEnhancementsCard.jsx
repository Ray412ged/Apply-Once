import React from "react";
import { GraduationCap, Award, Users, Briefcase, ArrowRight, Sparkles } from "lucide-react";

const ENHANCEMENT_ICON = {
  education: GraduationCap,
  credentials: Award,
  references: Users,
  employment: Briefcase,
};

/**
 * Optional enhancements surfaced separately from required profile actions.
 *
 * These never lower readiness, never replace the Next Best Step, and never
 * render as errors. They are shown whenever the engine returns them (whether
 * or not the user is Application Ready).
 */
export default function OptionalEnhancementsCard({ enhancements = [], onNavigate }) {
  if (!enhancements || enhancements.length === 0) return null;

  return (
    <section aria-label="Optional ways to strengthen your profile">
      <h2 className="text-lg font-bold text-foreground mb-1">
        Optional Ways to Strengthen Your Profile
      </h2>
      <p className="text-sm text-muted-foreground mb-3">
        These may help when a job asks for them, but they're not required for
        Application Ready status.
      </p>
      <div className="space-y-3">
        {enhancements.map((step) => {
          const Icon = ENHANCEMENT_ICON[step.sectionId] || Sparkles;
          return (
            <button
              key={step.id}
              onClick={() => onNavigate(step.route)}
              className="w-full bg-card rounded-2xl border border-border p-4 text-left hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-semibold text-foreground">{step.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{step.reason}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-2" />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}