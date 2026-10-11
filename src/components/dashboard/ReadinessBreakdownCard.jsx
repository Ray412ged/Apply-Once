import React from "react";
import { Link } from "react-router-dom";
import { Check, TrendingUp, Minus, ArrowRight } from "lucide-react";

export default function ReadinessBreakdownCard({ score, status, strengths = [], improveNext = [], notApplicable = [], explanation }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-medium text-muted-foreground">Application Readiness</p>
        <span className="text-sm font-semibold text-primary">{status}</span>
      </div>
      {explanation && (
        <p className="text-sm text-muted-foreground mb-2">{explanation}</p>
      )}
      <p className="text-4xl font-bold text-foreground">{score}%</p>

      <div className="h-2.5 rounded-full bg-muted overflow-hidden mt-3 mb-4">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${score}%` }}
        />
      </div>

      {strengths.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Check className="w-4 h-4 text-success" />
            <p className="text-xs font-semibold text-success">Strengths</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {strengths.map((s) => (
              <span key={s} className="text-xs bg-success/10 text-success px-2.5 py-1 rounded-full">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {improveNext.length > 0 && (() => {
        const rec = improveNext[0];
        const isStructured = typeof rec === "object" && rec !== null;
        if (!isStructured) {
          // Legacy string-array fallback (should not occur from the engine).
          return (
            <div className={strengths.length > 0 ? "mt-3" : ""}>
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp className="w-4 h-4 text-warning" />
                <p className="text-xs font-semibold text-warning">Improve Next</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {improveNext.map((s) => (
                  <span key={s} className="text-xs bg-warning/10 text-warning px-2.5 py-1 rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          );
        }
        return (
          <div className={strengths.length > 0 ? "mt-3" : ""}>
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp className="w-4 h-4 text-warning" />
              <p className="text-xs font-semibold text-warning">Improve Next</p>
            </div>
            <div className="bg-warning/5 border border-warning/20 rounded-xl p-3">
              <p className="text-sm font-semibold text-foreground">{rec.title}</p>
              {rec.description && (
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{rec.description}</p>
              )}
              {rec.route && (
                <Link
                  to={rec.route}
                  className="inline-flex items-center gap-1 mt-2.5 text-xs font-semibold text-primary hover:underline"
                >
                  {rec.cta || "Open"}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        );
      })()}

      {notApplicable.length > 0 && (
        <div className={strengths.length > 0 || improveNext.length > 0 ? "mt-3" : ""}>
          <div className="flex items-center gap-1.5 mb-2">
            <Minus className="w-4 h-4 text-muted-foreground/60" />
            <p className="text-xs font-semibold text-muted-foreground/60">Not Applicable</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {notApplicable.map((s) => (
              <span key={s} className="text-xs bg-muted text-muted-foreground/60 px-2.5 py-1 rounded-full">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}