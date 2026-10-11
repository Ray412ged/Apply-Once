import React, { useEffect, useMemo, useState } from "react";
import { Loader2, Search, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { orgEmployersApi } from "@/lib/orgEmployers";
import { orgOpportunitiesApi } from "@/lib/orgOpportunities";

const EMPTY = {
  employer_name: "",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  website_url: "",
  job_url: "",
};

function normalizeName(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export default function ImportEmployerOpportunityDialog({ open, onClose, employers = [], onSaved, initialEmployerName = "", isAdmin = false }) {
  const [form, setForm] = useState(EMPTY);
  const [preview, setPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm({ ...EMPTY, employer_name: initialEmployerName || "" });
    setPreview(null);
    setError("");
  }, [open, initialEmployerName]);

  const existingEmployer = useMemo(() => {
    const target = normalizeName(form.employer_name);
    if (!target) return null;
    return employers.find((e) => normalizeName(e.employer_name) === target && e.status !== "Archived") || null;
  }, [employers, form.employer_name]);

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));
  const updatePreview = (field, value) => setPreview((p) => ({ ...p, [field]: value }));

  async function importJob() {
    setImporting(true);
    setError("");
    try {
      const data = await orgOpportunitiesApi.importPreview({
        employer_name: form.employer_name,
        job_url: form.job_url,
      });
      if (!data?.job?.job_title) {
        throw new Error("AO could not identify the job title. Check the link and try again.");
      }
      setPreview(data.job);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Could not import that job.");
    } finally {
      setImporting(false);
    }
  }

  async function saveOpportunity() {
    if (!preview?.job_title?.trim()) return;
    setSaving(true);
    setError("");
    try {
      let employer = existingEmployer;
      if (!employer) {
        const created = await orgEmployersApi.create({
          employer_name: form.employer_name.trim(),
          website_url: form.website_url.trim(),
          status: "Active",
          source: "Opportunity Import",
        });
        employer = created?.employer;
      } else if (form.website_url.trim() && !employer.website_url) {
        try {
          const updated = await orgEmployersApi.update(employer.id, { website_url: form.website_url.trim() });
          employer = updated?.employer || employer;
        } catch {
          // Website enrichment is optional; do not block the opportunity.
        }
      }

      if (!employer?.id) throw new Error("Could not create or find the employer.");

      if (form.contact_name.trim()) {
        await orgEmployersApi.createContact(employer.id, {
          name: form.contact_name.trim(),
          email: form.contact_email.trim(),
          phone: form.contact_phone.trim(),
        });
      }

      const created = await orgOpportunitiesApi.create({
        org_employer_id: employer.id,
        ...preview,
        application_url: preview.application_url || form.job_url.trim(),
        submit_for_review: !isAdmin,
      });

      if (isAdmin && created?.opportunity?.id) {
        await orgOpportunitiesApi.publish(created.opportunity.id);
      } else {
        window.dispatchEvent(new CustomEvent("org-review-queue-changed"));
      }
      await onSaved?.(created?.opportunity, employer);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Could not save the opportunity.");
    } finally {
      setSaving(false);
    }
  }

  const readyToImport = form.employer_name.trim() && form.job_url.trim();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Employer + Opportunity</DialogTitle>
        </DialogHeader>

        {!preview ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Add what you know about the employer, paste the job link, and Apply Once will build the opportunity for you.
            </p>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Field label="Employer name *">
              <Input value={form.employer_name} onChange={(e) => update("employer_name", e.target.value)} placeholder="Employer name" />
            </Field>
            {existingEmployer && (
              <div className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm">
                <CheckCircle2 className="inline w-4 h-4 mr-1" /> Existing employer found. This opportunity will be added to {existingEmployer.employer_name}.
              </div>
            )}
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Contact name (optional)">
                <Input value={form.contact_name} onChange={(e) => update("contact_name", e.target.value)} />
              </Field>
              <Field label="Website (optional)">
                <Input value={form.website_url} onChange={(e) => update("website_url", e.target.value)} placeholder="https://..." />
              </Field>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Contact email (optional)">
                <Input type="email" value={form.contact_email} onChange={(e) => update("contact_email", e.target.value)} />
              </Field>
              <Field label="Contact phone (optional)">
                <Input value={form.contact_phone} onChange={(e) => update("contact_phone", e.target.value)} />
              </Field>
            </div>
            <Field label="Job link *">
              <Input value={form.job_url} onChange={(e) => update("job_url", e.target.value)} placeholder="https://careers.example.com/job/123" />
            </Field>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button className="flex-1" onClick={importJob} disabled={!readyToImport || importing}>
                {importing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Search className="w-4 h-4 mr-1" />}
                Import Opportunity
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              AO created this opportunity from the job link. Review anything you want to change, then {isAdmin ? "publish it to the Jobs board." : "send it to the lead admin for publishing."}
            </p>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="rounded-xl bg-muted/40 p-4">
              <p className="font-semibold">{form.employer_name}</p>
              <p className="text-xs text-muted-foreground">{existingEmployer ? "Existing employer" : "New employer"}</p>
            </div>
            <Field label="Job title *">
              <Input value={preview.job_title || ""} onChange={(e) => updatePreview("job_title", e.target.value)} />
            </Field>
            <div className="grid sm:grid-cols-3 gap-3">
              <Field label="City"><Input value={preview.city || ""} onChange={(e) => updatePreview("city", e.target.value)} /></Field>
              <Field label="State"><Input value={preview.state || ""} onChange={(e) => updatePreview("state", e.target.value)} /></Field>
              <Field label="Pay"><Input value={preview.salary_text || ""} onChange={(e) => updatePreview("salary_text", e.target.value)} /></Field>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Employment">
                <select value={preview.employment_type || ""} onChange={(e) => updatePreview("employment_type", e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">Not specified</option>
                  {["Full-time","Part-time","Temporary","Contract","Seasonal","Internship"].map((x) => <option key={x}>{x}</option>)}
                </select>
              </Field>
              <Field label="Remote">
                <select value={preview.remote_type || "Not specified"} onChange={(e) => updatePreview("remote_type", e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  {["On-site","Hybrid","Remote","Not specified"].map((x) => <option key={x}>{x}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Application link">
              <Input value={preview.application_url || ""} onChange={(e) => updatePreview("application_url", e.target.value)} />
            </Field>
            <Field label="Description">
              <textarea value={preview.full_description || ""} onChange={(e) => updatePreview("full_description", e.target.value)} rows={4} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </Field>
            <Field label="Minimum qualifications">
              <textarea value={preview.minimum_qualifications || ""} onChange={(e) => updatePreview("minimum_qualifications", e.target.value)} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </Field>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setPreview(null); setError(""); }}>Back</Button>
              <Button className="flex-1" onClick={saveOpportunity} disabled={saving || !preview.job_title?.trim()}>
                {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
                {isAdmin ? "Publish" : "Send for Review"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }) {
  return <div><Label className="block text-sm mb-1.5">{label}</Label>{children}</div>;
}