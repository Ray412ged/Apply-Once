import React from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * One-time "Your resume is ready" accomplishment message.
 *
 * Shown once when the resume first becomes available. No elaborate
 * animation. Persistence is handled by the parent (markResumeCelebrationShown)
 * so the message never reappears after the user has seen it.
 *
 * visible  — whether to render at all (parent gates on the persisted flag)
 * onDismiss — mark the celebration as seen
 */
export default function ResumeCelebration({ visible, onDismiss }) {
  const navigate = useNavigate();
  if (!visible) return null;

  return (
    <div className="bg-gradient-to-br from-primary/10 to-success/10 border border-primary/20 rounded-2xl p-5 relative">
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
      <p className="text-2xl">🎉</p>
      <h2 className="text-lg font-bold text-foreground mt-1.5">Your resume is ready.</h2>
      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
        Apply Once used the information in your profile to create a professional resume.
      </p>
      <div className="flex flex-wrap gap-2 mt-4">
        <Button onClick={() => { onDismiss(); navigate("/resume"); }}>
          View My Resume
        </Button>
        <Button variant="outline" onClick={() => { onDismiss(); navigate("/jobs"); }}>
          Continue to Job Matches
        </Button>
      </div>
    </div>
  );
}