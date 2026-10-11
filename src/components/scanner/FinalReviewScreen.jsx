import React from "react";
import { Check, FileText, Briefcase, GraduationCap, Wrench, Award, Users, MessageSquare, Mail, ExternalLink, ArrowLeft, Save, Clock, Zap, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

function SummaryRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3 py-2">
      <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <span className="text-sm text-muted-foreground flex-shrink-0">{label}</span>
      <span className="text-sm font-medium text-foreground text-right ml-auto truncate">{value}</span>
    </div>
  );
}

export default function FinalReviewScreen({
  job,
  analysis,
  answers,
  selectedResume,
  coverLetterStatus,
  onContinueToApplication,
  onReviewInfo,
  onSaveFinishLater,
}) {
  const missing = analysis?.missing || [];
  const answerableMissing = missing.filter((m) => m.type !== "link");
  const unanswered = answerableMissing.filter((m) => answers[m.id] === undefined || answers[m.id] === "");

  return (
    <div className="py-6 space-y-5 animate-fade-in pb-32">
      <button
        onClick={onReviewInfo}
        className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to scanner
      </button>

      <div className="bg-success/10 rounded-2xl p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-3">
          <Check className="w-8 h-8 text-success" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Your application materials are ready</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {job.job_title} at {job.employer_name}
        </p>
      </div>

      {analysis?.atsInfo && (
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-foreground text-sm">Before you continue</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.atsInfo.atsType && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent text-xs font-medium text-accent-foreground">
                <FileText className="w-3.5 h-3.5" />
                {analysis.atsInfo.atsLabel}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent text-xs font-medium text-accent-foreground">
              <Zap className="w-3.5 h-3.5" />
              {analysis.atsInfo.applicationStyle}
            </span>
            {analysis.atsInfo.estimatedCompletionMinutes && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent text-xs font-medium text-accent-foreground">
                <Clock className="w-3.5 h-3.5" />
                {analysis.atsInfo.estimatedCompletionMinutes.returning}–{analysis.atsInfo.estimatedCompletionMinutes.firstTime} min
              </span>
            )}
          </div>
          {analysis.atsInfo.requiresAccount && (
            <p className="text-sm text-muted-foreground">
              This employer requires you to create an account on their website. If you don't have one, you'll be prompted to sign up.
            </p>
          )}
          {analysis.atsInfo.resumeParsing && (
            <p className="text-sm text-muted-foreground">
              This employer's system can parse your resume to auto-fill work history — upload your resume and let it populate the fields.
            </p>
          )}
          {analysis.atsInfo.applicationStages.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Application steps you'll see:</p>
              <div className="flex flex-wrap gap-1.5">
                {analysis.atsInfo.applicationStages.map((stage, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                    {i + 1}. {stage}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border p-4">
        <h2 className="font-bold text-foreground mb-2">Application summary</h2>
        <div className="divide-y divide-border">
          <SummaryRow icon={FileText} label="Resume" value={selectedResume?.document_name || "Not selected"} />
          <SummaryRow icon={Briefcase} label="Employment" value={`${analysis?.ready.find((r) => r.id === "employment")?.detail || "From your profile"}`} />
          <SummaryRow icon={GraduationCap} label="Education" value={analysis?.ready.find((r) => r.id === "education")?.detail || "From your profile"} />
          <SummaryRow icon={Wrench} label="Skills" value={analysis?.ready.find((r) => r.id === "skills")?.detail || "From your profile"} />
          <SummaryRow icon={Award} label="Certifications" value={analysis?.ready.find((r) => r.id === "credentials")?.detail || "From your profile"} />
          <SummaryRow icon={Users} label="References" value={analysis?.ready.find((r) => r.id === "references")?.detail || "From your profile"} />
          <SummaryRow icon={Mail} label="Cover letter" value={coverLetterStatus === "ready" ? "Ready" : coverLetterStatus === "drafted" ? "Draft prepared" : "Not included"} />
        </div>
      </div>

      {answerableMissing.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-4">
          <h2 className="font-bold text-foreground mb-2 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Your answers
          </h2>
          <div className="space-y-2">
            {answerableMissing.map((item) => (
              <div key={item.id} className="py-1.5">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-medium text-foreground">
                  {answers[item.id] !== undefined ? String(answers[item.id]) : "Not answered"}
                </p>
              </div>
            ))}
          </div>
          {unanswered.length > 0 && (
            <p className="text-xs text-warning mt-2">{unanswered.length} question{unanswered.length !== 1 ? "s" : ""} still unanswered.</p>
          )}
        </div>
      )}

      <div className="bg-accent rounded-xl p-3 text-xs text-muted-foreground">
        We've prepared your information. The employer's application will open next, and you may need to confirm or paste some answers.
      </div>

      <div className="space-y-2">
        <Button onClick={onContinueToApplication} className="w-full h-14 text-base font-semibold">
          <ExternalLink className="w-5 h-5 mr-1" />
          Continue to Application
        </Button>
        <Button variant="outline" onClick={onReviewInfo} className="w-full h-12">
          Review My Information
        </Button>
        <Button variant="ghost" onClick={onSaveFinishLater} className="w-full h-12">
          <Save className="w-4 h-4 mr-1" />
          Save and Finish Later
        </Button>
      </div>
    </div>
  );
}