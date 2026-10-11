import React from "react";
import { CheckCircle2, Sparkles, Eye } from "lucide-react";
import { deriveOverallState, getStateCopy } from "./statusHelpers";

const STATE_VISUAL = {
  ready: { gradient: "from-success to-success/80", Icon: CheckCircle2, text: "text-success-foreground" },
  review: { gradient: "from-primary to-primary/80", Icon: Eye, text: "text-primary-foreground" },
  building: { gradient: "from-primary to-primary/80", Icon: Sparkles, text: "text-primary-foreground" },
};

export default function CommandCenterHeader({ firstName, applicationReady, sectionStatuses, completion }) {
  const state = deriveOverallState(applicationReady, sectionStatuses);
  const { title, explanation } = getStateCopy(state);
  const visual = STATE_VISUAL[state];
  const { Icon } = visual;

  return (
    <div className="space-y-3">
      <div>
        <p className="text-muted-foreground text-sm">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <h1 className="text-2xl font-bold text-foreground mt-0.5">Hi {firstName} 👋</h1>
      </div>

      <div
        className={`bg-gradient-to-br ${visual.gradient} rounded-2xl p-5 ${visual.text} shadow-lg`}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Icon className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-medium opacity-90">Profile Status</p>
            <p className="text-xl font-bold">{title}</p>
          </div>
        </div>
        <p className="text-sm mt-3 opacity-90">{explanation}</p>
      </div>
    </div>
  );
}