import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Search,
} from "lucide-react";

const STATUS_OPTIONS = ["Draft", "Active", "Expired", "Filled", "Removed", "Demo Data"];

export default function JobPostings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [employerFilter, setEmployerFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [editingJob, setEditingJob] = useState(null);

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    setLoading(true);
    try {
      const data = await base44.entities.JobPosting.filter({}, "-created_date", 200);
      setJobs(data);
    } catch (err) {
      console.error("Failed to load jobs:", err);
    } finally {
      setLoading(false);
    }
  }

  const filteredJobs = jobs.filter((job) => {
    if (statusFilter !== "all" && job.status !== statusFilter) return false;
    if (employerFilter && !job.employer_name?.toLowerCase().includes(employerFilter.toLowerCase())) return false;
    if (locationFilter) {
      const loc = [job.city, job.state, job.location].filter(Boolean).join(" ").toLowerCase();
      if (!loc.includes(locationFilter.toLowerCase())) return false;
    }
    return true;
  });

  const handleStatusChange = async (jobId, newStatus) => {
    try {
      await base44.entities.JobPosting.update(jobId, { status: newStatus });
      setJobs(jobs.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j)));
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleDelete = async (jobId) => {
    if (!confirm("Are you sure you want to delete this job posting?")) return;
    try {
      await base44.entities.JobPosting.delete(jobId);
      setJobs(jobs.filter((j) => j.id !== jobId));
    } catch (err) {
      console.error("Failed to delete job:", err);
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
          <h1 className="text-2xl font-bold text-foreground">Job Postings</h1>
          <p className="text-muted-foreground text-sm mt-1">{filteredJobs.length} postings</p>
        </div>
        <Button onClick={() => navigate("/admin/import")} className="h-11">
          <Plus className="w-5 h-5 mr-1" />
          Add Job
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={employerFilter}
            onChange={(e) => setEmployerFilter(e.target.value)}
            placeholder="Filter by employer"
            className="h-11 pl-9"
          />
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            placeholder="Filter by location"
            className="h-11 pl-9"
          />
        </div>
      </div>

      {/* Jobs missing URLs */}
      {filteredJobs.some((j) => j.status === "Active" && !j.posting_url) && (
        <div className="bg-warning/5 border border-warning/20 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">
              {filteredJobs.filter((j) => j.status === "Active" && !j.posting_url).length} active job(s) missing URLs
            </p>
          </div>
        </div>
      )}

      {/* Job list */}
      <div className="space-y-3">
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <div key={job.id} className="bg-card rounded-2xl border border-border p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-semibold text-foreground truncate">{job.job_title}</h3>
                  <p className="text-sm text-muted-foreground truncate">{job.employer_name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {[job.city, job.state].filter(Boolean).join(", ") || job.location || "No location"}
                    {job.employment_type && ` · ${job.employment_type}`}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                  job.status === "Active" ? "bg-success/10 text-success" :
                  job.status === "Draft" ? "bg-warning/10 text-warning" :
                  job.status === "Demo Data" ? "bg-accent text-accent-foreground" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {job.status}
                </span>
              </div>

              {/* Missing info warnings */}
              <div className="flex flex-wrap gap-2 mb-3">
                {!job.posting_url && (
                  <span className="text-xs text-warning flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Missing URL
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Select
                  value={job.status}
                  onValueChange={(val) => handleStatusChange(job.id, val)}
                >
                  <SelectTrigger className="h-9 w-32 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={() => setEditingJob(job)}
                >
                  <Pencil className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 text-destructive"
                  onClick={() => handleDelete(job.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-card rounded-2xl border border-dashed border-border p-8 text-center">
            <p className="text-muted-foreground text-sm">No job postings found.</p>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editingJob && (
        <EditJobModal
          job={editingJob}
          onClose={() => setEditingJob(null)}
          onSaved={() => {
            setEditingJob(null);
            loadJobs();
          }}
        />
      )}
    </div>
  );
}

function EditJobModal({ job, onClose, onSaved }) {
  const [form, setForm] = useState({ ...job });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.JobPosting.update(job.id, {
        job_title: form.job_title,
        employer_name: form.employer_name,
        city: form.city,
        state: form.state,
        employment_type: form.employment_type,
        remote_type: form.remote_type,
        salary_text: form.salary_text,
        posting_url: form.posting_url,
        application_deadline: form.application_deadline,
        full_description: form.full_description,
        minimum_qualifications: form.minimum_qualifications,
        required_education: form.required_education,
        required_experience: form.required_experience,
        required_credentials: form.required_credentials,
        status: form.status,
      });
      onSaved();
    } catch (err) {
      console.error("Failed to save job:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
      <div className="bg-card rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 animate-slide-up">
        <h2 className="text-xl font-bold text-foreground mb-4">Edit Job Posting</h2>
        <div className="space-y-4">
          <div>
            <Label>Job Title</Label>
            <Input value={form.job_title || ""} onChange={(e) => setForm({ ...form, job_title: e.target.value })} className="h-11" />
          </div>
          <div>
            <Label>Employer</Label>
            <Input value={form.employer_name || ""} onChange={(e) => setForm({ ...form, employer_name: e.target.value })} className="h-11" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>City</Label>
              <Input value={form.city || ""} onChange={(e) => setForm({ ...form, city: e.target.value })} className="h-11" />
            </div>
            <div>
              <Label>State</Label>
              <Input value={form.state || ""} onChange={(e) => setForm({ ...form, state: e.target.value })} className="h-11" />
            </div>
          </div>
          <div>
            <Label>Posting URL</Label>
            <Input value={form.posting_url || ""} onChange={(e) => setForm({ ...form, posting_url: e.target.value })} className="h-11" />
          </div>
          <div>
            <Label>Application Deadline</Label>
            <Input
              type="date"
              value={form.application_deadline || ""}
              onChange={(e) => setForm({ ...form, application_deadline: e.target.value })}
              className="h-11"
            />
          </div>
          <div>
            <Label>Full Description</Label>
            <textarea
              value={form.full_description || ""}
              onChange={(e) => setForm({ ...form, full_description: e.target.value })}
              className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div>
            <Label>Minimum Qualifications</Label>
            <textarea
              value={form.minimum_qualifications || ""}
              onChange={(e) => setForm({ ...form, minimum_qualifications: e.target.value })}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status || "Draft"} onValueChange={(val) => setForm({ ...form, status: val })}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <Button variant="ghost" className="flex-1 h-11" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 h-11" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}