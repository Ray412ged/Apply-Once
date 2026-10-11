import React from "react";
import { Label } from "@/components/ui/label";
import { Check, AlertCircle } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 50 }, (_, i) => String(CURRENT_YEAR - i));

export function validateEmploymentDates(value) {
  if (value.currently_employed) return { valid: true };
  const { start_month, start_year, end_month, end_year } = value;
  if (!start_year || !end_year) return { valid: true };
  if (Number(end_year) < Number(start_year)) {
    return { valid: false, message: "Your end date cannot be earlier than your start date." };
  }
  if (Number(end_year) === Number(start_year) && start_month && end_month) {
    const startIdx = MONTHS.indexOf(start_month);
    const endIdx = MONTHS.indexOf(end_month);
    if (endIdx < startIdx) {
      return { valid: false, message: "Your end date cannot be earlier than your start date." };
    }
  }
  return { valid: true };
}

export default function EmploymentTimeline({ value = {}, onChange }) {
  const update = (field, val) => {
    onChange({ ...value, [field]: val });
  };

  const dateError = validateEmploymentDates(value);
  const hasEndError = !dateError.valid;

  return (
    <div className="space-y-6">
      {/* Start date */}
      <div className="space-y-3">
        <Label>Start date</Label>
        <p className="text-xs text-muted-foreground">Approximate is fine.</p>
        <div className="grid grid-cols-2 gap-3">
          <Select value={value.start_month || ""} onValueChange={(v) => update("start_month", v)}>
            <SelectTrigger className="h-12 text-base">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={value.start_year || ""} onValueChange={(v) => update("start_year", v)}>
            <SelectTrigger className="h-12 text-base">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Still employed */}
      <button
        type="button"
        onClick={() => update("currently_employed", !value.currently_employed)}
        className={`flex items-center gap-3 w-full p-4 rounded-xl border-2 transition-colors text-left ${
          value.currently_employed
            ? "bg-primary/5 border-primary"
            : "bg-card border-border hover:border-primary/40"
        }`}
      >
        <div
          className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
            value.currently_employed ? "bg-primary border-primary" : "border-input"
          }`}
        >
          {value.currently_employed && <Check className="w-4 h-4 text-primary-foreground" />}
        </div>
        <span className="text-sm font-medium">I still work here</span>
      </button>

      {/* End date (disabled if still employed) */}
      {!value.currently_employed && (
        <div className="space-y-3 animate-fade-in">
          <Label>End date</Label>
          <p className="text-xs text-muted-foreground">When did you leave this job?</p>
          <div className={`grid grid-cols-2 gap-3 ${hasEndError ? "ring-2 ring-destructive/30 rounded-xl p-1 -m-1" : ""}`}>
            <Select value={value.end_month || ""} onValueChange={(v) => update("end_month", v)}>
              <SelectTrigger className={`h-12 text-base ${hasEndError ? "border-destructive" : ""}`}>
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={value.end_year || ""} onValueChange={(v) => update("end_year", v)}>
              <SelectTrigger className={`h-12 text-base ${hasEndError ? "border-destructive" : ""}`}>
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map((y) => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {hasEndError && (
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">{dateError.message}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}