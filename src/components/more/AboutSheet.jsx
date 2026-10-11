import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

export default function AboutSheet({ open, onOpenChange }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl max-h-[85vh] overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>About Apply Once</SheetTitle>
          <SheetDescription>Your supportive employment assistant</SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="text-center">
            <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mx-auto mb-3">
              <span className="text-primary-foreground font-bold text-lg">AO</span>
            </div>
            <p className="font-heading font-bold text-foreground">Apply Once</p>
            <p className="text-xs text-muted-foreground mt-0.5">Version 0.1</p>
          </div>

          <p className="text-sm text-muted-foreground text-center px-2">
            Build your professional profile once and reuse it whenever you apply
            for work. Apply Once helps you organize your experience, skills, and
            goals — and prepares you to apply with confidence.
          </p>

          <p className="text-xs text-muted-foreground text-center">
            Match levels are a guide — the employer makes the final hiring
            decision.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}