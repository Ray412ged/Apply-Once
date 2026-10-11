import React from "react";
import {
  ExternalLink,
  CheckCircle2,
  Clock,
  Calendar,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import CompanyLogo from "@/components/jobs/CompanyLogo";

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

export default function AssistantHeader({ job, application, onContinue, onMarkApplied }) {
  const startDate = application?.application_started_date || application?.created_date;
  const isApplied = APPLIED_STATUSES.has(application?.status);
  const statusLabel = isApplied ? "Applied" : "In Progress";
  const location = [job.city, job.state].filter(Boolean).join(", ") || job.location;

  return (
    <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
      <div className="flex items-start gap-3">
        <CompanyLogo logoUrl={job.company_logo_url} companyName={job.employer_name} />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-foreground leading-tight">{job.job_title}</h1>
          <p className="text-muted-foreground mt-0.5">{job.employer_name}</p>
          {location && (
            <p className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <MapPin className="w-3.5 h-3.5" />
              {location}
            </p>
          )}
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2 text-xs text-muted-foreground">
            {job.facility && (
              <span><strong className="text-foreground">Facility:</strong> {job.facility}</span>
            )}
            {job.schedule && (
              <span><strong className="text-foreground">Shift:</strong> {job.schedule}</span>
            )}
            {job.employment_type && (
              <span><strong className="text-foreground">Type:</strong> {job.employment_type}</span>
            )}
            {job.remote_type && job.remote_type !== "Not specified" && (
              <span><strong className="text-foreground">Arrangement:</strong> {job.remote_type}</span>
            )}
            {(job.salary_text || (job.salary_min && job.salary_max)) && (
              <span>
                <strong className="text-foreground">Pay:</strong>{" "}
                {job.salary_text || `$${job.salary_min}\u2013$${job.salary_max}/${job.salary_period || "hr"}`}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <span className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isApplied ? "bg-success" : "bg-primary animate-pulse"}`} />
          <span className="font-medium text-foreground">{statusLabel}</span>
        </span>
        {startDate && (
          <span className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            Started {new Date(startDate).toLocaleDateString()}
          </span>
        )}
        {job.application_deadline && (
          <span className="flex items-center gap-1 text-warning">
            <Calendar className="w-3.5 h-3.5" />
            Closes {new Date(job.application_deadline).toLocaleDateString()}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          size="sm"
          className="h-10"
          onClick={onContinue}
          disabled={!job.application_url && !job.posting_url}
        >
          <ExternalLink className="w-4 h-4 mr-1" />
          Continue to Employer Website
        </Button>
        <Button
          size="sm"
          variant={isApplied ? "secondary" : "default"}
          className="h-10"
          onClick={onMarkApplied}
          disabled={isApplied}
        >
          <CheckCircle2 className="w-4 h-4 mr-1" />
          {isApplied ? "Applied" : "Mark as Applied"}
        </Button>

      </div>
    </div>
  );
}