import React from "react";
import { AlertCircle, Check } from "lucide-react";

export default function ReviewItemsList({ items, reviewedItems, onReview }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <h2 className="font-bold text-foreground mb-3">Needs your review</h2>
      <div className="space-y-2">
        {items.map((item) => {
          const isReviewed = reviewedItems[item.id];
          return (
            <div
              key={item.id}
              className={`bg-card rounded-xl border p-3 ${isReviewed ? "border-success/30" : "border-warning/30"}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isReviewed ? "bg-success/10" : "bg-warning/10"}`}>
                  {isReviewed ? (
                    <Check className="w-4 h-4 text-success" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-warning" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">{item.label}</p>
                  {item.detail && (
                    <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
                  )}
                  {item.reason && (
                    <p className="text-xs text-warning mt-1">{item.reason}</p>
                  )}
                </div>
                {!isReviewed && (
                  <button
                    onClick={() => onReview(item.id)}
                    className="text-xs font-medium text-primary hover:underline flex-shrink-0"
                  >
                    Review
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}