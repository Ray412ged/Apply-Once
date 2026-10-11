import React, { useEffect, useState } from "react";
import { Plus, Loader2, Copy, Mail, MessageSquare, Check, UserPlus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const EMPTY = { participant_name: "", phone: "", email: "", referring_staff: "" };

async function invoke(payload) {
  const result = await base44.functions.invoke("orgParticipantIntake", payload);
  return result?.data || result || {};
}

export default function OrgParticipantIntakePanel() {
  const [referrals, setReferrals] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [invite, setInvite] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function load() {
    try {
      const data = await invoke({ action: "list" });
      setReferrals(data.referrals || []);
    } catch (err) {
      setError(err?.response?.data?.error || "Could not load participant invitations.");
    }
  }

  useEffect(() => { load(); }, []);

  function startNew() {
    setForm(EMPTY);
    setInvite(null);
    setError("");
    setOpen(true);
  }

  async function createAndInvite() {
    setSaving(true);
    setError("");
    try {
      const inviteData = await invoke({ action: "invite", ...form });
      const token = inviteData.invite_token;
      if (!token || !inviteData.referral?.id) throw new Error("Could not create invitation.");
      const inviteUrl = `${window.location.origin}/invite/${encodeURIComponent(token)}`;
      setInvite({ ...inviteData.referral, inviteUrl });
      await load();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Could not create invitation.");
    } finally {
      setSaving(false);
    }
  }

  async function regenerate(referral) {
    setSaving(true);
    setError("");
    try {
      const inviteData = await invoke({ action: "resend", referral_id: referral.id });
      const token = inviteData.invite_token;
      const inviteUrl = `${window.location.origin}/invite/${encodeURIComponent(token)}`;
      setForm({
        participant_name: referral.participant_name,
        phone: referral.phone,
        email: referral.email,
        referring_staff: referral.referring_staff,
      });
      setInvite({ ...referral, ...inviteData.referral, inviteUrl });
      setOpen(true);
      await load();
    } catch (err) {
      setError(err?.response?.data?.error || "Could not create invitation.");
    } finally {
      setSaving(false);
    }
  }

  async function copyInvite() {
    if (!invite?.inviteUrl) return;
    await navigator.clipboard.writeText(invite.inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const emailHref = invite
    ? `mailto:${encodeURIComponent(invite.email)}?subject=${encodeURIComponent("Your Apply Once invitation")}&body=${encodeURIComponent(
        `Hi ${invite.participant_name},\n\nAuberle Employment Institute invited you to Apply Once. Use this link to create your account or sign in:\n\n${invite.inviteUrl}\n\nAfter you verify your email, you can complete your profile and resume and start looking for jobs.`
      )}`
    : "#";

  const smsHref = invite
    ? `sms:${encodeURIComponent(invite.phone)}?&body=${encodeURIComponent(
        `Your Apply Once invitation: ${invite.inviteUrl}`
      )}`
    : "#";

  return (
    <section className="bg-card rounded-2xl border border-border p-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-foreground">Invite Participant</h2>
          <p className="text-xs text-muted-foreground mt-1">Enter name, phone, email and referring staff. The participant completes everything else in Apply Once.</p>
        </div>
        <Button onClick={startNew}><Plus className="w-4 h-4 mr-1" /> Invite Participant</Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {referrals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-5 text-center">
          <UserPlus className="w-7 h-7 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No participant invitations yet.</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {referrals.slice(0, 12).map((r) => (
            <div key={r.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{r.participant_name}</p>
                <p className="text-xs text-muted-foreground">{r.email} · {r.phone}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Referred by {r.referring_staff}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${r.status === "Joined" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                  {r.status === "Joined" ? "Joined AO" : "Invited"}
                </span>
                {r.status !== "Joined" && (
                  <Button size="sm" variant="outline" onClick={() => regenerate(r)}>Resend</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={(v) => !v && setOpen(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{invite ? "Invitation Ready" : "Invite Participant"}</DialogTitle></DialogHeader>

          {!invite ? (
            <div className="space-y-3">
              <Field label="Participant name *"><Input value={form.participant_name} onChange={(e) => setForm((p) => ({ ...p, participant_name: e.target.value }))} /></Field>
              <Field label="Phone *"><Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} /></Field>
              <Field label="Email *"><Input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} /></Field>
              <Field label="Referring staff *"><Input value={form.referring_staff} onChange={(e) => setForm((p) => ({ ...p, referring_staff: e.target.value }))} /></Field>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
                <Button
                  className="flex-1"
                  onClick={createAndInvite}
                  disabled={saving || !form.participant_name.trim() || !form.phone.trim() || !form.email.trim() || !form.referring_staff.trim()}
                >
                  {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
                  Send Invite
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl bg-muted/40 p-4">
                <p className="font-semibold">{invite.participant_name}</p>
                <p className="text-sm text-muted-foreground">{invite.email} · {invite.phone}</p>
                <p className="text-xs text-muted-foreground mt-1">Referred by {invite.referring_staff}</p>
              </div>
              <p className="text-sm text-muted-foreground">Send the secure Apply Once link by email or text. The participant handles the rest inside AO.</p>
              <div className="grid sm:grid-cols-3 gap-2">
                <Button variant="outline" onClick={copyInvite}>
                  {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                  {copied ? "Copied" : "Copy Link"}
                </Button>
                <Button asChild variant="outline"><a href={emailHref}><Mail className="w-4 h-4 mr-1" /> Email</a></Button>
                <Button asChild variant="outline"><a href={smsHref}><MessageSquare className="w-4 h-4 mr-1" /> Text</a></Button>
              </div>
              <Button className="w-full" onClick={() => setOpen(false)}>Done</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function Field({ label, children }) {
  return <div><Label className="block text-sm mb-1.5">{label}</Label>{children}</div>;
}