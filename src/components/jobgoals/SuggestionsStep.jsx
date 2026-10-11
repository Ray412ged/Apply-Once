import React from "react";
import { Plus, Check } from "lucide-react";
import { getSuggestedOccupations } from "@/lib/occupationData";

export default function SuggestionsStep({ employmentRecords = [], selectedOccupations = [], onAdd }) {
  const suggestions = getSuggestedOccupations(employmentRecords, selectedOccupations);

  if (suggestions.length === 0) {
    return (
      <div className="bg-accent rounded-2xl p-6 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-success/15 flex items-center justify-center mx-auto">
          <Check className="w-6 h-6 text-success" />
        </div>
        <div>
          <p className="font-heading font-semibold text-foreground">
            Your experience is already well represented.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Let's continue building your profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {suggestions.map((occ, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onAdd(occ)}
          className="w-full text-left p-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">{occ}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Based on your experience</p>
            </div>
            <Plus className="w-5 h-5 text-primary" />
          </div>
        </button>
      ))}
    </div>
  );
}