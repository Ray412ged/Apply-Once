import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { buildProfileContext } from "@/lib/introductionData";
import { base44 } from "@/api/base44Client";
import {
  ChevronLeft, ChevronRight, Check, RotateCcw, Loader2,
} from "lucide-react";

export default function ProfessionalIntroduction({
  initialData = {},
  profileData,
  onSave,
  onPrev,
  onExitProfile,
  onReview,
  nextLabel = "Review My Profile",
  title,
}) {
  const existingSummary = initialData.professional_summary?.trim() || "";
  const [draftText, setDraftText] = useState(existingSummary);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saved, setSaved] = useState(false);

  // Auto-generate on mount if no existing summary
  useEffect(() => {
    if (!existingSummary) {
      handleGenerate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const context = buildProfileContext(profileData);
      const prompt = `Write a professional introduction for a job seeker to use on resumes, job applications, and employer profiles.

Requirements:
- One paragraph only, 75-125 words
- Written in first person
- Natural and conversational, yet professional and confident
- Do NOT mention LinkedIn by name
- Use ONLY the confirmed profile information below — do not invent experience, skills, or credentials

Profile information:
${context || "(Limited profile data available.)"}

Write only the introduction paragraph, no preamble or quotation marks.`;
      const result = await base44.integrations.Core.InvokeLLM({ prompt });
      const text = typeof result === "string" ? result : result?.text || result?.response || "";
      setDraftText(text.trim());
    } catch (err) {
      console.error("Failed to generate introduction:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ professional_summary: draftText.trim() });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndExit = async () => {
    if (!draftText.trim()) {
      onExitProfile();
      return;
    }
    setSaving(true);
    try {
      await onSave({ professional_summary: draftText.trim() });
      onExitProfile();
    } finally {
      setSaving(false);
    }
  };

  // --- Saved confirmation ---
  if (saved) {
    return (
      <div className="py-6 space-y-5 animate-fade-in">
        <div className="bg-success/10 rounded-2xl p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-3">
            <Check className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Your professional introduction is saved.</h2>
          <p className="text-sm text-muted-foreground mt-1">You can edit it anytime from your profile.</p>
        </div>
        <div className="space-y-2">
          <Button onClick={onReview} className="w-full h-14 text-base font-semibold">
            {nextLabel}
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  // --- Main editor view ---
  return (
    <div className="py-4 space-y-5 animate-fade-in">
      <button
        onClick={onPrev}
        className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="w-5 h-5" />
        Back
      </button>

      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Here's a professional introduction based on what you've shared. You can edit it anytime.
        </p>
      </div>

      {generating ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Generating your introduction...</p>
        </div>
      ) : (
        <>
          <Textarea
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            className="min-h-[200px] text-base"
            placeholder="Your professional introduction will appear here."
          />

          <div className="space-y-2">
            <Button
              onClick={handleSave}
              disabled={saving || !draftText.trim()}
              className="w-full h-14 text-base font-semibold"
            >
              {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Check className="w-5 h-5 mr-1" />}
              Save My Introduction
            </Button>
            <div className="flex gap-2">
              <Button
                onClick={handleGenerate}
                disabled={generating}
                variant="outline"
                className="flex-1 h-12"
              >
                {generating ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-1" />}
                Regenerate
              </Button>
              <Button
                onClick={handleSaveAndExit}
                disabled={saving || !draftText.trim()}
                variant="ghost"
                className="flex-1 h-12"
              >
                Save and Exit
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}