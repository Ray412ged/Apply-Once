import React from "react";
import { Bookmark, Eye, Send, Trash2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import CompanyLogo from "@/components/jobs/CompanyLogo";

export default function SavedJobsList({ jobs, onViewJob, onApply, onRemove }) {
  if (!jobs || jobs.length === 0) return null;

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center gap-2">
        <Bookmark className="w-4 h-4 text-primary" />
        <h2 className="text-base font-bold text-foreground">Saved Jobs</h2>
        <span className="text-sm text-muted-foreground">({jobs.length})</span>
      </div>

      <div className="space-y-2">
        {jobs.map((job) => {
          const location = [job.city, job.state].filter(Boolean).join(", ") || job.location;
          return (
            <div
              key={job.id}
              className="bg-card rounded-2xl border border-border p-4 space-y-3"
            >
              <div className="flex items-start gap-3">
                <CompanyLogo
                  logoUrl={job.company_logo_url}
                  companyName={job.employer_name}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{job.job_title}</p>
                  <p className="text-sm text-muted-foreground truncate">{job.employer_name}</p>
                  {location && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <MapPin className="w-3 h-3" />
                      {location}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 text-xs"
                  onClick={() => onViewJob(job.id)}
                >
                  <Eye className="w-3.5 h-3.5 mr-1" />
                  View Job
                </Button>
                <Button
                  size="sm"
                  className="h-9 text-xs"
                  onClick={() => onApply(job)}
                >
                  <Send className="w-3.5 h-3.5 mr-1" />
                  Apply
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-9 text-xs text-destructive hover:text-destructive"
                  onClick={() => onRemove(job.id)}
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