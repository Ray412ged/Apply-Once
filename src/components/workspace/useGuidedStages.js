import { useState, useEffect, useCallback, useMemo } from "react";

/**
 * Guided-stage persistence for the Application Workspace.
 *
 * Each job keeps its own checklist of guided stages in sessionStorage so the
 * user's progress is private to the current device session (guest-privacy
 * behavior) and never collides with progress for a different job.
 *
 * The hook loads the correct state for the current job, persists every change,
 * guards against malformed stored data, and avoids doing storage work during
 * render (writes happen inside the update callbacks, not in the render body).
 */

const STORAGE_PREFIX = "workspace_guided_stages_";

export const EMPTY_GUIDED_STAGES = {
  employer_account: false,
  contact: false,
  employment: false,
  education: false,
  resume: false,
  questions: false,
  review: false,
  submitted: false,
};

/**
 * Reads guided stages for a job from sessionStorage.
 * Returns a normalized object even when storage is missing or malformed.
 */
export function loadGuidedStages(jobId) {
  if (!jobId) return { ...EMPTY_GUIDED_STAGES };
  try {
    const saved = sessionStorage.getItem(`${STORAGE_PREFIX}${jobId}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge over defaults so unknown/missing keys never break the shape.
      return { ...EMPTY_GUIDED_STAGES, ...(parsed && typeof parsed === "object" ? parsed : {}) };
    }
  } catch (e) {
    // Malformed JSON or unavailable storage — fall back to empty defaults.
  }
  return { ...EMPTY_GUIDED_STAGES };
}

/**
 * Persists guided stages for a job to sessionStorage.
 */
export function saveGuidedStages(jobId, stages) {
  if (!jobId) return;
  try {
    sessionStorage.setItem(`${STORAGE_PREFIX}${jobId}`, JSON.stringify(stages));
  } catch (e) {
    // Storage may be unavailable (private mode / quota) — fail silently.
  }
}

/**
 * Hook: manages guided-stage state for a single job.
 *
 * @param {string} jobId - the active job posting id
 * @returns {{ guidedStages, updateStage, resetStages, completedStageCount }}
 */
export function useGuidedStages(jobId) {
  const [guidedStages, setGuidedStages] = useState(() => loadGuidedStages(jobId));

  // Reload when the job changes (different workspace → different checklist).
  useEffect(() => {
    setGuidedStages(loadGuidedStages(jobId));
  }, [jobId]);

  const persist = useCallback(
    (next) => {
      saveGuidedStages(jobId, next);
    },
    [jobId]
  );

  // `updateStage(key)` toggles; `updateStage(key, value)` sets explicitly.
  const updateStage = useCallback(
    (key, value) => {
      setGuidedStages((prev) => {
        const resolved = value === undefined ? !prev[key] : !!value;
        const next = { ...prev, [key]: resolved };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const resetStages = useCallback(() => {
    const empty = { ...EMPTY_GUIDED_STAGES };
    persist(empty);
    setGuidedStages(empty);
  }, [persist]);

  const completedStageCount = useMemo(
    () => Object.values(guidedStages).filter(Boolean).length,
    [guidedStages]
  );

  return { guidedStages, updateStage, resetStages, completedStageCount };
}