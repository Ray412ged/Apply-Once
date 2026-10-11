import React from "react";
import { FileText, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Resume status card for the Employment Command Center.
 *
 * States (spec):
 *   - not_ready : "Add more profile information to create your resume."
 *                 button: Continue Profile
 *   - ready     : "Your live resume is ready."
 *                 button: View Resume
 *   - updated   : "Your resume reflects your latest profile changes."
 *                 button: View Resume
 */
export default function ResumeStatusCard({ status, onViewResume, onContinueProfile }) {
  const config = {
    not_ready: {
      title: "Resume",
      message: "Add more profile information to create your resume.",
      button: "Continue Profile",
      onClick: onContinueProfile,
      icon: <FileText className="w-5 h-5 text-muted-foreground" />,
      accent: "bg-muted/40",
    },
    ready: {
      title: "Resume",
      message: "Your live resume is ready.",
      button: "View Resume",
      onClick: onViewResume,
      icon: <FileText className="w-5 h-5 text-primary" />,
      accent: "bg-primary/10",
    },
    updated: {
      title: "Resume",
      message: "Your resume reflects your latest profile changes.",
      button: "View Resume",
      onClick: onViewResume,
      icon: <Sparkles className="w-5 h-5 text-success" />,
      accent: "bg-success/10",
    },
  }[status] || null;

  if (!config) return null;

  return (
    <div className="bg-card rounded-2xl border border-border p-4">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.accent}`}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{config.title}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{config.message}</p>
        </div>
      </div>
      {config.onClick && (
        <Button
          onClick={config.onClick}
          variant={status === "not_ready" ? "outline" : "default"}
          className="w-full mt-3"
        >
          {config.button}
          <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      )}
    </div>
  );
}