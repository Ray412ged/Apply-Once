import React from "react";
import { CheckCircle } from "lucide-react";

export default function MatchExplanationSection({ reasons }) {
  if (!reasons || reasons.length === 0) return null;
  return (
    <div className="bg-success/5 rounded-2xl border border-success/20 p-5">
      <h2 className="font-bold text-foreground mb-3">Why this opportunity fits your experience</h2>
      <ul className="space-y-2">
        {reasons.map((reason, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-foreground">
            <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
            <span>{reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}