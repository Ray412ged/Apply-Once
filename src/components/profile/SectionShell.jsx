import React from "react";
import { ChevronLeft } from "lucide-react";

export default function SectionShell({ title, subtitle, onPrev, children, footer }) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="sticky top-0 z-10 bg-background pt-4 pb-2">
        <button
          onClick={onPrev}
          className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>
      </div>
      <div className="flex-1 py-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>
        {subtitle && <p className="text-muted-foreground mb-6">{subtitle}</p>}
        {children}
      </div>
      {footer && (
        <div className="sticky bottom-16 bg-background py-3 space-y-2 -mx-4 px-4 border-t border-border">
          {footer}
        </div>
      )}
    </div>
  );
}