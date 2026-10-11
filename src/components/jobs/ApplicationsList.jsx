import React from "react";
import { Eye, ArrowRight, Trash2, FileText, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import CompanyLogo from "@/components/jobs/CompanyLogo";
import { requiresEmployerAccount } from "@/lib/atsDetection";

const STATUS_BADGES = {
  "Draft": "bg-muted text-muted-foreground",
  "In Progress": "bg-primary/10 text-primary",
  "Workspace Ready": "bg-warning/10 text-warning",
  "Employer Account Required": "bg-destructive/10 text-destructive",
  "Submitted": "bg-success/10 text-success",
  "Interview": "bg-primary/10 text-primary",
  "Offer": "bg-success/10 text-success",
  "Rejected": "bg-destructive/10 text-destructive",
  "Withdrawn": "bg-muted text-muted-foreground",
  "Closed": "bg-muted text-muted-foreground",
};

const STATUS_PROGRESS = {
  "Interested": 10,
  "Preparing": 30,
  "Ready for Review": 50,
  "Submitted": 70,
  "Interview": 85,
  "Offer": 95,
  "Rejected": 100,
  "Withdrawn": 100,
  "Closed": 100,
};

function getStatusBadge(app, job) {
  const atsType = app.ats_type || job?.ats_type;
  const pastSubmission = ["Submitted", "Interview", "Offer", "Rejected", "Withdrawn", "Closed"].includes(app.status);
  if (atsType && requiresEmployerAccount(atsType) && !pastSubmission) {
    return "Employer Account Required";
  }
  const mapping = {
    "Interested": "Draft",
    "Preparing": "In Progress",
    "Ready for Review": "Workspace Ready",
    "Submitted": "Submitted",
    "Interview": "Interview",
    "Offer": "Offer",
    "Rejected": "Rejected",
    "Withdrawn": "Withdrawn",
    "Closed": "Closed",
  };
  return mapping[app.status] || "Draft";
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
          const badge = getStatusBadge(app, job);
          const progress = STATUS_PROGRESS[app.status] ?? 0;
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
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${STATUS_BADGES[badge] || "bg-muted text-muted-foreground"}`}>
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

              {/* Application progress */}
              {progress > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-1.5" />
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