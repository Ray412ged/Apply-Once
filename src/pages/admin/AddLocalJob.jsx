import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, Eye, Save, Send, Check, Search } from "lucide-react";
import LocalJobForm from "@/components/admin/localjobs/LocalJobForm";

export default function AddLocalJob() {
  const navigate = useNavigate();
  const [employerSources, setEmployerSources] = useState([]);
  const [loadingSources, setLoadingSources] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [saved, setSaved] = useState(false);
  const [autoFillUrl, setAutoFillUrl] = useState("");
  const [autoFilling, setAutoFilling] = useState(false);
  const [formData, setFormData] = useState({
    employer_name: "",
    job_title: "",
    industry: "",
    full_description: "",
    responsibilities: "",
    minimum_qualifications: "",
    preferred_qualifications: "",
    location: "",
    city: "",
    state: "",
    postal_code: "",
    remote_type: "On-site",
    employment_type: "",
    salary_min: undefined,
    salary_max: undefined,
    salary_period: "",
    schedule: "",
    benefits: [],
    application_method: "",
    posting_url: "",
    application_email: "",
    application_phone: "",
    application_instructions: "",
    source_name: "",
    posting_date: new Date().toISOString().split("T")[0],
    application_deadline: "",
    number_of_openings: undefined,
    background_requirements: "",
    apprenticeship_available: false,
    second_chance_friendly: false,
    employer_source_id: "",
  });

  React.useEffect(() => {
    async function loadSources() {
      try {
        const sources = await base44.entities.EmployerSource.filter({ approved: true }, "-created_date", 100);
        setEmployerSources(sources);
      } catch (err) {
        console.error("Failed to load employer sources:", err);
      } finally {
        setLoadingSources(false);
      }
    }
    loadSources();
  }, []);

  const validate = () => {
    const errors = [];
    if (!formData.employer_name) errors.push("Employer is required");
    if (!formData.job_title) errors.push("Job title is required");
    const hasLocation = formData.city || formData.state || formData.postal_code || formData.location;
    const isRemote = formData.remote_type === "Remote" || formData.remote_type === "Hybrid";
    if (!hasLocation && !isRemote) errors.push("Location or remote status is required");
    const hasAppMethod =
      formData.application_method ||
      formData.posting_url ||
      formData.application_email ||
      formData.application_phone ||
      formData.application_instructions;
    if (!hasAppMethod) errors.push("At least one application method is required");
    return errors;
  };

  const buildPayload = (status, verified) => {
    const payload = {
      ...formData,
      local_job: true,
      provider: "manual",
      status,
      administrator_verified: verified,
      import_date: new Date().toISOString(),
    };
    if (verified) {
      payload.verified_at = new Date().toISOString();
    }
    // Clean up undefined values
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
    return payload;
  };

  const handleSaveDraft = async () => {
    const errors = validate();
    if (errors.length > 0) {
      alert(errors.join("\n"));
      return;
    }
    setSaving(true);
    try {
      await base44.entities.JobPosting.create(buildPayload("Draft", false));
      setSaved(true);
    } catch (err) {
      alert("Failed to save: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    const errors = validate();
    if (errors.length > 0) {
      alert(errors.join("\n"));
      return;
    }
    setSaving(true);
    try {
      await base44.entities.JobPosting.create(buildPayload("Active", true));
      setSaved(true);
    } catch (err) {
      alert("Failed to publish: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  const handleAutoFill = async () => {
    setAutoFilling(true);
    try {
      const res = await base44.functions.invoke("webSearchJob", { job_url: autoFillUrl.trim() });
      const job = res?.data?.job;
      if (!job) {
        alert("No details found for that URL. Try adding the employer name too.");
        return;
      }
      setFormData((prev) => ({
        ...prev,
        job_title: prev.job_title || job.job_title || prev.job_title,
        employer_name: prev.employer_name || job.employer_name || prev.employer_name,
        city: prev.city || job.city || prev.city,
        state: prev.state || job.state || prev.state,
        location: prev.location || job.location || prev.location,
        employment_type: prev.employment_type || job.employment_type || prev.employment_type,
        remote_type:
          prev.remote_type && prev.remote_type !== "On-site" ? prev.remote_type : (job.remote_type || prev.remote_type),
        posting_url: prev.posting_url || job.application_url || prev.posting_url,
        full_description: prev.full_description || job.full_description || prev.full_description,
        application_method: prev.application_method || (job.application_url ? "External website" : prev.application_method),
      }));
    } catch (err) {
      alert("Auto-fill failed: " + (err.message || "Unknown error"));
    } finally {
      setAutoFilling(false);
    }
  };

  if (saved) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="bg-success/10 rounded-2xl p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-3">
            <Check className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Job saved to your profile.</h2>
          <p className="text-sm text-muted-foreground mt-1">What would you like to do next?</p>
        </div>
        <div className="space-y-2">
          <Button variant="outline" className="w-full h-12" onClick={() => { setSaved(false); setFormData({ ...formData, job_title: "", full_description: "" }); }}>
            Add Another Job
          </Button>
          <Button className="w-full h-12" onClick={() => navigate("/admin/employer-sources")}>
            View Employer Sources
          </Button>
          <Button variant="ghost" className="w-full h-11" onClick={() => navigate("/admin/dashboard")}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (previewMode) {
    return (
      <div className="space-y-4 animate-fade-in">
        <button onClick={() => setPreviewMode(false)} className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-5 h-5" /> Back to Edit
        </button>
        <h1 className="text-2xl font-bold text-foreground">Preview</h1>
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <div>
            <h2 className="text-xl font-bold text-foreground">{formData.job_title || "Untitled Position"}</h2>
            <p className="text-muted-foreground">{formData.employer_name}</p>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {formData.city && <span>{[formData.city, formData.state].filter(Boolean).join(", ")}</span>}
            {formData.remote_type !== "Not specified" && <span className="text-primary">{formData.remote_type}</span>}
            {formData.employment_type && <span>{formData.employment_type}</span>}
            {formData.salary_min != null && <span>${formData.salary_min}{formData.salary_max != null ? `–$${formData.salary_max}` : ""}{formData.salary_period ? `/${formData.salary_period}` : ""}</span>}
          </div>
          {formData.full_description && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{formData.full_description}</p>}
          {formData.responsibilities && (
            <div>
              <p className="font-medium text-foreground text-sm mb-1">Duties</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{formData.responsibilities}</p>
            </div>
          )}
          {formData.minimum_qualifications && (
            <div>
              <p className="font-medium text-foreground text-sm mb-1">Requirements</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{formData.minimum_qualifications}</p>
            </div>
          )}
          {formData.application_method && (
            <div className="bg-accent rounded-xl p-3">
              <p className="text-sm font-medium text-foreground">Apply: {formData.application_method}</p>
              {formData.posting_url && <p className="text-sm text-primary mt-1">{formData.posting_url}</p>}
              {formData.application_email && <p className="text-sm text-muted-foreground mt-1">Email: {formData.application_email}</p>}
              {formData.application_phone && <p className="text-sm text-muted-foreground">Phone: {formData.application_phone}</p>}
              {formData.application_instructions && <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">{formData.application_instructions}</p>}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 h-12" onClick={() => setPreviewMode(false)}>Continue Editing</Button>
          <Button className="flex-1 h-12" onClick={handlePublish} disabled={saving}>
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 mr-1" />}
            Publish
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <button onClick={() => navigate("/admin/employer-sources")} className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ChevronLeft className="w-5 h-5" /> Back
      </button>
      <div>
        <h1 className="text-2xl font-bold text-foreground">Add Local Job</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Create a job posting for a local employer.</p>
      </div>

      <div className="bg-accent/40 rounded-xl border border-border p-3 space-y-2">
        <p className="text-xs font-medium text-foreground">Auto-fill from a job URL</p>
        <p className="text-xs text-muted-foreground">
          Use when a direct import isn't available (e.g. anti-bot portals). Web search extracts the details; review before saving.
        </p>
        <div className="flex gap-2">
          <input
            className="flex-1 h-10 rounded-md border border-input bg-card px-3 text-sm"
            placeholder="https://careers.example.com/job/123"
            value={autoFillUrl}
            onChange={(e) => setAutoFillUrl(e.target.value)}
          />
          <Button variant="outline" size="sm" onClick={handleAutoFill} disabled={autoFilling || !autoFillUrl.trim()}>
            {autoFilling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Auto-fill
          </Button>
        </div>
      </div>

      {loadingSources ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <LocalJobForm formData={formData} setFormData={setFormData} employerSources={employerSources} />
      )}

      <div className="flex gap-2 sticky bottom-4 bg-background py-3 z-10">
        <Button variant="outline" className="flex-1 h-12" onClick={handleSaveDraft} disabled={saving}>
          <Save className="w-4 h-4 mr-2" /> Save as Draft
        </Button>
        <Button variant="secondary" className="flex-1 h-12" onClick={() => setPreviewMode(true)} disabled={saving}>
          <Eye className="w-4 h-4 mr-2" /> Preview
        </Button>
        <Button className="flex-1 h-12" onClick={handlePublish} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
          Publish
        </Button>
      </div>
    </div>
  );
}