import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Calendar } from "lucide-react";

const OPTIONS = ["Immediately", "Within One Week", "Within Two Weeks", "Next Month", "Select Specific Date"];

export default function StartDateStep({ value, onChange }) {
  const isDateValue = value && !OPTIONS.includes(value);
  const [showDatePicker, setShowDatePicker] = useState(isDateValue);

  const handleSelect = (option) => {
    if (option === "Select Specific Date") {
      setShowDatePicker(true);
      if (!isDateValue) onChange("");
    } else {
      setShowDatePicker(false);
      onChange(option);
    }
  };

  return (
    <div className="space-y-2.5">
      {OPTIONS.map((option) => {
        const selected = !showDatePicker && !isDateValue && value === option;
        const dateSelected = option === "Select Specific Date" && (showDatePicker || isDateValue);
        return (
          <button
            key={option}
            type="button"
            onClick={() => handleSelect(option)}
            className={`w-full text-left p-4 rounded-xl text-base font-medium border-2 transition-colors ${
              selected || dateSelected
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border hover:border-primary/40"
            }`}
          >
            {option}
          </button>
        );
      })}
      {(showDatePicker || isDateValue) && (
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
          <Input
            type="date"
            value={isDateValue ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            className="h-12 text-base pl-10"
          />
        </div>
      )}
    </div>
  );
}