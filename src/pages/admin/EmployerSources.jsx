import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Pencil, RefreshCw, Check, X, Clock, AlertTriangle, Store, Building2, FileSpreadsheet, Link2, Eye } from "lucide-react";
import EmployerSourceForm from "@/components/admin/EmployerSourceForm";
import ImportISolvedHireJob from "@/components/admin/ImportISolvedHireJob";

const STATUS_COLORS = {
  Active: "bg-success/10 text-success",
  Inactive: "bg-muted text-muted-foreground",
  Pending: "bg-warning/10 text-warning",
  Error: "bg-destructive/10 text-destructive",
};

export default function EmployerSources() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState([]);
  const [needsVerification, setNeedsVerification] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSource, setEditingSource] = useState(null);
  const [syncing, setSyncing] = useState({});
  const [expiring, setExpiring] = useState(false);
  const [expireResult, setExpireResult] = useState(null);
  const [importSource, setImportSource] = useState(null);

  async function loadData() {
    setLoading(true);
    try {
      const [sourcesData, draftJobs] = await Promise.all([
        base44.entities.EmployerSource.filter({}, "-created_date", 200),
        base44.entities.JobPosting.filter({ local_job: true, administrator_verified: false, status: "Draft" }, "-created_date", 100),
      ]);
      setSources(sourcesData);
      setNeedsVerification(draftJobs);
    } catch (err) {
      console.error("Failed to load:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  const handleSaveSource = async (formData) => {
    try {
      if (editingSource) {
        await base44.entities.EmployerSource.update(editingSource.id, formData);
      } else {
        await base44.entities.EmployerSource.create({
          ...formData,
          source_status: formData.approved ? "Active" : "Pending",
        });
      }
      setShowForm(false);
      setEditingSource(null);
      await loadData();
    } catch (err) {
      alert("Failed to save: " + err.message);
    }
  };

  const handleToggleStatus = async (source) => {
    const newStatus = source.source_status === "Active" ? "Inactive" : "Active";
    try {
      await base44.entities.EmployerSource.update(source.id, { source_status: newStatus });
      await loadData();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const handleApprove = async (source) => {
    try {
      await base44.entities.EmployerSource.update(source.id, { approved: true, source_status: "Active" });
      await loadData();
    } catch (err) {
      alert("Failed to approve");
    }
  };

  const handleSync = async (source) => {
    const funcName =
      source.provider_type === "Greenhouse" ? "syncGreenhouse"
        : source.provider_type === "Lever" ? "syncLever"
        : source.provider_type === "iSolved Hire" ? "syncISolvedHire"
        : null;
    if (!funcName) return;
    setSyncing((p) => ({ ...p, [source.id]: true }));
    try {
      const response = await base44.functions.invoke(funcName, { employer_source_id: source.id });
      const data = response.data;
      if (data.discovered !== undefined) {
        // iSolved Hire detailed sync report
        let msg = `Sync complete:\n` +
          `  Discovered: ${data.discovered}\n` +
          `  Added: ${data.added}\n` +
          `  Updated: ${data.updated}\n` +
          `  Deactivated: ${data.deactivated}\n` +
          `  Skipped: ${data.skipped}\n` +
          `  Failed: ${data.failed}`;
        if (data.errors && data.errors.length > 0) {
          msg += `\n\nErrors:\n${data.errors.join("\n")}`;
        }
        alert(msg);
      } else {
        alert(`Sync complete: ${data.added} added, ${data.updated} updated, ${data.failed} failed`);
      }
      await loadData();
    } catch (err) {
      alert("Sync failed: " + (err?.response?.data?.error || err.message));
    } finally {
      setSyncing((p) => ({ ...p, [source.id]: false }));
    }
  };

  const handleVerifyJob = async (jobId) => {
    try {
      await base44.entities.JobPosting.update(jobId, {
        status: "Active",
        administrator_verified: true,
        verified_at: new Date().toISOString(),
      });
      setNeedsVerification((prev) => prev.filter((j) => j.id !== jobId));
    } catch (err) {
      alert("Failed to verify job");
    }
  };

  const handleRunExpiration = async () => {
    setExpiring(true);
    setExpireResult(null);
    try {
      const response = await base44.functions.invoke("expireLocalJobs", {});
      setExpireResult(response.data);
      await loadData();
    } catch (err) {
      alert("Expiration failed: " + (err?.response?.data?.error || err.message));
    } finally {
      setExpiring(false);
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
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Employer Sources</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage local employer job feeds and sources.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRunExpiration} disabled={expiring}>
            {expiring ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Clock className="w-4 h-4 mr-1" />}
            Run Expiration
          </Button>
          <Button size="sm" onClick={() => { setEditingSource(null); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Add Source
          </Button>
        </div>
      </div>

      {expireResult && (
        <div className="bg-success/5 border border-success/20 rounded-xl p-4 flex items-start gap-3">
          <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Expiration complete</p>
            <p className="text-sm text-muted-foreground mt-0.5">{expireResult.message}</p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate("/admin/local-jobs/add")}
          className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3 hover:border-primary/30 transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Plus className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground text-sm">Add Local Job</p>
            <p className="text-xs text-muted-foreground">Manual job entry</p>
          </div>
        </button>
        <button
          onClick={() => navigate("/admin/local-jobs/import")}
          className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3 hover:border-primary/30 transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground text-sm">Import Local Jobs</p>
            <p className="text-xs text-muted-foreground">CSV bulk import</p>
          </div>
        </button>
      </div>

      {/* Needs Verification */}
      {needsVerification.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            <h2 className="font-heading font-semibold text-foreground">Needs Verification ({needsVerification.length})</h2>
          </div>
          <div className="space-y-2">
            {needsVerification.map((job) => (
              <div key={job.id} className="bg-card rounded-xl border border-warning/30 p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">{job.job_title}</p>
                  <p className="text-xs text-muted-foreground truncate">{job.employer_name} · {job.provider}</p>
                </div>
                <Button size="sm" variant="outline" className="h-8" onClick={() => navigate(`/jobs/${job.id}`)}>
                  Review
                </Button>
                <Button size="sm" className="h-8" onClick={() => handleVerifyJob(job.id)}>
                  <Check className="w-4 h-4 mr-1" /> Publish
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Employer Sources List */}
      <div className="space-y-3">
        <h2 className="font-heading font-semibold text-foreground">All Sources</h2>
        {sources.length === 0 ? (
          <div className="bg-card rounded-2xl border border-dashed border-border p-8 text-center">
            <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">No employer sources yet. Click "Add Source" to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sources.map((source) => (
              <div key={source.id} className="bg-card rounded-2xl border border-border p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                    <Store className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-heading font-semibold text-foreground truncate">{source.employer_name}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[source.source_status] || ""}`}>
                        {source.source_status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                      <span>{source.provider_type}</span>
                      {source.provider_identifier && <span>· {source.provider_identifier}</span>}
                      {source.city && <span>· {source.city}, {source.state}</span>}
                      {source.industry && <span>· {source.industry}</span>}
                    </div>
                    {source.last_sync_result && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">Last sync: {source.last_sync_result}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {(source.provider_type === "Greenhouse" || source.provider_type === "Lever" || source.provider_type === "iSolved Hire") && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8"
                        onClick={() => handleSync(source)}
                        disabled={syncing[source.id] || !source.approved}
                      >
                        {syncing[source.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />}
                        Sync
                      </Button>
                    )}
                    {source.provider_type === "iSolved Hire" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8"
                        onClick={() => setImportSource(source)}
                        title="Import from Job URL"
                      >
                        <Link2 className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8"
                      onClick={() => navigate("/admin/jobs")}
                      title="View Imported Jobs"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {!source.approved && (
                      <Button size="sm" variant="outline" className="h-8" onClick={() => handleApprove(source)}>
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8"
                      onClick={() => handleToggleStatus(source)}
                    >
                      {source.source_status === "Active" ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8"
                      onClick={() => { setEditingSource(source); setShowForm(true); }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <EmployerSourceForm
          open={showForm}
          onClose={() => { setShowForm(false); setEditingSource(null); }}
          onSave={handleSaveSource}
          initial={editingSource}
        />
      )}

      {importSource && (
        <ImportISolvedHireJob
          open={!!importSource}
          onClose={() => setImportSource(null)}
          employerSource={importSource}
          onSaved={loadData}
        />
      )}
    </div>
  );
}