import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Trash2, Loader2 } from "lucide-react";

// Disconnect sheet, mirroring DeleteProfileSheet's bottom-sheet + single
// tap-to-confirm pattern. Calls manageParticipantOrgLink with action:"revoke"
// and the participant's own id; effect is immediate.
export default function DisconnectOrgSheet({ open, onOpenChange, orgName, participantId, organizationId, onDisconnected }) {
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState(null);

  const handleDisconnect = async () => {
    setDisconnecting(true);
    setError(null);
    try {
      await base44.functions.invoke("manageParticipantOrgLink", {
        participant_id: participantId,
        organization_id: organizationId,
        action: "revoke",
      });
      onDisconnected?.();
      onOpenChange(false);
    } catch (err) {
      setError(err?.response?.data?.error || "Couldn't disconnect. Please try again.");
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-destructive" />
            Disconnect from {orgName}?
          </SheetTitle>
          <SheetDescription>
            {orgName} will immediately lose access to your progress summaries. You can reconnect to an
            organization at any time.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-3">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            variant="destructive"
            className="w-full h-12 font-semibold"
            onClick={handleDisconnect}
            disabled={disconnecting}
          >
            {disconnecting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Disconnecting…
              </>
            ) : (
              "Disconnect"
            )}
          </Button>
          <Button
            variant="ghost"
            className="w-full h-12"
            onClick={() => onOpenChange(false)}
            disabled={disconnecting}
          >
            Cancel
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}