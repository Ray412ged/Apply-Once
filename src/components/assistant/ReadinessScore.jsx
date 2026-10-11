import React from "react";
import { Gauge, CheckCircle2, AlertCircle, Circle } from "lucide-react";

export default function ReadinessScore({ readiness }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gauge className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Application Readiness</h3>
        </div>
        <span className="text-2xl font-bold text-primary">{readiness.percentage}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-success rounded-full transition-all"
          style={{ width: `${readiness.percentage}%` }}
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="flex items-center gap-1.5 text-sm">
          <CheckCircle2 className="w-4 h-4 text-success" />
          <span className="text-foreground">{readiness.readyCount} Ready</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <AlertCircle className="w-4 h-4 text-warning" />
          <span className="text-foreground">{readiness.needsReviewCount} Review</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <Circle className="w-4 h-4 text-muted-foreground" />
          <span className="text-foreground">{readiness.missingCount} Missing</span>
        </div>
      </div>
    </div>
  );
}