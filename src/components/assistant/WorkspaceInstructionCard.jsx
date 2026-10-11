import React from "react";
import { ExternalLink, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WorkspaceInstructionCard({ job, onReturnToEmployer }) {
  const employerUrl = job?.application_url || job?.posting_url;

  return (
    <div className="bg-primary text-primary-foreground rounded-2xl p-5 space-y-4 shadow-md">
      <div>
        <h2 className="text-lg font-bold leading-tight">
          Complete the employer application in the other tab.
        </h2>
        <p className="text-sm text-primary-foreground/80 mt-2 leading-relaxed">
          Use the buttons below to copy your saved information, then paste it into
          the employer's application. Return to this workspace as you move through
          each application page.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-foreground text-primary flex items-center justify-center text-xs font-bold">
            1
          </span>
          <p className="text-sm text-primary-foreground/90 pt-0.5">
            Select <span className="font-semibold">Use</span> beside the information
            you need.
          </p>
        </div>
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-foreground text-primary flex items-center justify-center text-xs font-bold">
            2
          </span>
          <p className="text-sm text-primary-foreground/90 pt-0.5">
            Switch to the employer tab and paste it into the matching field.
          </p>
        </div>
      </div>

      {employerUrl && (
        <Button
          onClick={onReturnToEmployer}
          variant="secondary"
          className="w-full h-11 font-semibold"
        >
          <ExternalLink className="w-5 h-5" />
          Return to Employer Application
        </Button>
      )}

      <div className="flex items-start gap-2 text-xs text-primary-foreground/60">
        <Lightbulb className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
        <p>
          For the easiest experience on desktop, place Apply Once and the employer
          application side by side.
        </p>
      </div>
    </div>
  );
}