import React from "react";
import { Check } from "lucide-react";

export default function ReadyItemsList({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <h2 className="font-bold text-foreground mb-3">Ready from your profile</h2>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="bg-card rounded-xl border border-border p-3 flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-4 h-4 text-success" />
            </div>
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