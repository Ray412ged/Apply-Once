import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BriefcaseBusiness, CheckCircle2, Loader2, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { employmentOutcomesApi } from "@/lib/employmentOutcomes";

export default function OrgEmploymentOutcomesPanel({ isAdmin, onChanged }) {
  const [loading, setLoading] = useState(true);
  const [outcomes, setOutcomes] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [showRecord, setShowRecord] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await employmentOutcomesApi.list();
      setOutcomes(data.outcomes || []);
      setParticipants(data.participants || []);
    } catch (err) {
      setError(err?.response?.data?.error || "Could not load employment outcomes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function verify(outcome, source) {
    setError("");
    try {
      await employmentOutcomesApi.verify(outcome.id, source);
      await load();
      await onChanged?.();
    } catch (err) {
      setError(err?.response?.data?.error || "Could not verify outcome.");
    }
  }

  async function voidOutcome(outcome) {
    const reason = window.prompt("Why should this outcome be voided?");
    if (!reason?.trim()) return;
    setError("");
    try {
      await employmentOutcomesApi.void(outcome.id, reason.trim());
      await load();
      await onChanged?.();
    } catch (err) {
      setError(err?.response?.data?.error || "Could not void outcome.");
    }
  }

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5 flex justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <section className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BriefcaseBusiness className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">Employment Outcomes</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Record and verify hires without replacing the participant's own application history.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowRecord(true)}>
          <Plus className="w-4 h-4 mr-1" /> Record Hire
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {outcomes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No employment outcomes recorded yet.</p>
      ) : (
        <div className="space-y-2">
          {outcomes.map((outcome) => (
            <div key={outcome.id} className="rounded-xl border border-border p-3">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">{outcome.participant_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {outcome.position_title ? `${outcome.position_title} · ` : ""}{outcome.employer_name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Started {new Date(outcome.employment_start_date + "T12:00:00").toLocaleDateString()}
                    {outcome.through_organization_opportunity ? " · Auberle opportunity" : ""}
                  </p>
                  {outcome.wage_amount != null && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Wage: ${Number(outcome.wage_amount).toLocaleString()} {outcome.wage_period ? `/${outcome.wage_period}` : ""}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                    {outcome.source}
                  </span>
                  {outcome.source === "Job Seeker Reported" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => verify(outcome, "Staff Verified")}>
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Verify
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => verify(outcome, "Employer Confirmed")}>
                        <ShieldCheck className="w-4 h-4 mr-1" /> Employer Confirmed
                      </Button>
                    </>
                  )}
                  {isAdmin && (
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => voidOutcome(outcome)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <RecordOutcomeDialog
        open={showRecord}
        onClose={() => setShowRecord(false)}
        participants={participants}
        onSaved={async () => {
          setShowRecord(false);
          await load();
          await onChanged?.();
        }}
      />
    </section>
  );
}

function RecordOutcomeDialog({ open, onClose, participants, onSaved }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm({
      participant_id: participants.find((p) => p.active)?.participant_id || participants[0]?.participant_id || "",
      employer_name: "",
      position_title: "",
      employment_start_date: "",
      source: "Staff Verified",
      wage_amount: "",
      wage_period: "hourly",
    });
    setError("");
  }, [open, participants]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  async function save() {
    setSaving(true);
    setError("");
    try {
      await employmentOutcomesApi.staffRecord(form);
      await onSaved();
    } catch (err) {
      setError(err?.response?.data?.error || "Could not record employment outcome.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Record Employment Outcome</DialogTitle></DialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="space-y-3">
          <Field label="Participant">
            <select
              value={form.participant_id || ""}
              onChange={(e) => update("participant_id", e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {participants.map((p) => (
                <option key={p.participant_id} value={p.participant_id}>
                  {p.participant_name}{p.active ? "" : " (previously connected)"}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Employer *">
            <Input value={form.employer_name || ""} onChange={(e) => update("employer_name", e.target.value)} />
          </Field>
          <Field label="Position">
            <Input value={form.position_title || ""} onChange={(e) => update("position_title", e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date *">
              <Input type="date" value={form.employment_start_date || ""} onChange={(e) => update("employment_start_date", e.target.value)} />
            </Field>
            <Field label="Source">
              <select
                value={form.source || "Staff Verified"}
                onChange={(e) => update("source", e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option>Staff Verified</option>
                <option>Employer Confirmed</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Wage amount">
              <Input type="number" min="0" step="0.01" value={form.wage_amount || ""} onChange={(e) => update("wage_amount", e.target.value)} />
            </Field>
            <Field label="Pay period">
              <select
                value={form.wage_period || "hourly"}
                onChange={(e) => update("wage_period", e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {["hourly", "weekly", "monthly", "annual"].map((x) => <option key={x}>{x}</option>)}
              </select>
            </Field>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={save} disabled={saving || !form.participant_id || !form.employer_name?.trim() || !form.employment_start_date}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Record Hire"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <Label className="block text-sm mb-1.5">{label}</Label>
      {children}
    </div>
  );
}