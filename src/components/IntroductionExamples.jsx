import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { buildProfileContext } from "@/lib/introductionData";
import { base44 } from "@/api/base44Client";
import { ChevronLeft, Check, Pencil, RefreshCw, Loader2 } from "lucide-react";

export default function IntroductionExamples({ profileData, onSelect, onBack, onSkip }) {
  const [loading, setLoading] = useState(true);
  const [examples, setExamples] = useState([]);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    generateExamples();
  }, []);

  async function generateExamples() {
    setLoading(true);
    setEditingIdx(null);
    try {
      const context = buildProfileContext(profileData);
      const prompt = `Based ONLY on the confirmed profile information below, write three different short professional introductions (2-4 sentences each) suitable for a resume or job application. Use three different styles from this list: "Dependable and Reliable", "Hands-On Problem Solver", "Customer-Focused Team Member", "Entry-Level and Ready to Learn", "Experienced and Ready to Grow". Only use a style if the profile information clearly supports it. Do NOT invent experience, qualifications, credentials, dates, or abilities not in the profile. Do NOT mention LinkedIn. Each introduction must be self-contained.\n\nProfile information:\n${context || "(No profile data yet — write general entry-level introductions.)"}\n\nReturn a JSON object with a "styles" array where each element has "style" (string) and "text" (string).`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            styles: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  style: { type: "string" },
                  text: { type: "string" },
                },
              },
            },
          },
        },
      });

      const styles = result?.styles || [];
      setExamples(styles.slice(0, 3));
    } catch (err) {
      console.error("Failed to generate examples:", err);
      setExamples([]);
    } finally {
      setLoading(false);
    }
  }

  const handleEdit = (idx) => {
    setEditingIdx(idx);
    setEditText(examples[idx].text);
  };

  const handleSaveEdit = () => {
    setExamples((prev) => prev.map((ex, i) => (i === editingIdx ? { ...ex, text: editText } : ex)));
    setEditingIdx(null);
  };

  return (
    <div className="py-4 space-y-5 animate-fade-in">
      <button onClick={onBack} className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ChevronLeft className="w-5 h-5" />
        Back
      </button>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Show Me Examples</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          These are based on your profile. Pick one to use or edit.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Generating examples...</p>
        </div>
      ) : examples.length === 0 ? (
        <div className="bg-card rounded-2xl border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">We couldn't generate examples right now. Try again or write your own.</p>
          <Button onClick={generateExamples} variant="outline" className="mt-3">
            <RefreshCw className="w-4 h-4 mr-1" />
            Try Again
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {examples.map((ex, idx) => (
            <div key={idx} className="bg-card rounded-2xl border border-border p-4 space-y-3">
              {editingIdx === idx ? (
                <>
                  <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="min-h-[100px]" />
                  <div className="flex gap-2">
                    <Button onClick={handleSaveEdit} size="sm" className="flex-1">
                      <Check className="w-4 h-4 mr-1" />
                      Save Edit
                    </Button>
                    <Button onClick={() => setEditingIdx(null)} variant="ghost" size="sm">
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs font-semibold text-primary uppercase tracking-wide">{ex.style}</p>
                  <p className="text-sm text-foreground leading-relaxed">{ex.text}</p>
                  <div className="flex gap-2 pt-1">
                    <Button onClick={() => onSelect(ex.text)} size="sm" className="flex-1">
                      <Check className="w-4 h-4 mr-1" />
                      Use This
                    </Button>
                    <Button onClick={() => handleEdit(idx)} variant="outline" size="sm">
                      <Pencil className="w-4 h-4" />
                      Edit
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}

          <Button onClick={generateExamples} variant="ghost" className="w-full h-12">
            <RefreshCw className="w-4 h-4 mr-1" />
            Show Another
          </Button>
        </div>
      )}

      <Button onClick={onSkip} variant="ghost" className="w-full h-12">
        Skip for Now
      </Button>
    </div>
  );
}