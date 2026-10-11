import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Building2,
  Plus,
  Search,
  Phone,
  Mail,
  CalendarClock,
  AlertTriangle,
  Users,
  Loader2,
  CheckCircle2,
  Archive,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { orgEmployersApi } from "@/lib/orgEmployers";

const STATUS_CLASS = {
  Lead: "bg-warning/10 text-warning",
  Active: "bg-success/10 text-success",
  Inactive: "bg-muted text-muted-foreground",
  Archived: "bg-muted text-muted-foreground",
};

export default function OrgEmployers() {
  const { session } = useOutletContext();
  const isAdmin = session?.org_role === "org_admin";
  const [loading, setLoading] = useState(true);
  const [employers, setEmployers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Current");
  const [showEmployerForm, setShowEmployerForm] = useState(false);
  const [editingEmployer, setEditingEmployer] = useState(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [error, setError] = useState("");

  async function loadEmployers(preferredId = null) {
    setLoading(true);
    setError("");
    try {
      const data = await orgEmployersApi.list();
      setEmployers(data.employers || []);
      setStaff(data.staff || []);
      const nextId =
        preferredId ||
        selectedId ||
        (data.employers || []).find((e) => e.status !== "Archived")?.id ||
        data.employers?.[0]?.id ||
        null;
      setSelectedId(nextId);
    } catch (err) {
      setError(err?.response?.data?.error || "Could not load the employer network.");
    } finally {
      setLoading(false);
    }
  }

  async function loadDetail(employerId) {
    if (!employerId) {
      setContacts([]);
      setActivities([]);
      return;
    }
    setDetailLoading(true);
    try {
      const [contactData, activityData] = await Promise.all([
        orgEmployersApi.contacts(employerId),
        orgEmployersApi.activities(employerId),
      ]);
      setContacts(contactData.contacts || []);
      setActivities(activityData.activities || []);
    } catch (err) {
      setError(err?.response?.data?.error || "Could not load employer details.");
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    loadEmployers();
  }, []);

  useEffect(() => {
    loadDetail(selectedId);
  }, [selectedId]);

  const selected = employers.find((e) => e.id === selectedId) || null;
  const canEditSelected = !!selected && (
    isAdmin ||
    selected.relationship_owner_staff_id === session?.staff?.id ||
    (selected.status === "Lead" && selected.created_by_staff_id === session?.staff?.id)
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return employers.filter((e) => {
      if (statusFilter === "Current" && e.status === "Archived") return false;
      if (statusFilter !== "Current" && statusFilter !== "All" && e.status !== statusFilter) return false;
      if (!q) return true;
      return [
        e.employer_name,
        e.industry,
        e.city,
        e.state,
      ].some((value) => String(value || "").toLowerCase().includes(q));
    });
  }, [employers, query, statusFilter]);

  const staffName = (staffId) => {
    const person = staff.find((s) => s.id === staffId);
    return person?.display_name || person?.email || "Unassigned";
  };

  async function handleArchive() {
    if (!selected || !isAdmin) return;
    if (!window.confirm(`Archive ${selected.employer_name}?`)) return;
    try {
      await orgEmployersApi.archive(selected.id);
      await loadEmployers();
    } catch (err) {
      setError(err?.response?.data?.error || "Could not archive employer.");
    }
  }

  async function handleCompleteNextStep(activityId) {
    try {
      await orgEmployersApi.completeNextStep(activityId);
      await Promise.all([loadDetail(selectedId), loadEmployers(selectedId)]);
    } catch (err) {
      setError(err?.response?.data?.error || "Could not complete next step.");
    }
  }

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto p-5 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto p-5 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Employer Network</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Preserve employer relationships, contacts, activity and next steps across your organization.
          </p>
        </div>
        <Button onClick={() => { setEditingEmployer(null); setShowEmployerForm(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Add Employer
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5">
        <section className="space-y-3">
          <div className="bg-card border border-border rounded-2xl p-3 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search employers"
                className="pl-9"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {["Current", "All", "Lead", "Active", "Inactive", "Archived"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            {filtered.length === 0 ? (
              <div className="bg-card border border-dashed border-border rounded-2xl p-8 text-center">
                <Building2 className="w-9 h-9 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No employers found.</p>
              </div>
            ) : (
              filtered.map((employer) => (
                <button
                  key={employer.id}
                  onClick={() => setSelectedId(employer.id)}
                  className={`w-full text-left rounded-2xl border p-4 transition-colors ${
                    selectedId === employer.id
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">{employer.employer_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {[employer.industry, employer.city, employer.state].filter(Boolean).join(" · ") || "No location added"}
                      </p>
                    </div>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_CLASS[employer.status] || ""}`}>
                      {employer.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                    <Metric value={employer.contact_count || 0} label="Contacts" />
                    <Metric value={employer.connected_staff_count || 0} label="Staff" />
                    <Metric value={employer.open_next_steps || 0} label="Next steps" />
                  </div>

                  {employer.continuity_risk && employer.status !== "Archived" && (
                    <div className="flex items-center gap-1.5 mt-3 text-xs text-warning">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Continuity risk: one or fewer active staff connections
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </section>

        <section>
          {!selected ? (
            <div className="bg-card border border-border rounded-2xl p-10 text-center">
              <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Select an employer to view the relationship history.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-foreground">{selected.employer_name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLASS[selected.status] || ""}`}>
                        {selected.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {[selected.industry, selected.city, selected.state].filter(Boolean).join(" · ") || "Employer details not yet added"}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {canEditSelected && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setEditingEmployer(selected); setShowEmployerForm(true); }}
                      >
                        <Pencil className="w-4 h-4 mr-1" /> Edit
                      </Button>
                    )}
                    {isAdmin && selected.status !== "Archived" && (
                      <Button size="sm" variant="ghost" onClick={handleArchive}>
                        <Archive className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-3 mt-5">
                  <InfoBox
                    icon={Users}
                    label="Relationship owner"
                    value={staffName(selected.relationship_owner_staff_id)}
                  />
                  <InfoBox
                    icon={CalendarClock}
                    label="Last activity"
                    value={selected.last_activity_date ? new Date(selected.last_activity_date).toLocaleDateString() : "No activity yet"}
                  />
                  <InfoBox
                    icon={AlertTriangle}
                    label="Continuity"
                    value={selected.continuity_risk ? "Needs redundancy" : "Covered"}
                  />
                </div>

                {selected.notes && (
                  <p className="text-sm text-muted-foreground mt-4 border-t border-border pt-4">{selected.notes}</p>
                )}

                <div className="flex flex-wrap gap-2 mt-4">
                  <Button size="sm" onClick={() => setShowActivityForm(true)}>Log Activity</Button>
                  <Button size="sm" variant="outline" onClick={() => setShowContactForm(true)}>Add Contact</Button>
                  {selected.website_url && (
                    <a
                      href={selected.website_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center h-9 px-3 rounded-md border border-input text-sm font-medium hover:bg-accent"
                    >
                      Website
                    </a>
                  )}
                </div>
              </div>

              {detailLoading ? (
                <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : (
                <>
                  <div className="bg-card border border-border rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-foreground">Contacts</h4>
                        <p className="text-xs text-muted-foreground">Multiple contacts can be preserved for each employer.</p>
                      </div>
                    </div>

                    {contacts.filter((c) => c.status !== "Inactive").length === 0 ? (
                      <p className="text-sm text-muted-foreground">No active contacts yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {contacts.filter((c) => c.status !== "Inactive").map((contact) => (
                          <div key={contact.id} className="rounded-xl border border-border p-3 flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium text-sm text-foreground">{contact.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {[contact.title, contact.department].filter(Boolean).join(" · ")}
                              </p>
                              <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                                {contact.email && <span className="inline-flex items-center gap-1"><Mail className="w-3 h-3" />{contact.email}</span>}
                                {contact.phone && <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" />{contact.phone}</span>}
                              </div>
                            </div>
                            <span className="text-[11px] text-muted-foreground">{staffName(contact.relationship_owner_staff_id)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-card border border-border rounded-2xl p-5">
                    <div className="mb-4">
                      <h4 className="font-semibold text-foreground">Relationship Activity</h4>
                      <p className="text-xs text-muted-foreground">Short factual notes and clear next steps.</p>
                    </div>

                    {activities.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No employer activity recorded yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {activities.map((activity) => (
                          <div key={activity.id} className="border-l-2 border-primary/30 pl-4 py-1">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-medium text-foreground">{activity.activity_type}</p>
                              <span className="text-xs text-muted-foreground">
                                {activity.activity_date ? new Date(activity.activity_date).toLocaleDateString() : ""}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{activity.note}</p>
                            {activity.next_step && (
                              <div className={`mt-2 rounded-lg px-3 py-2 text-xs ${
                                activity.next_step_done ? "bg-success/5 text-muted-foreground" : "bg-warning/10 text-foreground"
                              }`}>
                                <div className="flex items-center justify-between gap-3">
                                  <span>
                                    <strong>Next:</strong> {activity.next_step}
                                    {activity.next_step_due ? ` · due ${new Date(activity.next_step_due + "T12:00:00").toLocaleDateString()}` : ""}
                                  </span>
                                  {!activity.next_step_done && (
                                    <button
                                      className="font-medium text-primary hover:underline"
                                      onClick={() => handleCompleteNextStep(activity.id)}
                                    >
                                      Mark done
                                    </button>
                                  )}
                                  {activity.next_step_done && <CheckCircle2 className="w-4 h-4 text-success" />}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </section>
      </div>

      <EmployerForm
        open={showEmployerForm}
        onClose={() => { setShowEmployerForm(false); setEditingEmployer(null); }}
        employer={editingEmployer}
        staff={staff}
        isAdmin={isAdmin}
        currentStaffId={session?.staff?.id}
        onSaved={async (employerId) => {
          setShowEmployerForm(false);
          setEditingEmployer(null);
          await loadEmployers(employerId);
        }}
      />

      {selected && (
        <>
          <ContactForm
            open={showContactForm}
            onClose={() => setShowContactForm(false)}
            employerId={selected.id}
            staff={staff}
            currentStaffId={session?.staff?.id}
            onSaved={async () => {
              setShowContactForm(false);
              await Promise.all([loadDetail(selected.id), loadEmployers(selected.id)]);
            }}
          />
          <ActivityForm
            open={showActivityForm}
            onClose={() => setShowActivityForm(false)}
            employerId={selected.id}
            contacts={contacts}
            staff={staff}
            currentStaffId={session?.staff?.id}
            onSaved={async () => {
              setShowActivityForm(false);
              await Promise.all([loadDetail(selected.id), loadEmployers(selected.id)]);
            }}
          />
        </>
      )}
    </main>
  );
}

function Metric({ value, label }) {
  return (
    <div className="rounded-lg bg-muted/50 px-2 py-2">
      <p className="text-base font-semibold text-foreground">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

function InfoBox({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl bg-muted/40 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <p className="text-sm font-medium text-foreground mt-1">{value}</p>
    </div>
  );
}

function EmployerForm({ open, onClose, employer, staff, isAdmin, currentStaffId, onSaved }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [duplicate, setDuplicate] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm({
      employer_name: employer?.employer_name || "",
      industry: employer?.industry || "",
      website_url: employer?.website_url || "",
      city: employer?.city || "",
      state: employer?.state || "",
      postal_code: employer?.postal_code || "",
      notes: employer?.notes || "",
      status: employer?.status || "Lead",
      relationship_owner_staff_id: employer?.relationship_owner_staff_id || currentStaffId || "",
    });
    setDuplicate(null);
    setError("");
  }, [open, employer, currentStaffId]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  async function save(confirmDuplicate = false) {
    if (!form.employer_name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const payload = { ...form, confirm_duplicate: confirmDuplicate };
      const result = employer
        ? await orgEmployersApi.update(employer.id, payload)
        : await orgEmployersApi.create(payload);
      await onSaved(result.employer?.id || employer?.id);
    } catch (err) {
      const data = err?.response?.data;
      if (data?.duplicate_warning) {
        setDuplicate(data);
      } else {
        setError(data?.error || "Could not save employer.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{employer ? "Edit Employer" : "Add Employer Lead"}</DialogTitle>
        </DialogHeader>

        {duplicate && (
          <div className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm">
            <p className="font-medium">Possible duplicate</p>
            <p className="text-muted-foreground mt-1">
              {duplicate.matches?.map((m) => `${m.employer_name} (${m.status})`).join(", ")}
            </p>
            <Button size="sm" variant="outline" className="mt-2" onClick={() => save(true)}>
              Save anyway
            </Button>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="space-y-3">
          <Field label="Employer name *">
            <Input value={form.employer_name || ""} onChange={(e) => update("employer_name", e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Industry">
              <Input value={form.industry || ""} onChange={(e) => update("industry", e.target.value)} />
            </Field>
            <Field label="Website">
              <Input value={form.website_url || ""} onChange={(e) => update("website_url", e.target.value)} placeholder="https://" />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="City"><Input value={form.city || ""} onChange={(e) => update("city", e.target.value)} /></Field>
            <Field label="State"><Input value={form.state || ""} onChange={(e) => update("state", e.target.value)} /></Field>
            <Field label="ZIP"><Input value={form.postal_code || ""} onChange={(e) => update("postal_code", e.target.value)} /></Field>
          </div>
          <Field label="Relationship owner">
            <select
              value={form.relationship_owner_staff_id || ""}
              onChange={(e) => update("relationship_owner_staff_id", e.target.value)}
              disabled={!isAdmin && !!employer}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {staff.map((s) => <option key={s.id} value={s.id}>{s.display_name || s.email || s.user_id}</option>)}
            </select>
          </Field>
          {isAdmin && (
            <Field label="Status">
              <select
                value={form.status || "Lead"}
                onChange={(e) => update("status", e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {["Lead", "Active", "Inactive", "Archived"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
          )}
          <Field label="Notes">
            <textarea
              value={form.notes || ""}
              onChange={(e) => update("notes", e.target.value)}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Factual, professional, employment-related notes only."
            />
          </Field>
        </div>

        <div className="flex gap-2 mt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={() => save(false)} disabled={saving || !form.employer_name?.trim()}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ContactForm({ open, onClose, employerId, staff, currentStaffId, onSaved }) {
  const [form, setForm] = useState({});

  useEffect(() => {
    if (open) {
      setForm({
        name: "",
        title: "",
        department: "",
        email: "",
        phone: "",
        location: "",
        preferred_contact_method: "Email",
        relationship_owner_staff_id: currentStaffId || "",
      });
    }
  }, [open, currentStaffId]);

  async function save() {
    await orgEmployersApi.createContact(employerId, form);
    await onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Add Employer Contact</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="Name *"><Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Title"><Input value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
            <Field label="Department"><Input value={form.department || ""} onChange={(e) => setForm({ ...form, department: e.target.value })} /></Field>
          </div>
          <Field label="Email"><Input value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Phone"><Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Relationship owner">
            <select
              value={form.relationship_owner_staff_id || ""}
              onChange={(e) => setForm({ ...form, relationship_owner_staff_id: e.target.value })}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {staff.map((s) => <option key={s.id} value={s.id}>{s.display_name || s.email || s.user_id}</option>)}
            </select>
          </Field>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={save} disabled={!form.name?.trim()}>Save Contact</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ActivityForm({ open, onClose, employerId, contacts, staff, currentStaffId, onSaved }) {
  const [form, setForm] = useState({});

  useEffect(() => {
    if (open) {
      setForm({
        activity_type: "Call",
        contact_id: "",
        note: "",
        next_step: "",
        next_step_due: "",
        next_step_owner_staff_id: currentStaffId || "",
      });
    }
  }, [open, currentStaffId]);

  async function save() {
    await orgEmployersApi.logActivity(employerId, form);
    await onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Log Employer Activity</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <select
                value={form.activity_type || "Call"}
                onChange={(e) => setForm({ ...form, activity_type: e.target.value })}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {["Call", "Email", "Meeting", "Employer Visit", "Hiring Event", "Follow-up", "Other"].map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Contact">
              <select
                value={form.contact_id || ""}
                onChange={(e) => setForm({ ...form, contact_id: e.target.value })}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">No contact</option>
                {contacts.filter((c) => c.status !== "Inactive").map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          </div>
          <Field label="One-line note *">
            <Input
              value={form.note || ""}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Spoke with HR; hiring two laborers next month."
            />
          </Field>
          <Field label="Next step">
            <Input
              value={form.next_step || ""}
              onChange={(e) => setForm({ ...form, next_step: e.target.value })}
              placeholder="Email candidate list"
            />
          </Field>
          {form.next_step && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Due date">
                <Input type="date" value={form.next_step_due || ""} onChange={(e) => setForm({ ...form, next_step_due: e.target.value })} />
              </Field>
              <Field label="Owner">
                <select
                  value={form.next_step_owner_staff_id || ""}
                  onChange={(e) => setForm({ ...form, next_step_owner_staff_id: e.target.value })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {staff.map((s) => <option key={s.id} value={s.id}>{s.display_name || s.email || s.user_id}</option>)}
                </select>
              </Field>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={save} disabled={!form.note?.trim()}>Save Activity</Button>
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