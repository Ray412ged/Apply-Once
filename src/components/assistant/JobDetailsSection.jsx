import React from "react";
import { FileText } from "lucide-react";
import { stripHtml } from "@/lib/htmlUtils";
import AssistantSection from "./AssistantSection";

function formatPay(job) {
  if (job.salary_text) return job.salary_text;
  if (job.salary_min && job.salary_max)
    return `$${job.salary_min}\u2013$${job.salary_max}/${job.salary_period || "hr"}`;
  if (job.salary_min) return `From $${job.salary_min}`;
  return "Not listed";
}

function FactRow({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground font-medium">{value}</p>
    </div>
  );
}

export default function JobDetailsSection({ job }) {
  const location = [job.city, job.state].filter(Boolean).join(", ") || job.location;

  return (
    <AssistantSection title="Job Details" icon={FileText} defaultOpen={false}>
      <div className="grid grid-cols-2 gap-3">
        <FactRow label="Facility" value={job.facility} />
        <FactRow label="Department" value={job.department} />
        <FactRow label="Location" value={location} />
        <FactRow label="Employment Type" value={job.employment_type} />
        <FactRow label="Work Arrangement" value={job.remote_type} />
        <FactRow label="Shift" value={job.schedule} />
        <FactRow label="Salary" value={formatPay(job)} />
      </div>

      {job.full_description && (
        <div className="pt-2 border-t border-border">
          <p className="text-xs font-medium text-foreground mb-1.5">Description</p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {stripHtml(job.full_description)}
          </p>
        </div>
      )}

      {job.minimum_qualifications && (
        <div className="pt-2 border-t border-border">
          <p className="text-xs font-medium text-foreground mb-1.5">Required Qualifications</p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {stripHtml(job.minimum_qualifications)}
          </p>
        </div>
      )}

      {job.preferred_qualifications && (
        <div className="pt-2 border-t border-border">
          <p className="text-xs font-medium text-foreground mb-1.5">Preferred Qualifications</p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {stripHtml(job.preferred_qualifications)}
          </p>
        </div>
      )}

      {job.responsibilities && (
        <div className="pt-2 border-t border-border">
          <p className="text-xs font-medium text-foreground mb-1.5">Responsibilities</p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {stripHtml(job.responsibilities)}
          </p>
        </div>
      )}
    </AssistantSection>
  );
}