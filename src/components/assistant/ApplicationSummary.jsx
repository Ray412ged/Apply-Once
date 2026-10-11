import React from "react";
import { ClipboardList } from "lucide-react";

const APPLIED_STATUSES = new Set([
  "Submitted",
  "Interview",
  "Offer",
  "Hired",
  "Rejected",
  "Not Selected",
  "Withdrawn",
  "Closed",
  "Closed - No Response",
]);

function SummaryRow({ label, value, valueClass = "text-foreground" }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium ${valueClass}`}>{value}</span>
    </div>
  );
}

export default function ApplicationSummary({ job, application, readiness, reusableAnswers }) {
  const startDate = application?.application_started_date || application?.created_date;
  const hasResume = readiness.sections.resume === "ready";
  const hasCoverLetter = readiness.sections.coverLetter === "ready";
  const statusLabel = APPLIED_STATUSES.has(application?.status) ? "Applied" : "In Progress";

  return (
    <div className="bg-card rounded-2xl border border-border p-4 space-y-1">
      <div className="flex items-center gap-2 mb-2">
        <ClipboardList className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Application Summary</h3>
      </div>
      <SummaryRow label="Employer" value={job.employer_name} />
      <SummaryRow
        label="Application Started"
        value={startDate ? new Date(startDate).toLocaleDateString() : "—"}
      />
      <SummaryRow
        label="Resume Ready"
        value={hasResume ? "Yes" : "No"}
        valueClass={hasResume ? "text-success" : "text-muted-foreground"}
      />
      <SummaryRow
        label="Cover Letter"
        value={hasCoverLetter ? "Yes" : "No"}
        valueClass={hasCoverLetter ? "text-success" : "text-muted-foreground"}
      />
      <SummaryRow
        label="Questions Remaining"
        value={reusableAnswers.length > 0 ? `${reusableAnswers.length} saved` : "None saved"}
      />
      <SummaryRow
        label="Still Needed"
        value={readiness.missingCount > 0 ? `${readiness.missingCount} sections` : "None"}
        valueClass={readiness.missingCount > 0 ? "text-warning" : "text-success"}
      />
      <SummaryRow label="Current Status" value={statusLabel} />
    </div>
  );
}