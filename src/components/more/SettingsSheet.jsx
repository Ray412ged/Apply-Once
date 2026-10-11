import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useProfileData, useInvalidateProfileData } from "@/hooks/useProfileData";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Sparkles, Check } from "lucide-react";

export default function SettingsSheet({ open, onOpenChange }) {
  const { data: profileData } = useProfileData();
  const invalidate = useInvalidateProfileData();
  const profile = profileData?.profile;
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    if (open) {
      setConsent(profile?.consent_to_ai_processing || false);
    }
  }, [open, profile]);

  const handleToggle = async () => {
    const newValue = !consent;
    setConsent(newValue);
    const updates = {
      consent_to_ai_processing: newValue,
      consent_timestamp: newValue ? new Date().toISOString() : undefined,
    };
    if (profile?.id) {
      await base44.entities.UserProfile.update(profile.id, updates);
    }
    invalidate();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl max-h-[85vh] overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>Manage your preferences</SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-3">
          <button
            onClick={handleToggle}
            className="w-full flex items-start gap-3 p-4 rounded-xl border border-border bg-card text-left"
          >
            <div
              className={`mt-0.5 w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                consent ? "bg-primary border-primary" : "border-input"
              }`}
            >
              {consent && <Check className="w-4 h-4 text-primary-foreground" />}
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-primary" />
                AI Application Assistant
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Allow Apply Once to help prepare applications using your saved
                information. You can change this anytime.
              </p>
            </div>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}