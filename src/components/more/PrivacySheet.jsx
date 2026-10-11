import React from "react";
import { isGuest } from "@/lib/guestStorage";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Shield, HardDrive, Cloud } from "lucide-react";
import DownloadDataButton from "@/components/DownloadDataButton";

export default function PrivacySheet({ open, onOpenChange }) {
  const guest = isGuest();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl max-h-[85vh] overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>Privacy</SheetTitle>
          <SheetDescription>How your data is stored and protected</SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-3">
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-1.5">
              <Shield className="w-5 h-5 text-primary" />
              <p className="font-medium text-foreground">Your data is private</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Only you can see your profile, documents, and application answers.
              We never share your information without your permission.
            </p>
          </div>

          {guest ? (
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-2 mb-1.5">
                <HardDrive className="w-5 h-5 text-warning" />
                <p className="font-medium text-foreground">Device-only storage</p>
              </div>
              <p className="text-sm text-muted-foreground">
                You&apos;re using guest mode. Your profile is stored only on this
                device. Creating a cloud account saves it securely so you can
                access it from any device.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-2 mb-1.5">
                <Cloud className="w-5 h-5 text-primary" />
                <p className="font-medium text-foreground">Cloud account</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Your profile is saved to your cloud account and accessible from
                any device you sign in on.
              </p>
            </div>
          )}

          {!guest && (
            <div className="rounded-xl bg-card border border-border overflow-hidden">
              <DownloadDataButton />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}