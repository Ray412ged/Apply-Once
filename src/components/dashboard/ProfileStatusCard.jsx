import React from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";

export default function ProfileStatusCard({ ready, completionPercentage = 0, onPrimary, onSecondary }) {
  if (ready) {
    return (
      <div className="bg-gradient-to-br from-success to-success/80 rounded-2xl p-5 text-success-foreground shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-medium opacity-90">Profile Status</p>
            <p className="text-xl font-bold">Application Ready</p>
          </div>
        </div>
        <p className="text-sm mt-3 opacity-90">
          Your profile contains the information needed to begin applying for jobs.
        </p>
        <Button
          onClick={onPrimary}
          variant="secondary"
          className="w-full h-12 mt-4 font-semibold bg-white text-success hover:bg-white/90"
        >
          Browse Jobs
          <ArrowRight className="w-5 h-5 ml-1" />
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-5 text-primary-foreground shadow-lg">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-7 h-7" />
        </div>
        <div>
          <p className="text-sm font-medium opacity-90">Profile Status</p>
          <p className="text-xl font-bold">
            {completionPercentage === 0 ? "Let's build your profile" : "Building your profile"}
          </p>
        </div>
      </div>
      <p className="text-sm mt-3 opacity-90">
        {completionPercentage === 0
          ? "Add a few details and you'll be ready to start applying."
          : `Your profile is ${completionPercentage}% complete. Keep going to unlock more opportunities.`}
      </p>
      {onSecondary && (
        <Button
          onClick={onSecondary}
          variant="secondary"
          className="w-full h-12 mt-4 font-semibold bg-white text-primary hover:bg-white/90"
        >
          Continue Building
          <ArrowRight className="w-5 h-5 ml-1" />
        </Button>
      )}
    </div>
  );
}