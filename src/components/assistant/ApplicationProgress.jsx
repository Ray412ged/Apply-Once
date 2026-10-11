import React from "react";
import { Check } from "lucide-react";

const STAGES = [
  { key: "started", label: "Started" },
  { key: "preparing", label: "Preparing" },
  { key: "completing", label: "Completing" },
  { key: "submitted", label: "Submitted" },
  { key: "completed", label: "Completed" },
];

export default function ApplicationProgress({ progress }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Application Progress</h3>
        <span className="text-sm font-medium text-primary">{progress.percentage}%</span>
      </div>
      <div className="flex items-start">
        {STAGES.map((stage, i) => {
          const isDone = progress.stages[stage.key];
          const nextDone = i < STAGES.length - 1 && progress.stages[STAGES[i + 1].key];
          return (
            <div key={stage.key} className="flex items-start flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1 w-full">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                    isDone ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span
                  className={`text-xs text-center ${
                    isDone ? "text-foreground font-medium" : "text-muted-foreground"
                  }`}
                >
                  {stage.label}
                </span>
              </div>
              {i < STAGES.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-1 mt-3.5 ${
                    isDone && nextDone ? "bg-success" : isDone ? "bg-primary/40" : "bg-muted"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}