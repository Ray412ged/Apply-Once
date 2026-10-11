import React from "react";
import { Check } from "lucide-react";
import { WORK_CATEGORIES } from "@/lib/occupationData";

export default function WorkCategoriesStep({ value = [], onChange }) {
  const toggle = (category) => {
    if (value.includes(category)) {
      onChange(value.filter((v) => v !== category));
    } else {
      onChange([...value, category]);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {WORK_CATEGORIES.map((category) => {
        const selected = value.includes(category);
        return (
          <button
            key={category}
            type="button"
            onClick={() => toggle(category)}
            className={`p-4 rounded-2xl text-left border-2 transition-all ${
              selected
                ? "bg-primary/5 border-primary ring-2 ring-primary/20"
                : "bg-card border-border hover:border-primary/40"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  selected ? "bg-primary border-primary" : "border-input"
                }`}
              >
                {selected && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
              </div>
              <span className="text-sm font-medium text-foreground">{category}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}