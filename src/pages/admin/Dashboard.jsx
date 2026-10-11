import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Briefcase,
  Users,
  FileText,
  Search,
  TrendingUp,
  Plus,
  Upload,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    draftJobs: 0,
    totalUsers: 0,
    recentRuns: [],
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [allJobs, activeJobs, draftJobs, users, runs] = await Promise.all([
          base44.entities.JobPosting.filter({}, "-created_date", 200),
          base44.entities.JobPosting.filter({ status: "Active" }, "-created_date", 100),
          base44.entities.JobPosting.filter({ status: "Draft" }, "-created_date", 100),
          base44.entities.User.list(),
          base44.entities.SearchRun.filter({}, "-run_date", 5),
        ]);

        setStats({
          totalJobs: allJobs.length,
          activeJobs: activeJobs.length,
          draftJobs: draftJobs.length,
          totalUsers: users.length,
          recentRuns: runs,
        });
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const statCards = [
    { label: "Total Jobs", value: stats.totalJobs, icon: Briefcase, color: "text-primary", bg: "bg-primary/10", path: "/admin/jobs" },
    { label: "Active Jobs", value: stats.activeJobs, icon: CheckCircle, color: "text-success", bg: "bg-success/10", path: "/admin/jobs" },
    { label: "Drafts", value: stats.draftJobs, icon: FileText, color: "text-warning", bg: "bg-warning/10", path: "/admin/jobs" },
    { label: "Users", value: stats.totalUsers, icon: Users, color: "text-foreground", bg: "bg-accent", path: "/admin/users" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">System overview and quick actions</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <button
            key={stat.label}
            onClick={() => navigate(stat.path)}
            className="bg-card rounded-2xl border border-border p-5 text-left hover:shadow-md transition-shadow"
          >
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-3xl font-bold text-foreground">{stat.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
          </button>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => navigate("/admin/import")}
            className="bg-card rounded-2xl border border-border p-5 flex items-center gap-4 hover:shadow-md transition-shadow text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-heading font-semibold text-foreground">Import Jobs</p>
              <p className="text-sm text-muted-foreground">Paste text, enter URL, or upload CSV</p>
            </div>
          </button>
          <button
            onClick={() => navigate("/admin/jobs")}
            className="bg-card rounded-2xl border border-border p-5 flex items-center gap-4 hover:shadow-md transition-shadow text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <Plus className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="font-heading font-semibold text-foreground">Manage Jobs</p>
              <p className="text-sm text-muted-foreground">Review, edit, and activate postings</p>
            </div>
          </button>
        </div>
      </div>

      {/* Recent search runs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-foreground">Recent Search Runs</h2>
          <button
            onClick={() => navigate("/admin/search-runs")}
            className="text-sm text-primary font-medium hover:underline"
          >
            View all
          </button>
        </div>
        {stats.recentRuns.length > 0 ? (
          <div className="space-y-2">
            {stats.recentRuns.map((run) => (
              <div key={run.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    run.success_status === "Success" ? "bg-success/10" : "bg-destructive/10"
                  }`}>
                    {run.success_status === "Success" ? (
                      <CheckCircle className="w-5 h-5 text-success" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-destructive" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{run.run_type}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(run.run_date).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <p className="text-muted-foreground">{run.number_of_jobs_reviewed || 0} jobs reviewed</p>
                  <p className="text-muted-foreground">{run.number_of_matches_created || 0} matches</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-dashed border-border p-8 text-center">
            <Search className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">No search runs yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}