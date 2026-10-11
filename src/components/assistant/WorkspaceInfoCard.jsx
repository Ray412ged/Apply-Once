import React from "react";
import { Info } from "lucide-react";

export default function WorkspaceInfoCard() {
  return (
    <div className="flex items-start gap-2 text-sm bg-primary/5 rounded-2xl border border-primary/20 p-3">
      <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-primary" />
      <div>
        <p className="font-medium text-foreground">Application Workspace</p>
        <p className="text-muted-foreground text-xs mt-0.5">
          Keep this workspace open while completing the employer application in the other tab.
        </p>
      </div>
    </div>
  );
}