import React from "react";
import { TrendingUp, Activity } from "lucide-react";

/**
 * Lightweight progress summary from the engine's `progressHistory`.
 * Shows the most recent milestone only — not a full analytics dashboard.
 * Omitted entirely when there is no meaningful history.
 */
export default function ProgressSummary({ progressHistory = [] }) {
  if (!progressHistory || progressHistory.length === 0) return null;

  const latest = progressHistory[0];
  if (!latest) return null;

  const hasScores =
    latest.previousScore != null && latest.newScore != null && latest.previousScore !== latest.newScore;
  const improved = hasScores && latest.newScore > latest.previousScore;
  const Icon = improved ? TrendingUp : Activity;

  const message = hasScores
    ? `Your readiness ${improved ? "improved" : "updated"} from ${latest.previousScore}% to ${latest.newScore}%.`
    : latest.trigger || "Profile updated.";

  return (
    <section aria-label="Progress">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground">Progress</h2>
      </div>
      <div className="bg-card rounded-2xl border border-border p-4">
        <p className="text-sm text-foreground">{message}</p>
      </div>
    </section>
  );
}