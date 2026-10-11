import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { computeMatchScore } from "@/lib/matching";
import { removeSavedJob } from "@/lib/savedJobs";
import { useSavedJobs } from "@/hooks/useSavedJobs";
import { Bookmark, RotateCcw, Layers, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getJobsForMe } from "@/lib/orgJobs";
import JobSwipeCard from "@/components/jobs/JobSwipeCard";
import SavedJobsList from "@/components/jobs/SavedJobsList";
import ApplicationsList from "@/components/jobs/ApplicationsList";
import SwipeCoachmark, { hasSeenSwipeTutorial } from "@/components/jobs/SwipeCoachmark";

/**
 * Discovery view — a PRESENTATIONAL consumer of the single shared filtered
 * job collection owned by the Jobs page. It performs NO independent job
 * fetching and NO separate location query. It simply presents the shared
 * collection one card at a time and delegates every action (dismiss / save /
 * apply) back to the parent so the shared collection — and therefore the
 * result count — stays identical across Discovery and List.
 *
 * The "Review Dismissed Jobs" toggle swaps in the parent-provided
 * `dismissedJobs` (the same pipeline filtered to dismissed items) so it never
 * introduces a separate query.
 */
export default function DiscoveryView({
  jobs = [],
  dismissedJobs = [],
  onDismiss,
  onUndoDismiss,
  onSave,
  onApply,
  preferences,
  profileData,
}) {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [reviewDismissed, setReviewDismissed] = useState(false);
  const { data: savedJobRecords = [] } = useSavedJobs();
  const [savedJobs, setSavedJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [applicationJobs, setApplicationJobs] = useState({});
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [dismissToast, setDismissToast] = useState(null);
  const [showCoachmark, setShowCoachmark] = useState(() => !hasSeenSwipeTutorial());
  const toastTimer = useRef(null);

  const displayJobs = reviewDismissed ? dismissedJobs : jobs;

  // Clamp the index when the underlying collection shrinks (e.g. a dismiss
  // removes the current job from the shared collection). We deliberately do
  // NOT advance the index on dismiss: removing the current item shifts the
  // next item into this index, so holding position shows the next job.
  useEffect(() => {
    if (displayJobs.length === 0) {
      if (index !== 0) setIndex(0);
      return;
    }
    if (index > displayJobs.length - 1) {
      setIndex(displayJobs.length - 1);
    }
  }, [displayJobs.length, index]);

  // Load saved-job details + applications (independent of the job pipeline).
  useEffect(() => {
    let cancelled = false;
    async function loadSaved(savedRecords) {
      if (!savedRecords || savedRecords.length === 0) {
        setSavedJobs([]);
        return;
      }
      try {
        const jobMap = await getJobsForMe(savedRecords.map((r) => r.job_posting_id));
        if (!cancelled) setSavedJobs(Object.values(jobMap));
      } catch (err) {
        console.error("Failed to load saved jobs:", err);
      }
    }
    loadSaved(savedJobRecords);
    return () => { cancelled = true; };
  }, [savedJobRecords]);

  useEffect(() => {
    let cancelled = false;
    async function loadApplications() {
      try {
        const apps = await base44.entities.Application.filter({}, "-created_date", 50);
        if (cancelled) return;
        setApplications(apps);
        const jobIds = [...new Set(apps.map((a) => a.job_posting_id))];
        if (jobIds.length > 0) {
          const jobMap = await getJobsForMe(jobIds);
          if (cancelled) return;
          setApplicationJobs(jobMap);
        }
      } catch (err) {
        console.error("Failed to load applications:", err);
      }
    }
    loadApplications();
    return () => { cancelled = true; };
  }, []);

  const currentJob = displayJobs[index];
  const currentJobMatch = currentJob
    ? computeMatchScore(currentJob, {
        profile: profileData?.profile,
        education: profileData?.educationRecords,
        employment: profileData?.employmentRecords,
        skills: profileData?.skills,
        credentials: profileData?.credentials,
        preferences,
      })
    : { level: undefined, score: undefined };
  const nextJob = displayJobs[index + 1];

  const handleDismiss = async (job) => {
    const info = onDismiss ? await onDismiss(job) : { recordId: null, previousAction: null };
    setShowSavedToast(false);
    setDismissToast({ job, ...info });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setDismissToast(null), 4000);
  };

  const handleUndoDismiss = async () => {
    if (!dismissToast) return;
    const { job, recordId, previousAction } = dismissToast;
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setDismissToast(null);
    if (onUndoDismiss) await onUndoDismiss({ job, recordId, previousAction });
  };

  const handleSave = async (job) => {
    const ok = onSave ? await onSave(job) : false;
    if (ok) {
      setDismissToast(null);
      setShowSavedToast(true);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setShowSavedToast(false), 2000);
    }
    // Advance to the next card (saved jobs remain in the shared collection).
    setIndex((prev) => prev + 1);
  };

  const handleApply = (job) => {
    if (onApply) onApply(job);
  };

  const handleRemoveSaved = async (jobId) => {
    try {
      await removeSavedJob(jobId);
    } catch (err) {
      console.error("Failed to remove saved job:", err);
    }
  };

  const handleRemoveApplication = async (appId) => {
    try {
      await base44.entities.Application.delete(appId);
      setApplications((prev) => prev.filter((a) => a.id !== appId));
    } catch (err) {
      console.error("Failed to remove application:", err);
    }
  };

  const handleToggleReviewDismissed = () => {
    setReviewDismissed((v) => !v);
    setIndex(0);
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Review dismissed toggle */}
      <div className="flex items-center justify-end">
        <button
          onClick={handleToggleReviewDismissed}
          className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full border transition-colors ${
            reviewDismissed
              ? "bg-primary/10 text-primary border-primary/30"
              : "bg-card text-muted-foreground border-border"
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {reviewDismissed ? "Showing dismissed jobs" : "Review Dismissed Jobs"}
        </button>
      </div>

      {/* Swipe card area */}
      {currentJob ? (
        <div className="relative max-w-md mx-auto">
          {nextJob && (
            <div className="absolute inset-x-0 top-4 bottom-0 scale-95 opacity-40 bg-card rounded-3xl border border-border z-0 pointer-events-none">
              <div className="p-5">
                <p className="text-sm font-medium text-muted-foreground truncate">
                  {nextJob.employer_name}
                </p>
                <p className="text-lg font-bold text-foreground truncate">
                  {nextJob.job_title}
                </p>
              </div>
            </div>
          )}
          <motion.div
            key={currentJob.id}
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            transition={prefersReducedMotion ? { duration: 0.15 } : { duration: 0.25, ease: "easeOut" }}
            className="relative z-10"
          >
            <JobSwipeCard
              job={currentJob}
              matchLevel={currentJobMatch.level}
              matchScore={currentJobMatch.score}
              onPass={handleDismiss}
              onSave={handleSave}
              onInterested={handleApply}
            />
          </motion.div>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-dashed border-border p-8 text-center space-y-4 max-w-md mx-auto">
          <Layers className="w-10 h-10 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground text-sm">
            {reviewDismissed
              ? "No dismissed jobs to review."
              : displayJobs.length === 0
                ? "No jobs match your current filters and location."
                : "You've reviewed all the jobs in this list."}
          </p>
          {!reviewDismissed && (
            <Button onClick={() => navigate("/jobs")} variant="outline">
              <List className="w-4 h-4 mr-1" />
              Switch to List view
            </Button>
          )}
          {reviewDismissed && (
            <button
              onClick={handleToggleReviewDismissed}
              className="block mx-auto text-sm font-medium text-primary hover:underline"
            >
              Hide dismissed jobs
            </button>
          )}
        </div>
      )}

      {/* Swipe tutorial (first-time only) */}
      {showCoachmark && currentJob && !reviewDismissed && (
        <SwipeCoachmark onDismiss={() => setShowCoachmark(false)} />
      )}

      {/* Saved Jobs section */}
      <SavedJobsList
        jobs={savedJobs}
        onViewJob={(jobId) => navigate(`/jobs/${jobId}`)}
        onApply={handleApply}
        onRemove={handleRemoveSaved}
      />

      {/* Applications section */}
      <ApplicationsList
        applications={applications}
        jobs={applicationJobs}
        onViewJob={(jobId) => navigate(`/jobs/${jobId}`)}
        onContinue={(jobId) => navigate(`/workspace/${jobId}`)}
        onRemove={handleRemoveApplication}
      />

      {/* Saved confirmation toast */}
      {showSavedToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-card border border-border rounded-full shadow-lg px-5 py-3 flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Added to Saved Jobs</span>
          </div>
        </div>
      )}

      {/* Dismissed confirmation toast with Undo */}
      {dismissToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-card border border-border rounded-full shadow-lg px-5 py-3 flex items-center gap-3">
            <span className="text-sm font-medium text-foreground">Job dismissed</span>
            <button
              onClick={handleUndoDismiss}
              className="text-sm font-semibold text-primary hover:underline"
            >
              Undo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}