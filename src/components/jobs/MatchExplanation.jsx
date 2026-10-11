import React from "react";
import { CheckCircle } from "lucide-react";
import { getStructuredMatchReasons } from "@/lib/matching";

export default function MatchExplanation({ job, preferences, profileData }) {
  const reasons = getStructuredMatchReasons(job, preferences, profileData);
  if (reasons.length === 0) return null;

  return (
    <div className="bg-success/5 rounded-xl border border-success/20 p-3 mt-3">
      <p className="text-xs font-semibold text-success mb-2">Why this matches you</p>
      <ul className="space-y-1">
        {reasons.map((r, i) => (
          <li key={i} className="flex items-start gap-1.5 text-xs text-foreground">
            <CheckCircle className="w-3.5 h-3.5 text-success flex-shrink-0 mt-0.5" />
            <span>{r.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}