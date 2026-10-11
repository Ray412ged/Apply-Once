import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ChevronRight,
  Calendar,
  StickyNote,
  ChevronDown,
  ChevronUp,
  Briefcase,
  ExternalLink,
} from "lucide-react";
import { ApplicationsListSkeleton } from "@/components/Skeleton";
import { recordActivity } from "@/lib/recordActivity";
import { getJobsForMe } from "@/lib/orgJobs";

const TABS = [
  { id: "preparing", label: "Preparing", statuses: ["Interested", "Preparing"] },
  { id: "ready", label: "Ready", statuses: ["Ready for Review"] },
  { id: "submitted", label: "Submitted", statuses: ["Submitted"] },
  { id: "interviews", label: "Interviews", statuses: ["Interview"] },
  { id: "offers", label: "Offers", statuses: ["Offer"] },
  { id: "closed", label: "Closed", statuses: ["Rejected", "Withdrawn", "Closed"] },
];

const STATUS_COLORS = {
  Interested: "bg-primary/10 text-primary",
  Preparing: "bg-primary/10 text-primary",
  "Ready for Review": "bg-warning/10 text-warning",
  Submitted: "bg-blue-100 text-blue-700",
  Interview: "bg-purple-100 text-purple-700",
  Offer: "bg-success/10 text-success",
  Rejected: "bg-destructive/10 text-destructive",
  Withdrawn: "bg-muted text-muted-foreground",
  Closed: "bg-muted text-muted-foreground",
};

const NEXT_STATUSES = {
  Interested: "Preparing",
  Preparing: "Ready for Review",
  "Ready for Review": "Submitted",
  Submitted: "Interview",
  Interview: "Offer",
  Offer: "Closed",
};

export default function Applications() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState({});
  const [activeTab, setActiveTab] = useState("preparing");
  const [expandedId, setExpandedId] = useState(null);
  const [notes, setNotes] = useState({});
  const [followUpDate, setFollowUpDate] = useState({});
  const [interviewDate, setInterviewDate] = useState({});

  useEffect(() => {
    async function loadData() {
      try {
        const apps = await base44.entities.Application.filter({}, "-created_date", 100);
        setApplications(apps);

        // Load job postings for each application
        const jobIds = [...new Set(apps.map((a) => a.job_posting_id))];
        setJobs(await getJobsForMe(jobIds));
      } catch (err) {
        console.error("Failed to load applications:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const currentTab = TABS.find((t) => t.id === activeTab);
  const filteredApps = applications.filter((a) => currentTab.statuses.includes(a.status));

  const handleAdvance = async (app) => {
    const nextStatus = NEXT_STATUSES[app.status];
    if (!nextStatus) return;
    try {
      const updated = await base44.entities.Application.update(app.id, {
        status: nextStatus,
        ...(nextStatus === "Submitted" && { application_submitted_date: new Date().toISOString() }),
      });
      if (nextStatus === "Submitted") {
        recordActivity("application_submitted");
      }
      setApplications(applications.map((a) => (a.id === app.id ? updated : a)));
    } catch (err) {
      console.error("Failed to update application:", err);
    }
  };

  const handleSaveNotes = async (app) => {
    try {
      await base44.entities.Application.update(app.id, {
        notes: notes[app.id] ?? app.notes,
        follow_up_date: followUpDate[app.id] ?? app.follow_up_date,
        interview_date: interviewDate[app.id] ?? app.interview_date,
      });
      const updated = await base44.entities.Application.get(app.id);
      setApplications(applications.map((a) => (a.id === app.id ? updated : a)));
      setExpandedId(null);
    } catch (err) {
      console.error("Failed to save notes:", err);
    }
  };

  if (loading) {
    return <ApplicationsListSkeleton />;
  }

  return (
    <div className="py-6 space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Applications</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Track your progress on each application
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
        {TABS.map((tab) => {
          const count = applications.filter((a) => tab.statuses.includes(a.status)).length;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground border border-border hover:text-foreground"
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`ml-1.5 ${activeTab === tab.id ? "opacity-80" : ""}`}>
                  ({count})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Application list */}
      {filteredApps.length > 0 ? (
        <div className="space-y-3">
          {filteredApps.map((app) => {
            const job = jobs[app.job_posting_id];
            const isExpanded = expandedId === app.id;
            return (
              <div key={app.id} className="bg-card rounded-2xl border border-border overflow-hidden">
                <div
                  className="p-4 flex items-center gap-3 cursor-pointer"
                  onClick={() => {
                    setExpandedId(isExpanded ? null : app.id);
                    setNotes({ ...notes, [app.id]: app.notes || "" });
                    setFollowUpDate({ ...followUpDate, [app.id]: app.follow_up_date || "" });
                    setInterviewDate({ ...interviewDate, [app.id]: app.interview_date || "" });
                  }}
                >
                  <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-semibold text-foreground truncate">
                      {job?.job_title || "Application"}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">{job?.employer_name}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[app.status] || "bg-muted text-muted-foreground"}`}>
                    {app.status}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
                    {/* Dates */}
                    {app.application_started_date && (
                      <div className="text-sm text-muted-foreground">
                        Started: {new Date(app.application_started_date).toLocaleDateString()}
                      </div>
                    )}
                    {app.application_submitted_date && (
                      <div className="text-sm text-muted-foreground">
                        Submitted: {new Date(app.application_submitted_date).toLocaleDateString()}
                      </div>
                    )}
                    {job?.application_deadline && (
                      <div className="text-sm text-warning flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Closes: {new Date(job.application_deadline).toLocaleDateString()}
                      </div>
                    )}

                    {/* External application link */}
                    {job?.posting_url && (
                      <a
                        href={job.posting_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View application site
                      </a>
                    )}

                    {/* Follow-up date */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5 text-sm">
                        <Calendar className="w-4 h-4" />
                        Follow-up reminder
                      </Label>
                      <Input
                        type="date"
                        value={followUpDate[app.id] || ""}
                        onChange={(e) => setFollowUpDate({ ...followUpDate, [app.id]: e.target.value })}
                        className="h-11"
                      />
                    </div>

                    {/* Interview date */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5 text-sm">
                        <Calendar className="w-4 h-4" />
                        Interview date
                      </Label>
                      <Input
                        type="date"
                        value={interviewDate[app.id] || ""}
                        onChange={(e) => setInterviewDate({ ...interviewDate, [app.id]: e.target.value })}
                        className="h-11"
                      />
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5 text-sm">
                        <StickyNote className="w-4 h-4" />
                        Notes
                      </Label>
                      <Textarea
                        value={notes[app.id] || ""}
                        onChange={(e) => setNotes({ ...notes, [app.id]: e.target.value })}
                        placeholder="Add notes about this application..."
                        className="min-h-[80px] text-sm"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-10"
                        onClick={() => handleSaveNotes(app)}
                      >
                        Save Changes
                      </Button>
                      {NEXT_STATUSES[app.status] && (
                        <Button
                          size="sm"
                          className="flex-1 h-10"
                          onClick={() => handleAdvance(app)}
                        >
                          Move to {NEXT_STATUSES[app.status]}
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-dashed border-border p-8 text-center">
          <Briefcase className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">
            No applications in this stage yet.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => navigate("/jobs")}
          >
            Browse Jobs
          </Button>
        </div>
      )}
    </div>
  );
}