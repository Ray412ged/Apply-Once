import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PartyPopper, Briefcase, Loader2 } from "lucide-react";

// Participant-owned profile status only. This does not create or verify
// an Auberle Employment Institute hire outcome. EI staff record official hires
// separately in the staff workspace.
//
// checkinMode / onStillSearching are optional and used only by the Phase 6
// post-engagement follow-up (FollowupCheckinBanner) — same component, same
// wording, same form, just with an added "Still searching" acknowledgment
// path alongside the existing "I found a job!" prompt, rather than a
// separate check-in-specific UI.
export default function EmploymentStatusCard({ profile, onUpdated, checkinMode = false, onStillSearching }) {
  const [expanded, setExpanded] = useState(false);
  const [employer, setEmployer] = useState("");
  const [position, setPosition] = useState("");
  const [saving, setSaving] = useState(false);
  const [stillSearchingSaving, setStillSearchingSaving] = useState(false);

  const isEmployed = profile?.employment_status === "Offer Accepted";

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await base44.functions.invoke("updateMyEmploymentStatus", {
        action: "employed",
        employer_name: employer || "",
        position_title: position || "",
      });
      const profiles = await base44.entities.UserProfile.filter({}, "-created_date", 1);
      onUpdated?.(profiles[0] || profile);
      setExpanded(false);
      if (checkinMode) onStillSearching?.(); // reuses the same "mark answered" callback
    } catch (err) {
      console.error("Failed to confirm employment:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleStillSearching = async () => {
    setStillSearchingSaving(true);
    try {
      await onStillSearching?.();
    } finally {
      setStillSearchingSaving(false);
    }
  };

  const handleRevert = async () => {
    setSaving(true);
    try {
      await base44.functions.invoke("updateMyEmploymentStatus", {
        action: "searching",
      });
      const profiles = await base44.entities.UserProfile.filter({}, "-created_date", 1);
      onUpdated?.(profiles[0] || profile);
    } catch (err) {
      console.error("Failed to revert employment status:", err);
    } finally {
      setSaving(false);
    }
  };

  if (isEmployed) {
    return (
      <div className="bg-success/5 border border-success/20 rounded-2xl p-4 flex items-start gap-3">
        <PartyPopper className="w-5 h-5 text-success mt-0.5 shrink-0" />
        <div className="flex-1 space-y-1">
          <p className="font-semibold text-foreground">
            You're marked as employed
            {profile?.current_employer_name ? ` at ${profile.current_employer_name}` : ""}.
          </p>
          <p className="text-sm text-muted-foreground">
            {profile?.current_position_title ? `${profile.current_position_title} — ` : ""}
            Congratulations! If this offer fell through, you can switch back to searching anytime.
          </p>
          <Button variant="outline" size="sm" onClick={handleRevert} disabled={saving} className="mt-2">
            {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}
            Actually, I'm still searching
          </Button>
        </div>
      </div>
    );
  }

  if (!expanded) {
    return (
      <div className="bg-card rounded-2xl border border-border p-4 space-y-3 hover:border-primary/40 transition-colors">
        <button
          onClick={() => setExpanded(true)}
          className="w-full flex items-center gap-3 text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Briefcase className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">My employment status</p>
            <p className="text-sm text-muted-foreground">Update your profile if you found a job.</p>
          </div>
        </button>
        {checkinMode && (
          <Button
            variant="outline"
            className="w-full"
            onClick={handleStillSearching}
            disabled={stillSearchingSaving}
          >
            {stillSearchingSaving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}
            Still searching
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
      <p className="font-semibold text-foreground">Update my employment status</p>
      <div className="space-y-2">
        <Label htmlFor="employer-name">Employer</Label>
        <Input id="employer-name" value={employer} onChange={(e) => setEmployer(e.target.value)} placeholder="Company name" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="position-title">Position</Label>
        <Input id="position-title" value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Job title" />
      </div>
      <div className="flex gap-2 pt-1">
        <Button onClick={handleConfirm} disabled={saving} className="flex-1">
          {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}
          Confirm
        </Button>
        <Button variant="ghost" onClick={() => setExpanded(false)} disabled={saving}>
          Cancel
        </Button>
      </div>
    </div>
  );
}