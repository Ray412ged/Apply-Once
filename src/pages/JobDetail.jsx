import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useProfileData } from "@/hooks/useProfileData";
import { computeMatchLevel, getMatchReasons } from "@/lib/matching";
import MatchBadge from "@/components/MatchBadge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ChevronLeft,
  Bookmark,
  X,
  FileCheck,
  MapPin,
  DollarSign,
  Clock,
  Calendar,
  ExternalLink,
  Mail,
  Phone,
  CheckCircle,
  AlertTriangle,
  Info,
} from "lucide-react";
import { stripHtml } from "@/lib/htmlUtils";
import { getOrCreatePassAction } from "@/lib/dismissedJobs";
import { getJobForMe } from "@/lib/orgJobs";

function formatPay(job) {
  if (job.salary_text) return job.salary_text;
  if (job.salary_min && job.salary_max) return `$${job.salary_min}–$${job.salary_max}`;
  if (job.salary_min) return `From $${job.salary_min}`;
  return "Not listed";
}

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState(null);
  const [match, setMatch] = useState(null);
  const { data: profileData, isLoading: profileLoading } = useProfileData();
  const [actionLoading, setActionLoading] = useState(false);
  const [existingApplication, setExistingApplication] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [jobData, matches] = await Promise.all([
          getJobForMe(id),
          base44.entities.JobMatch.filter({ job_posting_id: id }, "-created_date", 1),
        ]);

        setJob(jobData);
        setMatch(matches[0] || null);

        // Load existing application for this job
        const apps = await base44.entities.Application.filter({ job_posting_id: id }, "-created_date", 1);
        if (apps[0]) {
          setExistingApplication(apps[0]);
        }

        // Mark as viewed if new
        if (matches[0]?.status === "New") {
          const updated = await base44.entities.JobMatch.update(matches[0].id, {
            status: "Viewed",
            last_reviewed_date: new Date().toISOString(),
          });
          setMatch(updated);
        }
      } catch (err) {
        console.error("Failed to load job:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const matchLevel = match?.match_level || computeMatchLevel(job, profileData?.preferences, profileData);
  const matchReasons = job ? getMatchReasons(job, profileData?.preferences, profileData) : [];

  const updateMatchStatus = async (status) => {
    setActionLoading(true);
    try {
      if (match) {
        const updated = await base44.entities.JobMatch.update(match.id, {
          status,
          last_reviewed_date: new Date().toISOString(),
        });
        setMatch(updated);
      } else {
        const created = await base44.entities.JobMatch.create({
          job_posting_id: id,
          status,
          match_level: matchLevel,
          first_matched_date: new Date().toISOString(),
          last_reviewed_date: new Date().toISOString(),
        });
        setMatch(created);
      }
    } catch (err) {
      console.error("Failed to update match:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDismiss = async () => {
    try {
      await getOrCreatePassAction(id);
      await updateMatchStatus("Not Interested");
      navigate("/jobs");
    } catch (err) {
      console.error("Failed to dismiss job:", err);
    }
  };

  const handleOpenWorkspace = () => {
    updateMatchStatus("Preparing Application");
    navigate(`/workspace/${id}`);
  };



  if (loading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">We couldn't find that job.</p>
        <Button onClick={() => navigate("/jobs")} className="mt-4">Back to Jobs</Button>
      </div>
    );
  }

  const location = [job.city, job.state].filter(Boolean).join(", ") || job.location;

  return (
    <div className="py-6 space-y-5 animate-fade-in pb-32">
      <button
        onClick={() => navigate("/jobs")}
        className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="w-5 h-5" />
        Back to Jobs
      </button>

      {/* Job header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground leading-tight">{job.job_title}</h1>
            <p className="text-muted-foreground mt-1">{job.employer_name}</p>
          </div>
          <MatchBadge level={matchLevel} />
        </div>

        <div className="space-y-2 mt-4 text-sm">
          {location && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{location}</span>
              {job.remote_type && job.remote_type !== "Not specified" && (
                <span className="text-primary">· {job.remote_type}</span>
              )}
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="w-4 h-4" />
            <span>{formatPay(job)}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{job.employment_type || "Not specified"}</span>
          </div>
          {job.application_deadline && (
            <div className="flex items-center gap-2 text-warning">
              <Calendar className="w-4 h-4" />
              <span>Apply by {new Date(job.application_deadline).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Why this may fit */}
      {matchReasons.length > 0 && (
        <div className="bg-success/5 rounded-2xl border border-success/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-success" />
            <h2 className="font-bold text-foreground">Why this may fit</h2>
          </div>
          <ul className="space-y-2">
            {matchReasons.map((reason, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-success mt-1.5 flex-shrink-0" />
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Requirements analysis */}
      {(job.minimum_qualifications || job.required_education || job.required_experience || job.required_credentials) && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h2 className="font-bold text-foreground mb-3">Requirements</h2>
          <div className="space-y-3 text-sm">
            {job.minimum_qualifications && (
              <div>
                <p className="font-medium text-foreground mb-1">Minimum qualifications</p>
                <p className="text-muted-foreground whitespace-pre-wrap">{stripHtml(job.minimum_qualifications)}</p>
              </div>
            )}
            {job.required_education && (
              <div>
                <p className="font-medium text-foreground mb-1">Education required</p>
                <p className="text-muted-foreground">{job.required_education}</p>
              </div>
            )}
            {job.required_experience && (
              <div>
                <p className="font-medium text-foreground mb-1">Experience required</p>
                <p className="text-muted-foreground">{job.required_experience}</p>
              </div>
            )}
            {job.required_credentials && (
              <div>
                <p className="font-medium text-foreground mb-1">Credentials required</p>
                <p className="text-muted-foreground">{job.required_credentials}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full description */}
      {job.full_description && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h2 className="font-bold text-foreground mb-3">Job Description</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{stripHtml(job.full_description)}</p>
        </div>
      )}

      {/* Responsibilities */}
      {job.responsibilities && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h2 className="font-bold text-foreground mb-3">Responsibilities</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{stripHtml(job.responsibilities)}</p>
        </div>
      )}

      {/* Preferred qualifications */}
      {job.preferred_qualifications && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h2 className="font-bold text-foreground mb-3">Preferred Qualifications</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{stripHtml(job.preferred_qualifications)}</p>
        </div>
      )}

      {/* Application instructions for local jobs */}
      {job.local_job && job.application_instructions && (
        <div id="application-instructions" className="bg-primary/5 rounded-2xl border border-primary/20 p-5">
          <h2 className="font-bold text-foreground mb-3">Application Instructions</h2>
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{job.application_instructions}</p>
          {job.application_email && (
            <a href={`mailto:${job.application_email}`} className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline mt-3">
              <Mail className="w-4 h-4" />
              {job.application_email}
            </a>
          )}
          {job.application_phone && (
            <a href={`tel:${job.application_phone}`} className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline mt-2">
              <Phone className="w-4 h-4" />
              {job.application_phone}
            </a>
          )}
        </div>
      )}

      {/* Original posting link */}
      {job.posting_url && (
        <a
          href={job.posting_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-sm text-primary font-medium hover:underline"
        >
          <ExternalLink className="w-4 h-4" />
          View original posting
        </a>
      )}

      {/* Disclaimer */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-accent rounded-xl p-3">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p>Match levels are a guide based on your profile. The employer makes the final hiring decision.</p>
      </div>



      {/* Sticky action bar */}
      <div className="fixed bottom-20 inset-x-0 z-30 px-4 max-w-2xl mx-auto">
        <div className="bg-card rounded-2xl border border-border shadow-lg p-3 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-12 px-3"
            onClick={() => updateMatchStatus(match?.status === "Saved" ? "Viewed" : "Saved")}
            disabled={actionLoading}
            aria-label="Save"
          >
            <Bookmark className={`w-5 h-5 ${match?.status === "Saved" ? "fill-current" : ""}`} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-12 px-3 text-muted-foreground"
            onClick={handleDismiss}
            disabled={actionLoading}
          >
            <X className="w-5 h-5" />
            <span className="hidden sm:inline">Not for me</span>
          </Button>
          <Button
            size="sm"
            className="h-12 flex-1 font-semibold"
            onClick={handleOpenWorkspace}
            disabled={actionLoading}
          >
            <FileCheck className="w-5 h-5 mr-1" />
            Open Application Workspace
          </Button>
        </div>
      </div>
    </div>
  );
}