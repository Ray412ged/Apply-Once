import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Shield, Cloud } from "lucide-react";
import DownloadDataButton from "@/components/DownloadDataButton";

export default function PrivacySheet({ open, onOpenChange }) {
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
              Your profile and employment information are stored in your Apply Once account.
              Authorized employment-support staff may see the employment-related information
              needed to support your participation.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-1.5">
              <Cloud className="w-5 h-5 text-primary" />
              <p className="font-medium text-foreground">Account storage</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Your profile is saved to your account and available when you sign in.
            </p>
          </div>

          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <DownloadDataButton />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}