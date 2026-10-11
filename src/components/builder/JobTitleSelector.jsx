import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { COMMON_JOB_TITLES } from "@/lib/builder/jobTitleData";
import { getJobTitlesForEmployerType, getTaxonomyEntry } from "@/lib/builder/employmentTaxonomy";

export default function JobTitleSelector({ value = "", onChange, employerName, employerType }) {
  const [showAll, setShowAll] = useState(false);

  // Use taxonomy-based suggestions when an employer type is known,
  // falling back to the general common job titles list.
  const contextTitles = getJobTitlesForEmployerType(employerType);
  const taxonomyEntry = getTaxonomyEntry(employerType);
  const suggestions = contextTitles || COMMON_JOB_TITLES;

  // Show first 8 suggestions by default, expand to show all
  const visibleTitles = showAll ? suggestions : suggestions.slice(0, 8);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="job-title">Your job title</Label>
        <Input
          id="job-title"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Example: Cashier, Cook, Laborer"
          className="h-12 text-base"
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          {taxonomyEntry ? `Common titles in ${taxonomyEntry.label}:` : "Common titles — tap to use:"}
        </p>
        <div className="flex flex-wrap gap-2">
          {visibleTitles.map((title) => (
            <button
              key={title}
              type="button"
              onClick={() => onChange(title)}
              className={`px-3 py-2 rounded-xl text-sm font-medium border-2 transition-colors ${
                value === title
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:border-primary/40"
              }`}
            >
              {title}
            </button>
          ))}
        </div>
        {!showAll && suggestions.length > 8 && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="text-sm text-primary font-medium hover:underline"
          >
            Show more titles
          </button>
        )}
      </div>
    </div>
  );
}