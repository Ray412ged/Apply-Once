import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getOrCreateSavedJob, removeSavedJob } from "@/lib/savedJobs";
import { Loader2, Undo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import JobSwipeCard from "@/components/jobs/JobSwipeCard";
import { getMyOpportunities } from "@/lib/orgJobs";

export default function SwipePreview() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [index, setIndex] = useState(0);
  const [showInterestedToast, setShowInterestedToast] = useState(false);
  const toastTimer = useRef(null);

  // Map of job_posting_id -> existing swipe action record (for this user)
  const [existingActions, setExistingActions] = useState({});
  // Undo stack: [{ jobId, recordId, previousAction }] — previousAction null means record was newly created
  const undoStack = useRef([]);

  useEffect(() => {
    async function loadData() {
      try {
        // Load max 5 jobs — never fetch all JobPosting records
        const [jobRecords, actionRecords] = await Promise.all([
          getMyOpportunities().then((jobs) => jobs.slice(0, 5)),
          base44.entities.JobSwipeAction.list("-created_date", 50),
        ]);
        setJobs(jobRecords);
        // Index existing actions by job_posting_id for quick lookup
        const actionMap = {};
        actionRecords.forEach((r) => {
          actionMap[r.job_posting_id] = r;
        });
        setExistingActions(actionMap);
      } catch (err) {
        console.error("Failed to load swipe preview data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const currentJob = jobs[index];

  const handleAction = useCallback(
    async (job) => {
      const existing = existingActions[job.id];
      let recordId;
      let previousAction = null;

      try {
        if (existing) {
          // Update existing record — prevent duplicates
          previousAction = existing.action;
          recordId = existing.id;
          if (previousAction !== "interested") {
            const updated = await base44.entities.JobSwipeAction.update(existing.id, {
              action: "interested",
            });
            setExistingActions((prev) => ({
              ...prev,
              [job.id]: updated,
            }));
          }
        } else {
          // Create new record
          const created = await base44.entities.JobSwipeAction.create({
            job_posting_id: job.id,
            action: "interested",
          });
          recordId = created.id;
          setExistingActions((prev) => ({
            ...prev,
            [job.id]: created,
          }));
        }

        // Push to undo stack
        undoStack.current.push({
          jobId: job.id,
          recordId,
          previousAction,
        });

        // Show confirmation
        setShowInterestedToast(true);
        if (toastTimer.current) clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setShowInterestedToast(false), 2000);
      } catch (err) {
        console.error("Failed to save swipe action:", err);
      }

      // Advance to next job
      setIndex((prev) => Math.min(prev + 1, jobs.length));
    },
    [existingActions, jobs.length]
  );

  const handleUndo = useCallback(async () => {
    const lastAction = undoStack.current.pop();
    if (!lastAction) return;

    const { jobId, recordId, previousAction } = lastAction;

    try {
      if (previousAction === null) {
        // Record was newly created — delete it
        await base44.entities.JobSwipeAction.delete(recordId);
        setExistingActions((prev) => {
          const next = { ...prev };
          delete next[jobId];
          return next;
        });
      } else {
        // Record existed before — restore previous action value
        const restored = await base44.entities.JobSwipeAction.update(recordId, {
          action: previousAction,
        });
        setExistingActions((prev) => ({
          ...prev,
          [jobId]: restored,
        }));
      }

      // Restore SavedJob state to match the restored swipe action
      if (previousAction === "save") {
        await getOrCreateSavedJob(jobId);
      }
    } catch (err) {
      console.error("Failed to undo swipe action:", err);
      // Put it back on the stack if undo failed
      undoStack.current.push(lastAction);
    }

    // Return to previous card
    setIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleSwipe = useCallback(
    async (job, actionType) => {
      if (actionType === "interested") {
        await handleAction(job);
        return;
      }

      // pass or save
      const existing = existingActions[job.id];
      let recordId;
      let previousAction = null;

      try {
        if (existing) {
          previousAction = existing.action;
          recordId = existing.id;
          const updated = await base44.entities.JobSwipeAction.update(existing.id, {
            action: actionType,
          });
          setExistingActions((prev) => ({
            ...prev,
            [job.id]: updated,
          }));
        } else {
          const created = await base44.entities.JobSwipeAction.create({
            job_posting_id: job.id,
            action: actionType,
          });
          recordId = created.id;
          setExistingActions((prev) => ({
            ...prev,
            [job.id]: created,
          }));
        }

        // SavedJob is the single source of truth for saved status
        if (actionType === "save") {
          await getOrCreateSavedJob(job.id);
        } else if (previousAction === "save") {
          await removeSavedJob(job.id);
        }

        undoStack.current.push({
          jobId: job.id,
          recordId,
          previousAction,
        });
      } catch (err) {
        console.error("Failed to save swipe action:", err);
      }

      setIndex((prev) => Math.min(prev + 1, jobs.length));
    },
    [existingActions, jobs.length, handleAction]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="text-muted-foreground">No jobs available for preview.</p>
        <Button onClick={() => navigate("/jobs")}>Back to Jobs</Button>
      </div>
    );
  }

  if (index >= jobs.length) {
    return (
      <div className="py-20 text-center space-y-4 max-w-md mx-auto px-4">
        <p className="text-lg font-semibold text-foreground">You've reached the end!</p>
        <p className="text-sm text-muted-foreground">
          You reviewed all {jobs.length} jobs in this preview session.
        </p>
        <div className="flex gap-2 justify-center">
          {undoStack.current.length > 0 && (
            <Button variant="outline" onClick={handleUndo}>
              <Undo className="w-4 h-4 mr-1" />
              Undo
            </Button>
          )}
          <Button onClick={() => setIndex(0)}>Start Over</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] max-w-md mx-auto px-4 py-6 space-y-4 animate-fade-in relative">
      {/* Progress indicator */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">
          Job {index + 1} of {jobs.length}
        </p>
        {undoStack.current.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleUndo} className="text-muted-foreground">
            <Undo className="w-4 h-4 mr-1" />
            Undo
          </Button>
        )}
      </div>

      {/* Swipe card */}
      <JobSwipeCard
        key={currentJob.id}
        job={currentJob}
        onPass={(job) => handleSwipe(job, "pass")}
        onSave={(job) => handleSwipe(job, "save")}
        onInterested={(job) => handleSwipe(job, "interested")}
      />

      {/* Apply confirmation toast */}
      {showInterestedToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-card border border-border rounded-full shadow-lg px-5 py-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success" />
            <span className="text-sm font-medium text-foreground">Added to Applications</span>
          </div>
        </div>
      )}
    </div>
  );
}