import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useProfileData } from "@/hooks/useProfileData";
import { computeMatchScore } from "@/lib/matching";
import {
  applyFilters,
  countActiveFilters,
  FILTER_DEFAULTS,
  getFilteredJobs,
} from "@/lib/jobFilters";
import { getOrCreatePassAction, migrateHiddenJobsToPassActions } from "@/lib/dismissedJobs";
import { getOrCreateSavedJob, removeSavedJob } from "@/lib/savedJobs";
import { getOrCreateApplication } from "@/lib/applications";
import { getMyOpportunities } from "@/lib/orgJobs";
import { useSavedJobs } from "@/hooks/useSavedJobs";
import JobCard from "@/components/JobCard";
import DiscoveryView from "@/components/jobs/DiscoveryView";
import JobFilters from "@/components/jobs/JobFilters";
import { Search, SlidersHorizontal, Bookmark, Briefcase } from "lucide-react";
import { JobListSkeleton } from "@/components/Skeleton";
import { Button } from "@/components/ui/button";

function JobsContent() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const { data: savedJobs = [] } = useSavedJobs();
  const [passActions, setPassActions] = useState([]);
  const { data: profileData } = useProfileData();
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState(FILTER_DEFAULTS);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("bestMatch");
  const [activeTab, setActiveTab] = useState("all");
  const [, setActionLoading] = useState({});
  const [view, setView] = useState(() => {
    try { return sessionStorage.getItem("jobs_selected_view") || "discovery"; }
    catch { return "discovery"; }
  });
  const handleViewChange = (newView) => {
    setView(newView);
    try { sessionStorage.setItem("jobs_selected_view", newView); } catch {}
  };

  // One curated Jobs board with no participant-facing source split.
  useEffect(() => {
    async function loadData() {
      try {
        const [jobsData, hiddenData, passData] = await Promise.all([
          getMyOpportunities(),
          base44.entities.HiddenJob.filter({}, "-created_date", 500),
          base44.entities.JobSwipeAction.filter({ action: "pass" }, "-created_date", 200),
        ]);

        if (hiddenData.length > 0) {
          await migrateHiddenJobsToPassActions(hiddenData);
        }

        setJobs(jobsData);
        setPassActions(passData);
      } catch (err) {
        console.error("Failed to load jobs:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const preferences = profileData?.preferences;
  const passIds = useMemo(() => new Set(passActions.map((p) => p.job_posting_id)), [passActions]);
  const savedIds = useMemo(() => new Set(savedJobs.map((s) => s.job_posting_id)), [savedJobs]);

  // One canonical match-score call per job, reusing profileData
  // already loaded by useProfileData().
  const getMatchResult = (job) =>
    computeMatchScore(job, {
      profile: profileData?.profile,
      education: profileData?.educationRecords,
      employment: profileData?.employmentRecords,
      skills: profileData?.skills,
      credentials: profileData?.credentials,
      preferences,
    });

  // === Shared action handlers (used by both Discovery and List) ===
  // Persisting through these callbacks updates the shared passActions /
  // saved-jobs state so the single filtered collection — and therefore the
  // result count — stays identical across both views.

  const handleDismiss = useCallback(
    async (job) => {
      const existing = passActions.find((p) => p.job_posting_id === job.id);
      const previousAction = existing?.action ?? null;
      setActionLoading((p) => ({ ...p, [job.id]: true }));
      try {
        const record = await getOrCreatePassAction(job.id);
        setPassActions((prev) => {
          const without = prev.filter((p) => p.job_posting_id !== job.id);
          return [...without, record];
        });
        return { recordId: record.id, previousAction };
      } catch (err) {
        console.error("Failed to dismiss job:", err);
        return { recordId: null, previousAction: null };
      } finally {
        setActionLoading((p) => ({ ...p, [job.id]: false }));
      }
    },
    [passActions]
  );

  const handleUndoDismiss = useCallback(
    async ({ recordId, previousAction }) => {
      try {
        if (previousAction === null && recordId) {
          await base44.entities.JobSwipeAction.delete(recordId);
          setPassActions((prev) => prev.filter((p) => p.id !== recordId));
        } else if (recordId) {
          const restored = await base44.entities.JobSwipeAction.update(recordId, {
            action: previousAction,
          });
          setPassActions((prev) => prev.map((p) => (p.id === recordId ? restored : p)));
        }
      } catch (err) {
        console.error("Failed to undo dismiss:", err);
      }
    },
    []
  );

  const handleToggleSave = async (jobId) => {
    setActionLoading((p) => ({ ...p, [jobId]: true }));
    try {
      if (savedIds.has(jobId)) {
        await removeSavedJob(jobId);
      } else {
        await getOrCreateSavedJob(jobId);
      }
    } catch (err) {
      console.error("Failed to save job:", err);
    } finally {
      setActionLoading((p) => ({ ...p, [jobId]: false }));
    }
  };

  const handleSaveJob = async (job) => {
    try {
      await getOrCreateSavedJob(job.id);
      return true;
    } catch (err) {
      console.error("Failed to save job:", err);
      return false;
    }
  };

  const handleApply = async (job) => {
    try {
      await getOrCreateApplication(job.id);
      navigate(`/workspace/${job.id}`);
    } catch (err) {
      console.error("Failed to start application:", err);
    }
  };

  // === One canonical filtered collection (shared by both views) ===
  // Curated jobs only. Pipeline: exclude dismissed → search term → active
  // filters → optional Saved view. Switching between Discovery and List
  // never changes the eligible job set.
  const filteredJobs = useMemo(
    () =>
      getFilteredJobs({
        jobs,
        searchQuery,
        filters,
        activeTab,
        savedIds,
        passIds,
      }),
    [jobs, searchQuery, filters, activeTab, savedIds, passIds]
  );

  // Rank the already-filtered curated jobs using the same canonical match
  // score displayed on each card. No second matching system is introduced.
  // When profile data is too thin and scores are tied at 0, stable sorting
  // preserves the existing curated order.
  const displayedJobs = useMemo(() => {
    if (sortBy !== "bestMatch") return filteredJobs;
    return filteredJobs
      .map((job, index) => ({ job, index, score: getMatchResult(job).score || 0 }))
      .sort((a, b) => (b.score - a.score) || (a.index - b.index))
      .map(({ job }) => job);
  }, [filteredJobs, sortBy, profileData, preferences]);

  // Dismissed-but-reviewable counterpart of the same pipeline (for the
  // Discovery "Review Dismissed Jobs" toggle). Same search + filters, no tab.
  const dismissedJobs = useMemo(() => {
    const dismissed = jobs.filter((j) => passIds.has(j.id));
    let result = dismissed;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (j) =>
          j.job_title?.toLowerCase().includes(q) ||
          j.employer_name?.toLowerCase().includes(q) ||
          j.city?.toLowerCase().includes(q) ||
          j.state?.toLowerCase().includes(q)
      );
    }
    return applyFilters(result, filters);
  }, [jobs, passIds, searchQuery, filters]);

  if (loading && view === "list") {
    return (
      <div className="py-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Opportunities</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Loading available jobs...</p>
        </div>
        <JobListSkeleton />
      </div>
    );
  }

  const getEmptyMessage = () => {
    if (activeTab === "saved") return "No saved jobs yet. Tap the bookmark on any listing to save it for later.";
    if (searchQuery) return "No jobs match that search. Try different keywords.";
    return "No jobs are available right now. Check back soon.";
  };

  const tabs = [
    { value: "all", label: "Jobs", icon: Briefcase },
    { value: "saved", label: "Saved", icon: Bookmark },
  ];

  return (
    <div className="py-6 space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Jobs</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {displayedJobs.length} {displayedJobs.length === 1 ? "job" : "jobs"} available
        </p>
      </div>

      {/* View selector */}
      <div className="flex gap-2">
        <button
          onClick={() => handleViewChange("discovery")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            view === "discovery"
              ? "bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground border border-border hover:text-foreground"
          }`}
        >
          Discovery
        </button>
        <button
          onClick={() => handleViewChange("list")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            view === "list"
              ? "bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground border border-border hover:text-foreground"
          }`}
        >
          List
        </button>
      </div>

      {/* One Jobs board with a Saved view; sources stay invisible to participants. */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.value}
              onClick={() => setActiveTab(t.value)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === t.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground border border-border hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
              {t.value === "saved" && savedIds.size > 0 && (
                <span className={`text-xs ${activeTab === "saved" ? "opacity-80" : ""}`}>
                  ({savedIds.size})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {view === "discovery" ? (
        <DiscoveryView
          jobs={displayedJobs}
          dismissedJobs={dismissedJobs}
          onDismiss={handleDismiss}
          onUndoDismiss={handleUndoDismiss}
          onSave={handleSaveJob}
          onApply={handleApply}
          preferences={preferences}
          profileData={profileData}
        />
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search jobs, employers, or keywords"
              className="w-full h-12 pl-10 pr-4 rounded-xl border border-input bg-card text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="hidden sm:inline">Sort</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-10 rounded-full border border-border bg-card px-3 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Sort jobs"
              >
                <option value="bestMatch">Best Match</option>
                <option value="default">Newest</option>
              </select>
            </label>
            <div className="flex-1" />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium border transition-colors ${
                showFilters || countActiveFilters(filters) > 0
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-card text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {countActiveFilters(filters) > 0 && (
                <span className="bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                  {countActiveFilters(filters)}
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <JobFilters
              filters={filters}
              onChange={(key, value) => setFilters((p) => ({ ...p, [key]: value }))}
              onReset={() => setFilters(FILTER_DEFAULTS)}
              jobs={jobs}
            />
          )}

          {loading ? (
            <JobListSkeleton />
          ) : displayedJobs.length > 0 ? (
            <div className="space-y-3">
              {displayedJobs.map((job) => {
                const matchResult = getMatchResult(job);
                return (
                  <JobCard
                    key={job.id}
                    job={job}
                    matchLevel={matchResult.level}
                    matchScore={matchResult.score}
                    saved={savedIds.has(job.id)}
                    onSave={() => handleToggleSave(job.id)}
                    onHide={() => handleDismiss(job)}
                    preferences={preferences}
                    profileData={profileData}
                  />
                );
              })}
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-dashed border-border p-8 text-center space-y-4">
              <Briefcase className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">{getEmptyMessage()}</p>
              {(searchQuery || countActiveFilters(filters) > 0) && activeTab !== "saved" && (
                <Button
                  onClick={() => {
                    setSearchQuery("");
                    setFilters(FILTER_DEFAULTS);
                  }}
                  variant="outline"
                >
                  Clear filters
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center px-4">
        Match levels are a guide — the employer makes the final hiring decision.
      </p>
    </div>
  );
}

export default function Jobs() {
  return <JobsContent />;
}