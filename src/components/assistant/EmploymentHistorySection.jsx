import React from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, CheckCircle2, AlertCircle } from "lucide-react";
import AssistantSection from "./AssistantSection";
import CopyButton from "./CopyButton";

function formatDate(month, year) {
  if (!year) return "";
  return month ? `${month} ${year}` : year;
}

function isConfirmed(record) {
  return ["User Confirmed", "User Entered", "Document Extracted"].includes(record.verified_status);
}

function JobEntry({ job }) {
  const startDate = formatDate(job.start_month, job.start_year);
  const endDate = job.currently_employed ? "Present" : formatDate(job.end_month, job.end_year);
  const dateRange = startDate || endDate ? `${startDate || "?"} – ${endDate || "?"}` : "";
  const location = [job.city, job.state].filter(Boolean).join(", ");
  const confirmed = isConfirmed(job);

  const fullJobText = [
    `Employer: ${job.employer_name}`,
    `Job Title: ${job.job_title}`,
    location && `Location: ${location}`,
    dateRange && `Dates: ${dateRange}`,
    job.duties && `Duties: ${job.duties}`,
    job.reason_for_leaving && `Reason for leaving: ${job.reason_for_leaving}`,
  ].filter(Boolean).join("\n");

  return (
    <div className="border border-border rounded-xl p-3 space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-medium text-foreground text-sm truncate">{job.employer_name}</p>
            {confirmed ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-success flex-shrink-0" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-warning flex-shrink-0" />
            )}
          </div>
          <p className="text-sm text-muted-foreground">{job.job_title}</p>
        </div>
        <CopyButton text={fullJobText} label="Use Job History" />
      </div>
      {(location || dateRange) && (
        <p className="text-xs text-muted-foreground">
          {[location, dateRange].filter(Boolean).join(" · ")}
        </p>
      )}
      {job.duties && (
        <div className="pt-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">Duties</p>
            <CopyButton text={job.duties} label="Use Duties" />
          </div>
          <p className="text-sm text-foreground whitespace-pre-wrap mt-0.5">{job.duties}</p>
        </div>
      )}
      {job.reason_for_leaving && (
        <div className="pt-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">Reason for Leaving</p>
            <CopyButton text={job.reason_for_leaving} label="Use" />
          </div>
          <p className="text-sm text-foreground mt-0.5">{job.reason_for_leaving}</p>
        </div>
      )}
      <div className="flex gap-1 pt-1 flex-wrap">
        <CopyButton text={job.employer_name} label="Use Employer" />
        <CopyButton text={job.job_title} label="Use Title" />
        {dateRange && <CopyButton text={dateRange} label="Use Dates" />}
      </div>
    </div>
  );
}

export default function EmploymentHistorySection({ employment, status }) {
  const navigate = useNavigate();

  return (
    <AssistantSection
      title="Employment History"
      icon={Briefcase}
      status={status}
      onEdit={() => navigate("/profile")}
    >
      {employment.length > 0 ? (
        <div className="space-y-2">
          {employment.map((job) => (
            <JobEntry key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground py-2">
          No employment history saved yet.{" "}
          <button onClick={() => navigate("/profile")} className="text-primary hover:underline">
            Add work experience
          </button>
        </p>
      )}
    </AssistantSection>
  );
}