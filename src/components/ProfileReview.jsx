import React from "react";
import { useNavigate } from "react-router-dom";
import { PROFILE_SECTIONS } from "@/lib/profileSections";
import { isAddressed } from "@/lib/sectionCompletion";
import { isGuest } from "@/lib/guestStorage";
import { saveGuestRedirect } from "@/lib/guestRedirect";
import { ChevronLeft, Check, ChevronRight, ArrowRight, CircleDashed, Home } from "lucide-react";
import ProgressBar from "@/components/ProgressBar";

export default function ProfileReview({ completion, onExit }) {
  const navigate = useNavigate();
  const guest = isGuest();
  const sectionStatuses = completion?.sectionStatuses || {};
  const sections = completion?.sections || {};
  const percentage = completion?.percentage || 0;

  const completedCount = completion?.completedCount ?? Object.values(sectionStatuses).filter((s) => s === "completed").length;
  const totalSections = completion?.totalSections ?? (PROFILE_SECTIONS.length - 1);

  return (
    <div className="py-6 space-y-5 animate-fade-in">
      <button
        onClick={onExit}
        className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="w-5 h-5" />
        Back
      </button>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Review My Profile</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Make sure everything looks right before you start applying.
        </p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-5 text-center">
        <p className="text-4xl font-bold text-primary">{percentage}%</p>
        <p className="text-sm text-muted-foreground mt-1">
          {completedCount} of {totalSections} sections completed
        </p>
        <ProgressBar value={percentage} className="mt-3" />
      </div>

      <div className="space-y-3">
        {PROFILE_SECTIONS.filter((s) => s.id !== "review").map((section) => {
          const status = sectionStatuses[section.id] || "not_started";
          const iconBg =
            status === "completed"
              ? "bg-success/10"
              : status === "resolved"
              ? "bg-muted"
              : status === "in_progress"
              ? "bg-warning/10"
              : "bg-accent";
          const label =
            status === "completed"
              ? "Completed"
              : status === "resolved"
              ? "Resolved"
              : status === "in_progress"
              ? "In progress"
              : "Not started";
          return (
            <button
              key={section.id}
              onClick={() => navigate(`/profile/edit?section=${section.id}`)}
              className="w-full bg-card rounded-2xl border border-border p-4 flex items-center gap-4 hover:shadow-md transition-shadow text-left"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}
              >
                {status === "completed" ? (
                  <Check className="w-5 h-5 text-success" />
                ) : status === "resolved" ? (
                  <Check className="w-5 h-5 text-muted-foreground" />
                ) : status === "in_progress" ? (
                  <CircleDashed className="w-5 h-5 text-warning" />
                ) : (
                  <span className="text-muted-foreground text-sm font-medium">—</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-semibold text-foreground">{section.title}</p>
                <p className="text-sm text-muted-foreground truncate">{label}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            </button>
          );
        })}
      </div>

      {percentage === 100 && (
        <div className="bg-success/10 rounded-2xl p-5 text-center">
          <p className="text-2xl mb-1">🎉</p>
          <p className="font-bold text-foreground">Your profile is complete</p>
          <p className="text-sm text-muted-foreground mt-1">
            See local opportunities matched to the information you provided.
          </p>
        </div>
      )}

      {/* Sticky primary CTA above bottom navigation */}
      <div className="sticky bottom-16 z-10 -mx-4 px-4 py-3 bg-background border-t border-border">
        {percentage === 100 ? (
          <div className="space-y-2">
            <button
              onClick={() => navigate("/home")}
              className="w-full bg-primary text-primary-foreground rounded-xl h-14 text-base font-semibold flex items-center justify-center gap-1"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate("/jobs")}
              className="w-full bg-card text-foreground border border-border rounded-xl h-12 text-base font-medium flex items-center justify-center gap-1 hover:bg-accent/50 transition-colors"
            >
              View My Job Matches
              <ArrowRight className="w-5 h-5" />
            </button>
            {guest && (
              <button
                onClick={() => {
                  saveGuestRedirect("/jobs");
                  window.location.href = "/welcome";
                }}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground py-1"
              >
                Save My Profile First
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <button
              onClick={() => {
                const firstIncomplete = PROFILE_SECTIONS.find((s) => s.id !== "review" && !isAddressed(sectionStatuses[s.id]));
                if (firstIncomplete) {
                  navigate(`/profile/edit?section=${firstIncomplete.id}`);
                }
              }}
              className="w-full bg-primary text-primary-foreground rounded-xl h-14 text-base font-semibold flex items-center justify-center gap-1"
            >
              {(() => {
                const next = PROFILE_SECTIONS.find((s) => s.id !== "review" && !isAddressed(sectionStatuses[s.id]));
                return next ? `Continue to ${next.title}` : "Review My Profile";
              })()}
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate("/home")}
              className="w-full bg-card text-foreground border border-border rounded-xl h-11 text-sm font-medium flex items-center justify-center gap-1 hover:bg-accent/50 transition-colors"
            >
              <Home className="w-4 h-4" />
              Skip to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}