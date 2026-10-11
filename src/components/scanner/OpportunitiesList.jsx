import React from "react";
import { Lightbulb } from "lucide-react";

export default function OpportunitiesList({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <h2 className="font-bold text-foreground mb-1">Opportunities to strengthen your application</h2>
      <p className="text-xs text-muted-foreground mb-3">Optional — these won't affect your readiness score.</p>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="bg-accent/50 rounded-xl border border-border p-3 flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground text-sm">{item.label}</p>
              {item.detail && (
                <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}