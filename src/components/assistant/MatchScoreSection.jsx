import React, { useState } from "react";
import { Target, TrendingUp, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const LEVEL_COLORS = {
  "Strong Match": "bg-success/10 text-success border-success/20",
  "Possible Match": "bg-primary/10 text-primary border-primary/20",
  "Stretch Opportunity": "bg-warning/10 text-warning border-warning/20",
  "Review Needed": "bg-muted text-muted-foreground border-border",
};

const RING_COLORS = {
  "Strong Match": "text-success",
  "Possible Match": "text-primary",
  "Stretch Opportunity": "text-warning",
  "Review Needed": "text-muted-foreground",
};

export default function MatchScoreSection({
  matchResult,
  onHighlightExperience,
  onAnswerManually,
}) {
  const [skipped, setSkipped] = useState([]);

  if (!matchResult) return null;

  const { score, level, reasons, missing } = matchResult;
  const levelClass = LEVEL_COLORS[level] || LEVEL_COLORS["Review Needed"];
  const ringClass = RING_COLORS[level] || RING_COLORS["Review Needed"];
  const visibleMissing = (missing || [])
    .map((item, index) => ({ item, index }))
    .filter(({ index }) => !skipped.includes(index));

  return (
    <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Target className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Match Score</h3>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-shrink-0 relative w-16 h-16 flex items-center justify-center">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-muted"
              strokeDasharray="100, 100"
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className={ringClass}
              strokeDasharray={`${score}, 100`}
              strokeLinecap="round"
            />
          </svg>
          <span className="text-lg font-bold text-foreground">{score}</span>
        </div>
        <div className="flex-1 min-w-0">
          <span
            className={`inline-block text-sm font-medium rounded-full px-3 py-1 border ${levelClass}`}
          >
            {level}
          </span>
          <p className="text-xs text-muted-foreground mt-1.5">
            Based on your education, experience, skills, licenses, certifications, and
            career goals.
          </p>
        </div>
      </div>

      {/* Reasons */}
      <div className="space-y-1.5 pt-2 border-t border-border">
        <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5" />
          Why this score was assigned
        </p>
        <ul className="space-y-1">
          {reasons.map((reason, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-xs text-muted-foreground"
            >
              <span className="w-1 h-1 rounded-full bg-muted-foreground mt-1.5 flex-shrink-0" />
              {reason}
            </li>
          ))}
        </ul>
      </div>

      {/* Missing qualifications with AI safety */}
      {visibleMissing.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border">
          <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-warning" />
            Missing Qualifications
          </p>
          {visibleMissing.map(({ item, index }) => (
            <div
              key={index}
              className="bg-warning/5 rounded-xl border border-warning/20 p-3 space-y-2"
            >
              <p className="text-sm text-foreground">{item}</p>
              <p className="text-xs text-muted-foreground italic">
                I couldn't verify this qualification from your profile.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={onHighlightExperience}
                >
                  Highlight Related Experience
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={onAnswerManually}
                >
                  Answer Manually
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={() => setSkipped((prev) => [...prev, index])}
                >
                  Skip
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}