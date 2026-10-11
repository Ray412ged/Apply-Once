import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, Link2, AlertTriangle, CheckCircle } from "lucide-react";

const inputClass =
  "w-full h-10 rounded-lg border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Temporary", "Contract", "Seasonal", "Internship"];

export default function ImportISolvedHireJob({ open, onClose, employerSource, onSaved }) {
  const [step, setStep] = useState("url");
  const [jobUrl, setJobUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [jobData, setJobData] = useState(null);
  const [closed, setClosed] = useState(false);

  const reset = () => {
    setStep("url");
    setJobUrl("");
    setJobData(null);
    setError(null);
    setClosed(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFetch = async () => {
    if (!jobUrl.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const response = await base44.functions.invoke("importISolvedHireJob", {
        job_url: jobUrl.trim(),
        employer_source_id: employerSource?.id,
      });
      const data = response.data;
      if (data.error) {
        setError(data.error);
        return;
      }
      setJobData(data.job);
      setClosed(data.closed);
      setStep("preview");
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Failed to fetch job page");
    } finally {
      setLoading(false);
    }
  };

  const handleManualEntry = () => {
    setJobData({
      job_title: "",
      employer_name: employerSource?.employer_name || "",
      location: "",
      city: "",
      state: "",
      employment_type: "",
      posting_date: "",
      full_description: "",
      posting_url: jobUrl.trim(),
      external_job_id: "",
      application_method: "External website",
      provider: "isolved_hire",
      source_name: employerSource?.employer_name || "",
      industry: employerSource?.industry || "Construction",
    });
    setError(null);
    setStep("preview");
  };

  const handleSave = async () => {
    if (!jobData?.job_title) return;
    setSaving(true);
    setError(null);
    try {
      const response = await base44.functions.invoke("importISolvedHireJob", {
        job_url: jobUrl.trim(),
        employer_source_id: employerSource?.id,
        save: true,
        job_data: jobData,
      });
      const data = response.data;
      if (data.error) {
        setError(data.error);
        return;
      }
      onSaved?.();
      handleClose();
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Failed to save job");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setJobData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import iSolved Hire Job</DialogTitle>
          <DialogDescription>
            {employerSource?.employer_name
              ? `${employerSource.employer_name} — Paste a public job posting URL to extract and import.`
              : "Paste a public job posting URL to extract and import."}
          </DialogDescription>
        </DialogHeader>

        {step === "url" && (
          <div className="space-y-4">
            <div>
              <Label className="mb-1.5 block text-sm">Job URL *</Label>
              <Input
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                className={inputClass}
                placeholder="https://franjoconstruction.isolvedhire.com/jobs/1094878"
                onKeyDown={(e) => e.key === "Enter" && !loading && handleFetch()}
              />
            </div>
            {error && (
              <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleFetch} disabled={loading || !jobUrl.trim()}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Link2 className="w-4 h-4 mr-2" />}
                Fetch &amp; Preview
              </Button>
              <Button variant="outline" onClick={handleManualEntry}>
                Manual Entry
              </Button>
            </div>
          </div>
        )}

        {step === "preview" && jobData && (
          <div className="space-y-4">
            {closed && (
              <div className="bg-warning/5 border border-warning/20 rounded-xl p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                <p className="text-sm text-warning">
                  This position appears to be closed. It will be saved as inactive (Expired).
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="mb-1.5 block text-sm">Job Title *</Label>
                <Input
                  value={jobData.job_title}
                  onChange={(e) => updateField("job_title", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <Label className="mb-1.5 block text-sm">Employer</Label>
                <Input
                  value={jobData.employer_name}
                  onChange={(e) => updateField("employer_name", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <Label className="mb-1.5 block text-sm">Employment Type</Label>
                <select
                  value={jobData.employment_type || ""}
                  onChange={(e) => updateField("employment_type", e.target.value || undefined)}
                  className={inputClass}
                >
                  <option value="">Not specified</option>
                  {EMPLOYMENT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <Label className="mb-1.5 block text-sm">Location</Label>
                <Input
                  value={jobData.location || ""}
                  onChange={(e) => updateField("location", e.target.value)}
                  className={inputClass}
                  placeholder="Full address"
                />
              </div>
              <div>
                <Label className="mb-1.5 block text-sm">City</Label>
                <Input
                  value={jobData.city || ""}
                  onChange={(e) => updateField("city", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <Label className="mb-1.5 block text-sm">State</Label>
                <Input
                  value={jobData.state || ""}
                  onChange={(e) => updateField("state", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <Label className="mb-1.5 block text-sm">Posting Date</Label>
                <Input
                  type="date"
                  value={jobData.posting_date || ""}
                  onChange={(e) => updateField("posting_date", e.target.value || undefined)}
                  className={inputClass}
                />
              </div>
              <div>
                <Label className="mb-1.5 block text-sm">External Job ID</Label>
                <Input
                  value={jobData.external_job_id || ""}
                  onChange={(e) => updateField("external_job_id", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="col-span-2">
                <Label className="mb-1.5 block text-sm">Posting URL</Label>
                <Input
                  value={jobData.posting_url || ""}
                  onChange={(e) => updateField("posting_url", e.target.value)}
                  className={inputClass}
                />
              </div>
              {jobData.full_description && (
                <div className="col-span-2">
                  <Label className="mb-1.5 block text-sm">Description Preview</Label>
                  <div className="bg-muted/30 rounded-lg border border-border p-3 max-h-48 overflow-y-auto text-sm text-muted-foreground prose-sm">
                    <div dangerouslySetInnerHTML={{ __html: jobData.full_description }} />
                  </div>
                </div>
              )}
              <div className="col-span-2">
                <Label className="mb-1.5 block text-sm">Full Description (editable)</Label>
                <Textarea
                  value={jobData.full_description || ""}
                  onChange={(e) => updateField("full_description", e.target.value)}
                  className="min-h-[120px] font-mono text-xs"
                  placeholder="Job description..."
                />
              </div>
            </div>
            {error && (
              <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep("url")}>
                Back
              </Button>
              <Button className="flex-1" onClick={handleSave} disabled={saving || !jobData.job_title}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Save Job
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}