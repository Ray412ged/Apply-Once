import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { BriefcaseBusiness, Plus, Search, Loader2, CheckCircle2, Clock3, AlertTriangle, Pencil, Send, XCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { orgOpportunitiesApi } from "@/lib/orgOpportunities";
import { orgEmployersApi } from "@/lib/orgEmployers";

const VERIFICATION_CLASS = {
  Verified: "bg-success/10 text-success",
  Unverified: "bg-warning/10 text-warning",
  Returned: "bg-accent text-accent-foreground",
  Rejected: "bg-destructive/10 text-destructive",
};

const STATUS_CLASS = {
  Active: "bg-success/10 text-success",
  Draft: "bg-muted text-muted-foreground",
  Filled: "bg-primary/10 text-primary",
  Expired: "bg-muted text-muted-foreground",
  Removed: "bg-destructive/10 text-destructive",
};

export default function OrgOpportunities() {
  const { session } = useOutletContext();
  const isAdmin = session?.org_role === "org_admin";
  const currentStaffId = session?.staff?.id;
  const [loading, setLoading] = useState(true);
  const [opportunities, setOpportunities] = useState([]);
  const [employers, setEmployers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Current");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [reviewing, setReviewing] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [oppData, employerData] = await Promise.all([
        orgOpportunitiesApi.list(),
        orgEmployersApi.list(),
      ]);
      setOpportunities(oppData.opportunities || []);
      setStaff(oppData.staff || []);
      setEmployers((employerData.employers || []).filter((e) => e.status !== "Archived"));
    } catch (err) {
      setError(err?.response?.data?.error || "Could not load opportunities.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return opportunities.filter((job) => {
      if (filter === "Current" && ["Filled", "Expired", "Removed"].includes(job.status)) return false;
      if (filter === "Needs Review" && !(job.status === "Draft" && job.verification_status === "Unverified" && job.submitted_at)) return false;
      if (filter === "Active" && job.status !== "Active") return false;
      if (filter === "Drafts" && job.status !== "Draft") return false;
      if (filter === "Closed" && !["Filled", "Expired", "Removed"].includes(job.status)) return false;
      if (!q) return true;
      return [job.job_title, job.employer_name, job.opportunity_type, job.city, job.state]
        .some((v) => String(v || "").toLowerCase().includes(q));
    });
  }, [opportunities, filter, query]);

  const staffName = (id) => staff.find((s) => s.id === id)?.display_name || "Staff";

  async function submit(job) {
    try {
      await orgOpportunitiesApi.submit(job.id);
      await load();
    } catch (err) {
      setError(err?.response?.data?.error || "Could not submit opportunity.");
    }
  }

  async function close(job, status) {
    try {
      await orgOpportunitiesApi.close(job.id, status);
      await load();
    } catch (err) {
      setError(err?.response?.data?.error || "Could not update opportunity.");
    }
  }

  async function reopen(job) {
    try {
      await orgOpportunitiesApi.reopen(job.id);
      await load();
    } catch (err) {
      setError(err?.response?.data?.error || "Could not reopen opportunity.");
    }
  }

  if (loading) {
    return <main className="max-w-6xl mx-auto p-5 flex min-h-[50vh] items-center justify-center"><Loader2 className="w-7 h-7 animate-spin text-primary" /></main>;
  }

  return (
    <main className="max-w-6xl mx-auto p-5 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Opportunities</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Staff submit employer opportunities. Organization admins verify them before job seekers can see them.
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Add Opportunity
        </Button>
      </div>

      {error && <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>}

      <div className="grid sm:grid-cols-[1fr_220px] gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search opportunities" className="pl-9" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
          {["Current", "Needs Review", "Active", "Drafts", "Closed", "All"].map((f) => <option key={f}>{f}</option>)}
        </select>
      </div>

      {isAdmin && opportunities.some((j) => j.status === "Draft" && j.verification_status === "Unverified" && j.submitted_at) && (
        <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">
              {opportunities.filter((j) => j.status === "Draft" && j.verification_status === "Unverified" && j.submitted_at).length} opportunity(ies) awaiting admin review
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-card rounded-2xl border border-dashed border-border p-10 text-center">
            <BriefcaseBusiness className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No opportunities found.</p>
          </div>
        ) : filtered.map((job) => {
          const owner = job.submitted_by_staff_id === currentStaffId;
          const canEdit = isAdmin || (owner && job.status === "Draft" && ["Unverified", "Returned"].includes(job.verification_status || "Unverified"));
          const awaitingReview = job.status === "Draft" && job.verification_status === "Unverified" && !!job.submitted_at;
          const canClose = isAdmin || (owner && job.status === "Active" && job.verification_status === "Verified");

          return (
            <div key={job.id} className="bg-card rounded-2xl border border-border p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-foreground">{job.job_title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLASS[job.status] || "bg-muted"}`}>{job.status}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${VERIFICATION_CLASS[job.verification_status] || "bg-muted"}`}>{job.verification_status || "Unverified"}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{job.employer_name} · {job.opportunity_type || "Job"}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {[job.city, job.state].filter(Boolean).join(", ") || job.location || "Location not added"}
                    {job.employment_type ? ` · ${job.employment_type}` : ""}
                    {job.salary_text ? ` · ${job.salary_text}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">Submitted by {staffName(job.submitted_by_staff_id)}</p>
                  {job.review_note && (
                    <div className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-xs">
                      <strong>Review note:</strong> {job.review_note}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {canEdit && !awaitingReview && (
                    <Button size="sm" variant="outline" onClick={() => { setEditing(job); setShowForm(true); }}>
                      <Pencil className="w-4 h-4 mr-1" /> Edit
                    </Button>
                  )}
                  {owner && job.status === "Draft" && ["Unverified", "Returned"].includes(job.verification_status || "Unverified") && !awaitingReview && (
                    <Button size="sm" onClick={() => submit(job)}><Send className="w-4 h-4 mr-1" /> Submit</Button>
                  )}
                  {isAdmin && awaitingReview && (
                    <Button size="sm" onClick={() => setReviewing(job)}><CheckCircle2 className="w-4 h-4 mr-1" /> Review</Button>
                  )}
                  {canClose && job.status === "Active" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => close(job, "Filled")}>Filled</Button>
                      <Button size="sm" variant="ghost" onClick={() => close(job, "Expired")}>Expire</Button>
                    </>
                  )}
                  {isAdmin && ["Filled", "Expired"].includes(job.status) && job.verification_status === "Verified" && (
                    <Button size="sm" variant="outline" onClick={() => reopen(job)}><RotateCcw className="w-4 h-4 mr-1" /> Reopen</Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <OpportunityForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditing(null); }}
        opportunity={editing}
        employers={employers}
        onSaved={async () => { setShowForm(false); setEditing(null); await load(); }}
      />

      {reviewing && (
        <ReviewDialog
          open={!!reviewing}
          opportunity={reviewing}
          onClose={() => setReviewing(null)}
          onReviewed={async () => { setReviewing(null); await load(); }}
        />
      )}
    </main>
  );
}

function OpportunityForm({ open, onClose, opportunity, employers, onSaved }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm({
      org_employer_id: opportunity?.org_employer_id || employers.find((e) => e.status !== "Archived")?.id || "",
      job_title: opportunity?.job_title || "",
      opportunity_type: opportunity?.opportunity_type || "Job",
      employment_type: opportunity?.employment_type || "",
      remote_type: opportunity?.remote_type || "Not specified",
      city: opportunity?.city || "",
      state: opportunity?.state || "",
      salary_text: opportunity?.salary_text || "",
      application_deadline: opportunity?.application_deadline || "",
      application_method: opportunity?.application_method || "External website",
      application_url: opportunity?.application_url || opportunity?.posting_url || "",
      application_email: opportunity?.application_email || "",
      application_phone: opportunity?.application_phone || "",
      application_instructions: opportunity?.application_instructions || "",
      full_description: opportunity?.full_description || "",
      minimum_qualifications: opportunity?.minimum_qualifications || "",
      background_requirements: opportunity?.background_requirements || "",
      second_chance_friendly: !!opportunity?.second_chance_friendly,
    });
    setError("");
  }, [open, opportunity, employers]);

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  async function save() {
    setSaving(true);
    setError("");
    try {
      if (opportunity) await orgOpportunitiesApi.update(opportunity.id, form);
      else await orgOpportunitiesApi.create(form);
      await onSaved();
    } catch (err) {
      setError(err?.response?.data?.error || "Could not save opportunity.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{opportunity ? "Edit Opportunity" : "Add Opportunity"}</DialogTitle></DialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="space-y-3">
          <Field label="Employer *">
            <select value={form.org_employer_id || ""} onChange={(e) => update("org_employer_id", e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Select employer</option>
              {employers.filter((e) => e.status !== "Archived").map((e) => <option key={e.id} value={e.id}>{e.employer_name}</option>)}
            </select>
          </Field>
          <Field label="Opportunity title *"><Input value={form.job_title || ""} onChange={(e) => update("job_title", e.target.value)} /></Field>
          <div className="grid sm:grid-cols-3 gap-3">
            <Field label="Type">
              <select value={form.opportunity_type || "Job"} onChange={(e) => update("opportunity_type", e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                {["Job", "Apprenticeship", "Work Experience"].map((x) => <option key={x}>{x}</option>)}
              </select>
            </Field>
            <Field label="Employment">
              <select value={form.employment_type || ""} onChange={(e) => update("employment_type", e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Not specified</option>
                {["Full-time", "Part-time", "Temporary", "Contract", "Seasonal", "Internship"].map((x) => <option key={x}>{x}</option>)}
              </select>
            </Field>
            <Field label="Remote">
              <select value={form.remote_type || "Not specified"} onChange={(e) => update("remote_type", e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                {["On-site", "Hybrid", "Remote", "Not specified"].map((x) => <option key={x}>{x}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <Field label="City"><Input value={form.city || ""} onChange={(e) => update("city", e.target.value)} /></Field>
            <Field label="State"><Input value={form.state || ""} onChange={(e) => update("state", e.target.value)} /></Field>
            <Field label="Pay"><Input value={form.salary_text || ""} onChange={(e) => update("salary_text", e.target.value)} placeholder="$20–$24/hr" /></Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Application deadline"><Input type="date" value={form.application_deadline || ""} onChange={(e) => update("application_deadline", e.target.value)} /></Field>
            <Field label="Application method">
              <select value={form.application_method || "External website"} onChange={(e) => update("application_method", e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                {["External website", "Email employer", "Call employer", "Apply in person", "Employer instructions"].map((x) => <option key={x}>{x}</option>)}
              </select>
            </Field>
          </div>
          {form.application_method === "External website" && <Field label="Application URL"><Input value={form.application_url || ""} onChange={(e) => update("application_url", e.target.value)} /></Field>}
          {form.application_method === "Email employer" && <Field label="Application email"><Input value={form.application_email || ""} onChange={(e) => update("application_email", e.target.value)} /></Field>}
          {form.application_method === "Call employer" && <Field label="Application phone"><Input value={form.application_phone || ""} onChange={(e) => update("application_phone", e.target.value)} /></Field>}
          <Field label="Application instructions"><textarea value={form.application_instructions || ""} onChange={(e) => update("application_instructions", e.target.value)} rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></Field>
          <Field label="Description"><textarea value={form.full_description || ""} onChange={(e) => update("full_description", e.target.value)} rows={4} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></Field>
          <Field label="Minimum qualifications"><textarea value={form.minimum_qualifications || ""} onChange={(e) => update("minimum_qualifications", e.target.value)} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></Field>
          <Field label="Background requirements"><Input value={form.background_requirements || ""} onChange={(e) => update("background_requirements", e.target.value)} /></Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!form.second_chance_friendly} onChange={(e) => update("second_chance_friendly", e.target.checked)} />
            Employer indicated this opportunity is second-chance friendly
          </label>
        </div>
        <div className="flex gap-2 mt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={save} disabled={saving || !form.org_employer_id || !form.job_title?.trim()}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Draft"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ReviewDialog({ open, opportunity, onClose, onReviewed }) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function decide(decision) {
    setSaving(true);
    setError("");
    try {
      await orgOpportunitiesApi.review(opportunity.id, decision, note);
      await onReviewed();
    } catch (err) {
      setError(err?.response?.data?.error || "Could not complete review.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Review Opportunity</DialogTitle></DialogHeader>
        <div className="rounded-xl bg-muted/40 p-4">
          <p className="font-semibold">{opportunity.job_title}</p>
          <p className="text-sm text-muted-foreground">{opportunity.employer_name}</p>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Field label="Review note">
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Required for return or reject." />
        </Field>
        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" disabled={saving} onClick={() => decide("return")}><Clock3 className="w-4 h-4 mr-1" /> Return</Button>
          <Button variant="outline" disabled={saving} className="text-destructive" onClick={() => decide("reject")}><XCircle className="w-4 h-4 mr-1" /> Reject</Button>
          <Button disabled={saving} onClick={() => decide("verify")}><CheckCircle2 className="w-4 h-4 mr-1" /> Verify</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }) {
  return <div><Label className="block text-sm mb-1.5">{label}</Label>{children}</div>;
}