import React from "react";

const DAY_OPTIONS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TIME_OPTIONS = ["Morning", "Afternoon", "Evening", "Overnight", "Weekends", "Flexible Schedule"];

function toggleInArray(arr, item, onChange) {
  if (arr?.includes(item)) {
    onChange(arr.filter((v) => v !== item));
  } else {
    onChange([...(arr || []), item]);
  }
}

export default function AvailabilityStep({ days = [], times = [], onDaysChange, onTimesChange }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-base font-medium mb-3">Days</p>
        <div className="flex flex-wrap gap-2">
          {DAY_OPTIONS.map((day) => {
            const selected = days.includes(day);
            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleInArray(days, day, onDaysChange)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${
                  selected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border hover:border-primary/40"
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <p className="text-base font-medium mb-3">Time preferences</p>
        <div className="flex flex-wrap gap-2">
          {TIME_OPTIONS.map((time) => {
            const selected = times.includes(time);
            return (
              <button
                key={time}
                type="button"
                onClick={() => toggleInArray(times, time, onTimesChange)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${
                  selected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border hover:border-primary/40"
                }`}
              >
                {time}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}