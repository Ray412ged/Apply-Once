import React, { useEffect, useMemo, useState } from "react";
import { Building2, Plus, Search, Phone, Mail, Loader2, Archive, Pencil } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { orgEmployersApi } from "@/lib/orgEmployers";
import ImportEmployerOpportunityDialog from "@/components/organization/ImportEmployerOpportunityDialog";

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
  const [selectedId, setSelectedId] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [importEmployerName, setImportEmployerName] = useState("");
  const [showEmployerForm, setShowEmployerForm] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [editingEmployer, setEditingEmployer] = useState(null);
  const [error, setError] = useState("");

  async function loadEmployers(preferredId = null) {
    setLoading(true);
    setError("");
    try {
      const data = await orgEmployersApi.list();
      const current = (data.employers || []).filter((e) => e.status !== "Archived");
      setEmployers(current);
      const nextId = preferredId || selectedId || current[0]?.id || null;
      setSelectedId(nextId);
    } catch (err) {
      setError(err?.response?.data?.error || "Could not load employers.");
    } finally {
      setLoading(false);
    }
  }

  async function loadContacts(employerId) {
    if (!employerId) {
      setContacts([]);
      return;
    }
    setDetailLoading(true);
    try {
      const data = await orgEmployersApi.contacts(employerId);
      setContacts((data.contacts || []).filter((c) => c.status !== "Inactive"));
    } catch (err) {
      setError(err?.response?.data?.error || "Could not load employer contacts.");
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => { loadEmployers(); }, []);
  useEffect(() => { loadContacts(selectedId); }, [selectedId]);

  const selected = employers.find((e) => e.id === selectedId) || null;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return employers;
    return employers.filter((e) =>
      [e.employer_name, e.industry, e.city, e.state]
        .some((v) => String(v || "").toLowerCase().includes(q))
    );
  }, [employers, query]);

  async function archiveSelected() {
    if (!selected || !isAdmin) return;
    if (!window.confirm(`Archive ${selected.employer_name}?`)) return;
    try {
      await orgEmployersApi.archive(selected.id);
      setSelectedId(null);
      await loadEmployers();
    } catch (err) {
      setError(err?.response?.data?.error || "Could not archive employer.");
    }
  }

  if (loading) {
    return <main className="max-w-6xl mx-auto p-5 flex min-h-[50vh] items-center justify-center"><Loader2 className="w-7 h-7 animate-spin text-primary" /></main>;
  }

  return (
    <main className="max-w-6xl mx-auto p-5 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Employer Network</h2>
          <p className="text-sm text-muted-foreground mt-1">
            One shared employer list for your employment team. Add the employer once, then add jobs from a link.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => { setImportEmployerName(""); setShowImport(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Add Employer + Job
          </Button>
          <Button variant="outline" onClick={() => { setEditingEmployer(null); setShowEmployerForm(true); }}>
            Employer Only
          </Button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5">
        <section className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search employers" className="pl-9" />
          </div>
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <div className="bg-card border border-dashed border-border rounded-2xl p-8 text-center">
                <Building2 className="w-9 h-9 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No employers yet.</p>
              </div>
            ) : filtered.map((employer) => (
              <button
                key={employer.id}
                onClick={() => setSelectedId(employer.id)}
                className={`w-full text-left rounded-2xl border p-4 transition-colors ${selectedId === employer.id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30"}`}
              >
                <p className="font-semibold text-foreground truncate">{employer.employer_name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {[employer.city, employer.state].filter(Boolean).join(", ") || employer.website_url || "Employer"}
                </p>
              </button>
            ))}
          </div>
        </section>

        <section>
          {!selected ? (
            <div className="bg-card border border-border rounded-2xl p-10 text-center">
              <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Select an employer to view details.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-foreground">{selected.employer_name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLASS[selected.status] || "bg-muted"}`}>{selected.status}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {[selected.industry, selected.city, selected.state].filter(Boolean).join(" · ") || "No additional details needed"}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => { setEditingEmployer(selected); setShowEmployerForm(true); }}>
                      <Pencil className="w-4 h-4 mr-1" /> Edit
                    </Button>
                    {isAdmin && (
                      <Button size="sm" variant="ghost" onClick={archiveSelected} aria-label="Archive employer">
                        <Archive className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  <Button size="sm" onClick={() => { setImportEmployerName(selected.employer_name); setShowImport(true); }}>Add Job from Link</Button>
                  <Button size="sm" variant="outline" onClick={() => setShowContactForm(true)}>Add Contact</Button>
                  {selected.website_url && (
                    <a href={selected.website_url} target="_blank" rel="noreferrer" className="inline-flex items-center h-9 px-3 rounded-md border border-input text-sm font-medium hover:bg-accent">
                      Website
                    </a>
                  )}
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-5">
                <h4 className="font-semibold text-foreground">Contacts</h4>
                <p className="text-xs text-muted-foreground mt-1 mb-4">Only add a contact when the team has one.</p>
                {detailLoading ? (
                  <div className="py-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
                ) : contacts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No contact added.</p>
                ) : (
                  <div className="space-y-2">
                    {contacts.map((contact) => (
                      <div key={contact.id} className="rounded-xl border border-border p-3">
                        <p className="font-medium text-sm">{contact.name}</p>
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                          {contact.email && <span className="inline-flex items-center gap-1"><Mail className="w-3 h-3" />{contact.email}</span>}
                          {contact.phone && <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" />{contact.phone}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      <ImportEmployerOpportunityDialog
        open={showImport}
        onClose={() => setShowImport(false)}
        employers={employers}
        initialEmployerName={importEmployerName}
        onSaved={async (_opportunity, employer) => {
          setShowImport(false);
          await loadEmployers(employer?.id);
        }}
      />

      <EmployerForm
        open={showEmployerForm}
        onClose={() => { setShowEmployerForm(false); setEditingEmployer(null); }}
        employer={editingEmployer}
        onSaved={async (employerId) => {
          setShowEmployerForm(false);
          setEditingEmployer(null);
          await loadEmployers(employerId);
        }}
      />

      {selected && (
        <ContactForm
          open={showContactForm}
          onClose={() => setShowContactForm(false)}
          employerId={selected.id}
          onSaved={async () => {
            setShowContactForm(false);
            await loadContacts(selected.id);
          }}
        />
      )}
    </main>
  );
}

function EmployerForm({ open, onClose, employer, onSaved }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm({
      employer_name: employer?.employer_name || "",
      website_url: employer?.website_url || "",
      industry: employer?.industry || "",
      city: employer?.city || "",
      state: employer?.state || "",
    });
    setError("");
  }, [open, employer]);

  async function save() {
    setSaving(true);
    setError("");
    try {
      const data = employer
        ? await orgEmployersApi.update(employer.id, form)
        : await orgEmployersApi.create({ ...form, source: "Staff Entry" });
      await onSaved(data?.employer?.id);
    } catch (err) {
      setError(err?.response?.data?.error || "Could not save employer.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{employer ? "Edit Employer" : "Add Employer"}</DialogTitle></DialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="space-y-3">
          <Field label="Employer name *"><Input value={form.employer_name || ""} onChange={(e) => setForm((p) => ({ ...p, employer_name: e.target.value }))} /></Field>
          <Field label="Website (optional)"><Input value={form.website_url || ""} onChange={(e) => setForm((p) => ({ ...p, website_url: e.target.value }))} /></Field>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="City (optional)"><Input value={form.city || ""} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} /></Field>
            <Field label="State (optional)"><Input value={form.state || ""} onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))} /></Field>
          </div>
          <Field label="Industry (optional)"><Input value={form.industry || ""} onChange={(e) => setForm((p) => ({ ...p, industry: e.target.value }))} /></Field>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={save} disabled={saving || !form.employer_name?.trim()}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ContactForm({ open, onClose, employerId, onSaved }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm({ name: "", email: "", phone: "" });
    setError("");
  }, [open]);

  async function save() {
    setSaving(true);
    setError("");
    try {
      await orgEmployersApi.createContact(employerId, form);
      await onSaved();
    } catch (err) {
      setError(err?.response?.data?.error || "Could not add contact.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Add Contact</DialogTitle></DialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="space-y-3">
          <Field label="Contact name *"><Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></Field>
          <Field label="Email (optional)"><Input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} /></Field>
          <Field label="Phone (optional)"><Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} /></Field>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={save} disabled={saving || !form.name.trim()}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Contact"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }) {
  return <div><Label className="block text-sm mb-1.5">{label}</Label>{children}</div>;
}