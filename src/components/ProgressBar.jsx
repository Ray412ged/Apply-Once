import React from "react";
import { cn } from "@/lib/utils";

export default function ProgressBar({ value, className, showLabel = false }) {
  const pct = Math.min(100, Math.max(0, value || 0));
  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium text-muted-foreground">Profile completion</span>
          <span className="text-sm font-bold text-foreground">{Math.round(pct)}%</span>
        </div>
      )}
      <div className="h-3 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}