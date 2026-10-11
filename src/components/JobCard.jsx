import React from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, DollarSign, Briefcase, Calendar, Bookmark, EyeOff, ExternalLink, Store, Mail, Phone } from "lucide-react";
import MatchBadge from "@/components/MatchBadge";
import CompanyLogo from "@/components/jobs/CompanyLogo";
import MatchExplanation from "@/components/jobs/MatchExplanation";
import { useGuestJobGate } from "@/components/jobs/GuestJobGateContext";
import { Button } from "@/components/ui/button";

function formatPay(job) {
  if (job.salary_text) return job.salary_text;
  if (job.salary_min && job.salary_max) {
    const period = job.salary_period === "annual" ? "k" : "/hr";
    if (period === "k") return `$${job.salary_min / 1000}k–$${job.salary_max / 1000}k`;
    return `$${job.salary_min}–$${job.salary_max}${period}`;
  }
  if (job.salary_min) return `From $${job.salary_min}`;
  return null;
}

function postingAge(postingDate) {
  if (!postingDate) return null;
  const days = Math.floor((Date.now() - new Date(postingDate).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "1d ago";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1mo ago" : `${months}mo ago`;
}

export default function JobCard({ job, matchLevel, matchScore, saved, onSave, onHide, preferences, profileData }) {
  const navigate = useNavigate();
  const { requireAccount } = useGuestJobGate();
  const jobPath = `/jobs/${job.id}`;
  const location = [job.city, job.state].filter(Boolean).join(", ") || job.location;
  const pay = formatPay(job);
  const age = postingAge(job.posting_date);

  // For guests, account-dependent actions open the conversion prompt
  // instead of navigating / launching the employer link. The intended
  // destination is remembered so the user returns to this job after auth.
  const handleCardClick = () => {
    if (requireAccount(jobPath)) return;
    navigate(jobPath);
  };
  const guardNav = () => {
    if (requireAccount(jobPath)) return;
    navigate(jobPath);
  };
  const guardExternal = (url) => {
    if (requireAccount(jobPath)) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };
  const stopProp = (e) => e.stopPropagation();

  return (
    <div
      onClick={handleCardClick}
      className="block bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow p-4 cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <CompanyLogo logoUrl={job.company_logo_url} companyName={job.employer_name} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-heading font-semibold text-foreground text-lg leading-tight truncate">
                {job.job_title}
              </h3>
              <p className="text-muted-foreground text-sm truncate">{job.employer_name}</p>
              {job.local_job && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5 mt-1">
                  <Store className="w-3 h-3" />
                  Local Employer
                </span>
              )}
            </div>
            {matchLevel && <MatchBadge level={matchLevel} score={matchScore} />}
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
            {location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {location}
              </span>
            )}
            {job.remote_type && job.remote_type !== "Not specified" && (
              <span className="text-primary">{job.remote_type}</span>
            )}
            {pay && (
              <span className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                {pay}
              </span>
            )}
            {job.employment_type && (
              <span className="flex items-center gap-1">
                <Briefcase className="w-3 h-3" />
                {job.employment_type}
              </span>
            )}
            {age && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {age}
              </span>
            )}
          </div>
        </div>
      </div>

      <MatchExplanation job={job} preferences={preferences} profileData={profileData} />

      <div className="flex gap-2 mt-3" onClick={stopProp}>
        {job.local_job ? (
          job.application_method === "External website" && job.posting_url ? (
            <Button size="sm" className="flex-1 h-9" onClick={guardNav}>
              <ExternalLink className="w-4 h-4 mr-1" />
              Continue to Employer Website
            </Button>
          ) : job.application_method === "Email employer" && job.application_email ? (
            <Button size="sm" className="flex-1 h-9" onClick={() => requireAccount(jobPath)}>
              <Mail className="w-4 h-4 mr-1" />
              Email Employer
            </Button>
          ) : job.application_method === "Call employer" && job.application_phone ? (
            <Button size="sm" className="flex-1 h-9" onClick={() => requireAccount(jobPath)}>
              <Phone className="w-4 h-4 mr-1" />
              Call Employer
            </Button>
          ) : (
            <Button size="sm" className="flex-1 h-9" onClick={guardNav}>
              View Application Instructions
            </Button>
          )
        ) : job.posting_url ? (
          <Button size="sm" className="flex-1 h-9" onClick={() => guardExternal(job.posting_url)}>
            <ExternalLink className="w-4 h-4 mr-1" />
            Apply
          </Button>
        ) : (
          <Button size="sm" className="flex-1 h-9" onClick={guardNav}>
            View Details
          </Button>
        )}
        <Button
          variant={saved ? "secondary" : "outline"}
          size="sm"
          className="h-9 px-3"
          onClick={onSave}
          aria-label={saved ? "Unsave job" : "Save job"}
        >
          <Bookmark className={`w-4 h-4 ${saved ? "fill-current" : ""}`} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-3 text-muted-foreground"
          onClick={onHide}
          aria-label="Hide job"
        >
          <EyeOff className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}