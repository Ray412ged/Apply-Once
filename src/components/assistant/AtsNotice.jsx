import React from "react";
import { Lock } from "lucide-react";

export default function AtsNotice({ atsType }) {
  if (!atsType) return null;

  return (
    <div className="bg-warning/5 rounded-2xl border border-warning/20 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Lock className="w-5 h-5 text-warning" />
        <h3 className="font-bold text-foreground">Employer Account Required</h3>
      </div>

      <p className="text-sm text-foreground">
        This employer requires you to sign in or create an employer account before
        completing the application.
      </p>

      <div className="bg-card rounded-xl border border-border p-3 space-y-1">
        <p className="text-xs text-muted-foreground">
          Apply Once does not store employer usernames or passwords.
        </p>
        <p className="text-xs text-muted-foreground">
          Complete your employer login and then return here to continue using your
          saved profile information.
        </p>
      </div>

      <p className="text-xs text-muted-foreground">
        ATS detected: <span className="font-medium text-foreground">{atsType}</span>
      </p>
    </div>
  );
}