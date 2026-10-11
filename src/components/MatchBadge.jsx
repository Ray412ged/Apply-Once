import React from "react";
import { cn } from "@/lib/utils";

const MATCH_STYLES = {
  "Strong Match": "bg-success/10 text-success border-success/20",
  "Possible Match": "bg-primary/10 text-primary border-primary/20",
  "Stretch Opportunity": "bg-warning/10 text-warning border-warning/20",
  "Review Needed": "bg-muted text-muted-foreground border-border",
};

const DEFAULT_STYLE = "bg-muted text-muted-foreground border-border";

/**
 * @param {string} level - one of the canonical levels from computeMatchScore/
 *   computeMatchLevel ("Strong Match", "Possible Match", "Stretch Opportunity",
 *   "Review Needed").
 * @param {number} [score] - optional 0-100 score from computeMatchScore. When
 *   provided and > 0, renders "82% Match · Strong Match" instead of the level
 *   alone. Deliberately omitted (not fabricated as 0) when there isn't enough
 *   profile data to produce a meaningful score — computeMatchScore already
 *   returns level "Review Needed" in that case, which falls back to the
 *   existing level-only display rather than showing a misleading "0%".
 */
export default function MatchBadge({ level, score, className }) {
  const style = MATCH_STYLES[level] || DEFAULT_STYLE;
  const showScore = typeof score === "number" && score > 0 && level !== "Review Needed";
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border",
        style,
        className
      )}
    >
      {showScore ? `${score}% Match · ${level}` : level || "Review Needed"}
    </span>
  );
}