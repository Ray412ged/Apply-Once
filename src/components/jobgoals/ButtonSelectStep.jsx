import React from "react";

export default function ButtonSelectStep({ value, onChange, options }) {
  const toggle = (option) => {
    onChange(option === value ? undefined : option);
  };

  return (
    <div className="space-y-2.5">
      {options.map((option) => {
        const selected = value === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className={`w-full text-left p-4 rounded-xl text-base font-medium border-2 transition-colors ${
              selected
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border hover:border-primary/40"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}