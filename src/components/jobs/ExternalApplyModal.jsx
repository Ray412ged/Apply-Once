import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileCheck } from "lucide-react";

export default function ExternalApplyModal({
  open,
  onContinue,
  onReview,
  onCancel,
  jobTitle,
  employerName,
  destinationName = "the employer's website",
  continueLabel,
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">You're leaving Apply Once</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            This application will be completed on {destinationName}. We'll save the job to
            your Career Journey so you can return and track your progress.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-accent rounded-xl p-3 my-2">
          <p className="font-medium text-foreground text-sm">{jobTitle}</p>
          <p className="text-muted-foreground text-xs mt-0.5">{employerName}</p>
        </div>

        <div className="flex flex-col gap-2">
          <Button className="w-full h-12 font-semibold" onClick={onContinue}>
            <ExternalLink className="w-4 h-4 mr-2" />
            {continueLabel || `Continue to ${destinationName}`}
          </Button>
          <Button variant="outline" className="w-full h-11" onClick={onReview}>
            <FileCheck className="w-4 h-4 mr-2" />
            Review Job
          </Button>
          <Button variant="ghost" className="w-full h-11" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}