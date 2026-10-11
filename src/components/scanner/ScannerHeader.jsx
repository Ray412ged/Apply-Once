import React from "react";
import { CheckCircle, Sparkles, Clock, FileText, Zap } from "lucide-react";

export default function ScannerHeader({
  score,
  readyCount,
  totalItems,
  missingCount,
  atsInfo,
  profileCompletion,
  remainingQuestions,
}) {
  const missing = missingCount > 0 ? missingCount : 0;
  const estimatedTime = atsInfo?.estimatedCompletionMinutes;
  const timeLabel = estimatedTime
    ? estimatedTime.firstTime === estimatedTime.returning
      ? `~${estimatedTime.firstTime} min`
      : `${estimatedTime.returning}–${estimatedTime.firstTime} min`
    : null;

  return (
    <div className="bg-gradient-to-br from-primary/10 to-success/5 rounded-2xl border border-primary/20 p-5 space-y-4">
      {/* Score + summary */}
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-foreground">Your application is {score}% ready</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {missing > 0
              ? `We've prepared your contact information, work history, education, skills, certifications, and resume. Answer ${missing} remaining ${missing === 1 ? "question" : "questions"} to continue.`
              : "Your experience has already prepared most of this application. Review the items below and complete only what is still needed."}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-success rounded-full transition-all duration-500"
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-sm font-medium text-foreground flex-shrink-0">
          <CheckCircle className="w-4 h-4 text-success" />
          {readyCount} of {totalItems}
        </div>
      </div>

      {/* ATS info badges */}
      {atsInfo && (
        <div className="flex flex-wrap gap-2 pt-1">
          {atsInfo.atsType && (
            <Badge icon={FileText} label={atsInfo.atsLabel} />
          )}
          <Badge icon={Zap} label={atsInfo.applicationStyle} />
          {timeLabel && (
            <Badge icon={Clock} label={timeLabel} />
          )}
          {atsInfo.requiresAccount && (
            <Badge icon={FileText} label="Account Required" />
          )}
          {atsInfo.resumeParsing && (
            <Badge icon={Sparkles} label="Resume Parsing" />
          )}
        </div>
      )}

      {/* Profile completion + remaining questions */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        {profileCompletion !== undefined && (
          <div className="bg-background/60 rounded-xl p-3 border border-border/50">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-muted-foreground">Profile Completion</span>
              <span className="text-sm font-bold text-foreground">{profileCompletion}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${profileCompletion}%` }}
              />
            </div>
          </div>
        )}
        {remainingQuestions !== undefined && (
          <div className="bg-background/60 rounded-xl p-3 border border-border/50">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-muted-foreground">Remaining Questions</span>
              <span className="text-sm font-bold text-foreground">{remainingQuestions}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {remainingQuestions === 0
                ? "All questions answered"
                : "Employer-specific items to complete"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Badge({ icon: Icon, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background/70 border border-border/50 text-xs font-medium text-foreground">
      <Icon className="w-3.5 h-3.5 text-primary" />
      {label}
    </span>
  );
}