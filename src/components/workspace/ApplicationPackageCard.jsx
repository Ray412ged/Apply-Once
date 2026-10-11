import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FileText, FileCheck, Copy, Check, ChevronDown, ChevronUp, Package } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Application Package card — surfaces the live-generated resume and a
 * job-tailored cover letter draft inside the Application Workspace so
 * "prepare" and "apply" feel like one package.
 *
 * Pure presentation: the resume + cover letter models are computed in the
 * workspace page (pure transforms of the Employment Profile + job) and
 * passed in. No data fetching or generation happens here.
 */
export default function ApplicationPackageCard({
  resumeStatus,
  resumeReady,
  coverLetter,
  coverLetterStatus,
  onOpenResume,
  onCoverLetterOpened,
}) {
  const [showLetter, setShowLetter] = useState(false);
  const [copied, setCopied] = useState(false);

  const letterReady = coverLetterStatus !== "not_ready";

  const handleCopy = async () => {
    if (!coverLetter?.toText) return;
    try {
      await navigator.clipboard.writeText(coverLetter.toText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — keep silent
    }
  };

  const resumeBadge = !resumeReady
    ? { text: "Build profile", className: "bg-warning/10 text-warning" }
    : resumeStatus === "updated"
      ? { text: "Up to date", className: "bg-success/10 text-success" }
      : { text: "Updated — review", className: "bg-primary/10 text-primary" };

  return (
    <section className="bg-card rounded-2xl border border-border p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Package className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-bold text-foreground">Your Application Package</h2>
      </div>

      {/* Resume row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Resume</p>
            <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${resumeBadge.className}`}>
              {resumeBadge.text}
            </span>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={onOpenResume} asChild>
          <Link to="/resume">
            <FileCheck className="w-4 h-4 mr-1" />
            Open
          </Link>
        </Button>
      </div>

      {/* Cover letter row */}
      <div className="border-t border-border pt-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Cover letter</p>
              <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${
                coverLetterStatus === "updated" ? "bg-primary/10 text-primary"
                : coverLetterStatus === "ready" ? "bg-success/10 text-success"
                : "bg-warning/10 text-warning"
              }`}>
                {coverLetterStatus === "updated" ? "Updated — review" : coverLetterStatus === "ready" ? "Draft ready" : "Add more profile"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {letterReady && (
              <Button size="sm" variant="outline" onClick={handleCopy}>
                {copied ? <Check className="w-4 h-4 mr-1 text-success" /> : <Copy className="w-4 h-4 mr-1" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            )}
            {letterReady && (
              <Button size="sm" variant="ghost" onClick={() => {
                if (!showLetter) onCoverLetterOpened?.();
                setShowLetter((s) => !s);
              }}>
                {showLetter ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            )}
          </div>
        </div>

        {showLetter && letterReady && (
          <div className="mt-3 rounded-xl border border-border bg-background p-4 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
            {coverLetter.toText()}
          </div>
        )}

        {!letterReady && (
          <div className="mt-2 space-y-2">
            <p className="text-xs text-muted-foreground">
              Add a contact method and some experience or skills to your profile to generate a cover letter.
            </p>
            <Button size="sm" variant="outline" asChild>
              <Link to="/profile/edit">Complete your profile</Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}