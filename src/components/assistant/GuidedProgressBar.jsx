import React from "react";
import { Check } from "lucide-react";

const STAGES = [
  { key: "employer_account", label: "Employer Account" },
  { key: "contact", label: "Contact Info" },
  { key: "employment", label: "Employment History" },
  { key: "education", label: "Education" },
  { key: "resume", label: "Resume Upload" },
  { key: "questions", label: "Employer Questions" },
  { key: "review", label: "Review" },
];

export default function GuidedProgressBar({ stages, onToggle }) {
  const completedCount = STAGES.filter((s) => stages[s.key]).length;
  const percent = Math.round((completedCount / STAGES.length) * 100);

  return (
    <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Application Progress</h3>
        <span className="text-xs text-muted-foreground font-medium">
          {completedCount}/{STAGES.length}
        </span>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {STAGES.map((stage) => {
          const done = stages[stage.key];
          return (
            <button
              key={stage.key}
              onClick={() => onToggle(stage.key)}
              className={`flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-1.5 transition-colors border ${
                done
                  ? "bg-success/10 text-success border-success/20"
                  : "bg-transparent text-muted-foreground border-border hover:bg-accent"
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                  done ? "bg-success text-success-foreground" : "border border-border"
                }`}
              >
                {done && <Check className="w-3 h-3" />}
              </span>
              {stage.label}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">Tap a stage to mark it complete.</p>
    </div>
  );
}