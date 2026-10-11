import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Sparkles, Info, LifeBuoy } from "lucide-react";

export default function HelpSheet({ open, onOpenChange }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl max-h-[85vh] overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>Help</SheetTitle>
          <SheetDescription>How Apply Once works</SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-3">
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="w-5 h-5 text-primary" />
              <p className="font-medium text-foreground">How Apply Once works</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Enter your information once. We help you reuse it for each
              application. You always review everything before it&apos;s used.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-1.5">
              <Info className="w-5 h-5 text-primary" />
              <p className="font-medium text-foreground">About match levels</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Match levels are estimates based on your profile. The employer
              always makes the final decision.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-1.5">
              <LifeBuoy className="w-5 h-5 text-primary" />
              <p className="font-medium text-foreground">Need more help?</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Contact Base44 support for assistance with your account or the app.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}