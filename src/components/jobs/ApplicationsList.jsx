import React from "react";
import { Eye, ArrowRight, Trash2, FileText, Briefcase } from "lucide-react";
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

function getStatusBadge(app) {
  return APPLIED_STATUSES.has(app.status) ? "Applied" : "In Progress";
}

export default function ApplicationsList({ applications, jobs, onViewJob, onContinue, onRemove }) {
  if (!applications || applications.length === 0) return null;

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center gap-2">
        <Briefcase className="w-4 h-4 text-primary" />
        <h2 className="text-base font-bold text-foreground">Applications</h2>
        <span className="text-sm text-muted-foreground">({applications.length})</span>
      </div>

      <div className="space-y-2">
        {applications.map((app) => {
          const job = jobs[app.job_posting_id];
          const badge = getStatusBadge(app);
          const hasResume = !!app.resume_document_id;
          return (
            <div
              key={app.id}
              className="bg-card rounded-2xl border border-border p-4 space-y-3"
            >
              <div className="flex items-start gap-3">
                <CompanyLogo
                  logoUrl={job?.company_logo_url}
                  companyName={job?.employer_name}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">
                    {job?.job_title || "Job Posting"}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {job?.employer_name}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${badge === "Applied" ? "bg-success/10 text-success" : "bg-primary/10 text-primary"}`}>
                  {badge}
                </span>
              </div>

              {/* Resume status */}
              {hasResume && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <FileText className="w-3.5 h-3.5 text-success" />
                  <span>Resume attached</span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 text-xs"
                  onClick={() => onViewJob(app.job_posting_id)}
                >
                  <Eye className="w-3.5 h-3.5 mr-1" />
                  View Job
                </Button>
                <Button
                  size="sm"
                  className="h-9 text-xs"
                  onClick={() => onContinue(app.job_posting_id)}
                >
                  <ArrowRight className="w-3.5 h-3.5 mr-1" />
                  Continue
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-9 text-xs text-destructive hover:text-destructive"
                  onClick={() => onRemove(app.id)}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Remove
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}