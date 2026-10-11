import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ShieldCheck, ShieldOff, Hand, ArrowLeft, Loader2 } from "lucide-react";

// Participant-facing consent detail for a single organization. Shows the
// plain-language disclosure (shared / never shared / disconnect anytime), the
// optional post-engagement follow-up as a separate choice, and — when the
// participant already has an active link to a DIFFERENT org — an explicit
// confirmation step before calling manageParticipantOrgLink with replace_existing.
export default function OrgConsentDetail({ org, currentLink, currentOrg, onConnect, onBack, connecting }) {
  const [followup, setFollowup] = useState(false);
  const [replaceOpen, setReplaceOpen] = useState(false);

  const alreadyConnected = !!currentLink && currentLink.organization_id === org.id;
  const replacing = !!currentLink && currentLink.organization_id !== org.id;
  const orgName = org.display_name || org.name;
  const currentOrgName = currentOrg?.display_name || currentOrg?.name || "your current organization";

  const handleConnect = () => {
    if (replacing) {
      setReplaceOpen(true);
      return;
    }
    onConnect({ replace_existing: false, post_engagement_followup_consent: followup });
  };

  const confirmReplace = () => {
    setReplaceOpen(false);
    onConnect({ replace_existing: true, post_engagement_followup_consent: followup });
  };

  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div>
        <h2 className="text-xl font-bold text-foreground">Connect to {orgName}</h2>
        <p className="text-sm text-muted-foreground mt-1">Review what this means before you connect.</p>
      </div>

      {/* What will be shared */}
      <div className="bg-card rounded-2xl border border-border p-4 space-y-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-success" />
          <h3 className="font-semibold text-foreground">What {orgName} can see</h3>
        </div>
        <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
          <li>Your overall readiness status category (for example, "Getting started" or "Application ready")</li>
          <li>Your momentum — whether you're actively making progress</li>
          <li>How many applications you've started or submitted</li>
        </ul>
        <p className="text-xs text-muted-foreground">
          They see summaries to support you — never the raw contents of your profile.
        </p>
      </div>

      {/* What is never shared */}
      <div className="bg-card rounded-2xl border border-border p-4 space-y-2">
        <div className="flex items-center gap-2">
          <ShieldOff className="w-4 h-4 text-destructive" />
          <h3 className="font-semibold text-foreground">What is never shared</h3>
        </div>
        <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
          <li>Your references and their contact information</li>
          <li>Licenses and credentials</li>
          <li>Any details about incarceration history or experience type</li>
          <li>Any other sensitive field in your profile</li>
        </ul>
      </div>

      {/* Disconnect anytime */}
      <div className="bg-card rounded-2xl border border-border p-4 flex items-start gap-2">
        <Hand className="w-4 h-4 text-primary mt-0.5" />
        <p className="text-sm text-foreground">
          You can disconnect at any time from More → Settings. When you disconnect, this organization
          immediately loses access to your progress.
        </p>
      </div>

      {/* Post-engagement follow-up — separate, optional */}
      <div className="bg-card rounded-2xl border border-border p-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h3 className="font-semibold text-foreground">Optional: follow-up check-in</h3>
            <p className="text-sm text-muted-foreground">
              Would you be willing to let us check in with you later about whether you found employment?
              This is separate from the organization's regular access.
            </p>
          </div>
          <Switch
            checked={followup}
            onCheckedChange={setFollowup}
            aria-label="Opt in to follow-up check-in"
          />
        </div>
        <p className="text-xs text-muted-foreground">Off by default. Say yes only if you'd like to be contacted later.</p>
      </div>

      {alreadyConnected ? (
        <div className="bg-success/5 border border-success/20 rounded-xl p-3 text-sm text-center text-foreground">
          You're already connected to {orgName}.
        </div>
      ) : (
        <Button className="w-full h-12 font-semibold" onClick={handleConnect} disabled={connecting}>
          {connecting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Connecting…
            </>
          ) : (
            `Connect to ${orgName}`
          )}
        </Button>
      )}

      <AlertDialog open={replaceOpen} onOpenChange={setReplaceOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>This will end your current connection</AlertDialogTitle>
            <AlertDialogDescription>
              Connecting to {orgName} will end {currentOrgName}'s access to your progress. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReplace}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}