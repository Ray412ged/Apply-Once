import React from "react";
import { SlidersHorizontal } from "lucide-react";
import {
  POSTED_WITHIN_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  REMOTE_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
  EDUCATION_REQUIRED_OPTIONS,
  getUniqueIndustries,
  getUniqueCompanies,
} from "@/lib/jobFilters";

function FilterRow({ label, children }) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

const selectClass =
  "w-full h-10 rounded-lg border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export default function JobFilters({ filters, onChange, onReset, jobs }) {
  const industries = getUniqueIndustries(jobs);
  const companies = getUniqueCompanies(jobs);

  return (
    <div className="bg-card rounded-2xl border border-border p-4 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-heading font-semibold text-foreground">Filters</h2>
        </div>
        <button
          onClick={onReset}
          className="text-sm text-primary font-medium hover:underline"
        >
          Reset
        </button>
      </div>

      <div className="flex items-center gap-2 pb-2 border-b border-border">
        <input
          type="checkbox"
          id="localOnly"
          checked={!!filters.localOnly}
          onChange={(e) => onChange("localOnly", e.target.checked)}
          className="w-4 h-4 rounded border-input"
        />
        <label htmlFor="localOnly" className="text-sm font-medium text-foreground cursor-pointer">
          Local employers only
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FilterRow label="Posted within">
          <select
            value={filters.postedWithin}
            onChange={(e) => onChange("postedWithin", e.target.value)}
            className={selectClass}
          >
            <option value="">Any time</option>
            {POSTED_WITHIN_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </FilterRow>

        <FilterRow label="Employment type">
          <select
            value={filters.employmentType}
            onChange={(e) => onChange("employmentType", e.target.value)}
            className={selectClass}
          >
            <option value="">All types</option>
            {EMPLOYMENT_TYPE_OPTIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </FilterRow>

        <FilterRow label="Remote">
          <select
            value={filters.remote}
            onChange={(e) => onChange("remote", e.target.value)}
            className={selectClass}
          >
            <option value="">All</option>
            {REMOTE_OPTIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </FilterRow>

        <FilterRow label="Experience level">
          <select
            value={filters.experienceLevel}
            onChange={(e) => onChange("experienceLevel", e.target.value)}
            className={selectClass}
          >
            <option value="">All levels</option>
            {EXPERIENCE_LEVEL_OPTIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </FilterRow>

        <FilterRow label="Education required">
          <select
            value={filters.educationRequired}
            onChange={(e) => onChange("educationRequired", e.target.value)}
            className={selectClass}
          >
            <option value="">All</option>
            {EDUCATION_REQUIRED_OPTIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </FilterRow>

        <FilterRow label="Industry">
          <select
            value={filters.industry}
            onChange={(e) => onChange("industry", e.target.value)}
            className={selectClass}
          >
            <option value="">All industries</option>
            {industries.map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
        </FilterRow>

        <FilterRow label="Company">
          <select
            value={filters.company}
            onChange={(e) => onChange("company", e.target.value)}
            className={selectClass}
          >
            <option value="">All companies</option>
            {companies.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </FilterRow>

        <FilterRow label="Min pay ($/hr)">
          <input
            type="number"
            value={filters.payMin}
            onChange={(e) => onChange("payMin", e.target.value)}
            placeholder="Any"
            className={selectClass}
          />
        </FilterRow>

        <FilterRow label="Occupation">
          <input
            type="text"
            value={filters.occupation}
            onChange={(e) => onChange("occupation", e.target.value)}
            placeholder="Keyword"
            className={selectClass}
          />
        </FilterRow>
      </div>
    </div>
  );
}