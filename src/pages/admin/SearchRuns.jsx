import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Search,
  Plus,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";

const RUN_TYPES = ["Job Import", "Job Match", "Extraction", "Scheduled", "Manual"];

export default function SearchRuns() {
  const [loading, setLoading] = useState(true);
  const [runs, setRuns] = useState([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadRuns();
  }, []);

  async function loadRuns() {
    setLoading(true);
    try {
      const data = await base44.entities.SearchRun.filter({}, "-run_date", 100);
      setRuns(data);
    } catch (err) {
      console.error("Failed to load search runs:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateRun = async () => {
    setCreating(true);
    try {
      const [jobs, users] = await Promise.all([
        base44.entities.JobPosting.filter({ status: "Active" }, "-created_date", 100),
        base44.entities.User.list(),
      ]);
      const run = await base44.entities.SearchRun.create({
        run_date: new Date().toISOString(),
        run_type: "Manual",
        number_of_active_users: users.length,
        number_of_jobs_reviewed: jobs.length,
        number_of_matches_created: 0,
        success_status: "Success",
      });
      setRuns([run, ...runs]);
    } catch (err) {
      console.error("Failed to create run:", err);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Search Runs</h1>
          <p className="text-muted-foreground text-sm mt-1">System activity and search history</p>
        </div>
        <Button onClick={handleCreateRun} disabled={creating} className="h-11">
          {creating ? <Loader2 className="w-5 h-5 mr-1 animate-spin" /> : <Plus className="w-5 h-5 mr-1" />}
          New Run
        </Button>
      </div>

      {runs.length > 0 ? (
        <div className="space-y-3">
          {runs.map((run) => (
            <div key={run.id} className="bg-card rounded-2xl border border-border p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    run.success_status === "Success" ? "bg-success/10" :
                    run.success_status === "Partial" ? "bg-warning/10" : "bg-destructive/10"
                  }`}>
                    {run.success_status === "Success" ? (
                      <CheckCircle className="w-5 h-5 text-success" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-destructive" />
                    )}
                  </div>
                  <div>
                    <p className="font-heading font-semibold text-foreground">{run.run_type}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {new Date(run.run_date).toLocaleString()}
                    </p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  run.success_status === "Success" ? "bg-success/10 text-success" :
                  run.success_status === "Partial" ? "bg-warning/10 text-warning" :
                  "bg-destructive/10 text-destructive"
                }`}>
                  {run.success_status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-accent/50 rounded-lg p-2">
                  <p className="text-lg font-bold text-foreground">{run.number_of_active_users || 0}</p>
                  <p className="text-xs text-muted-foreground">Active Users</p>
                </div>
                <div className="bg-accent/50 rounded-lg p-2">
                  <p className="text-lg font-bold text-foreground">{run.number_of_jobs_reviewed || 0}</p>
                  <p className="text-xs text-muted-foreground">Jobs Reviewed</p>
                </div>
                <div className="bg-accent/50 rounded-lg p-2">
                  <p className="text-lg font-bold text-foreground">{run.number_of_matches_created || 0}</p>
                  <p className="text-xs text-muted-foreground">Matches</p>
                </div>
              </div>

              {run.error_message && (
                <p className="text-sm text-destructive mt-3 bg-destructive/5 rounded-lg p-2">
                  {run.error_message}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-dashed border-border p-8 text-center">
          <Search className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">
            No search runs yet. Click "New Run" to create one.
          </p>
        </div>
      )}
    </div>
  );
}