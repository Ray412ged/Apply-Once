import React from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, XCircle, HelpCircle } from "lucide-react";

export default function ReturnPrompt({ open, onRespond, jobTitle, employerName }) {
  if (!open) return null;

  return (
    <div className="bg-card rounded-2xl border-2 border-primary/30 shadow-lg p-5 space-y-4 animate-fade-in">
      <div>
        <h3 className="font-bold text-foreground text-lg">
          Did you complete the application?
        </h3>
        {(jobTitle || employerName) && (
          <p className="text-sm text-muted-foreground mt-0.5">
            {jobTitle}
            {jobTitle && employerName ? " · " : ""}
            {employerName}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Button
          className="w-full h-12 justify-start font-medium"
          onClick={() => onRespond("applied")}
        >
          <CheckCircle className="w-5 h-5 mr-3 text-success-foreground" />
          Yes, I Applied
        </Button>
        <Button
          variant="outline"
          className="w-full h-12 justify-start font-medium"
          onClick={() => onRespond("not_yet")}
        >
          <Clock className="w-5 h-5 mr-3 text-muted-foreground" />
          Not Yet
        </Button>
        <Button
          variant="outline"
          className="w-full h-12 justify-start font-medium"
          onClick={() => onRespond("withdrawn")}
        >
          <XCircle className="w-5 h-5 mr-3 text-destructive" />
          I Decided Not to Apply
        </Button>
        <Button
          variant="outline"
          className="w-full h-12 justify-start font-medium"
          onClick={() => onRespond("help")}
        >
          <HelpCircle className="w-5 h-5 mr-3 text-primary" />
          I Need Help
        </Button>
      </div>
    </div>
  );
}