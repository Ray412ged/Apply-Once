import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { isGuest, addGuestRecord } from "@/lib/guestStorage";
import {
  Loader2,
  Sparkles,
  Check,
  AlertTriangle,
  Star,
  Clock,
  RotateCw,
  Search,
  Plus,
  Save,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import AssistantSection from "./AssistantSection";
import ApplicationCompanion from "./ApplicationCompanion";

const STOP_WORDS = new Set([
  "the", "a", "an", "to", "and", "or", "in", "on", "at", "for", "of", "with",
  "is", "are", "was", "were", "be", "been", "have", "has", "had", "do", "does",
  "did", "will", "would", "could", "should", "you", "your", "i", "me", "my",
  "we", "our", "it", "this", "that", "about", "how", "why", "what", "when",
  "where", "who", "can", "tell", "describe", "give", "us", "example", "if",
  "as", "by", "from", "not", "they", "their", "he", "she", "his", "her",
]);

const QUESTION_TYPES = [
  "General", "Motivation", "Strengths", "Weaknesses", "Availability",
  "Leadership", "Conflict", "Customer Service", "Safety", "Career Goals",
  "Problem Solving", "Teamwork", "Background", "Experience", "Education",
];

function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

function findSimilar(question, answers) {
  const qTokens = tokenize(question);
  if (qTokens.length === 0) return [];

  const qSet = new Set(qTokens);

  return answers
    .map((a) => {
      const aTokens = tokenize(a.question);
      const aSet = new Set(aTokens);
      const intersection = [...qSet].filter((w) => aSet.has(w)).length;
      const union = new Set([...qSet, ...aSet]).size;
      const score = union === 0 ? 0 : intersection / union;
      return { answer: a, score, overlap: intersection, matchedWords: [...qSet].filter((w) => aSet.has(w)) };
    })
    .filter((r) => r.score >= 0.2 || r.overlap >= 2)
    .sort((a, b) => {
      // Favorites first, then by times_used, then by score
      if (a.answer.favorite !== b.answer.favorite) return a.answer.favorite ? -1 : 1;
      const aUsed = a.answer.times_used || 0;
      const bUsed = b.answer.times_used || 0;
      if (aUsed !== bUsed) return bUsed - aUsed;
      return b.score - a.score;
    });
}

function buildContext(profile, employment, education, skills, job) {
  const lines = [];

  lines.push("JOB DETAILS:");
  lines.push(`- Job Title: ${job.job_title}`);
  lines.push(`- Employer: ${job.employer_name}`);
  if (job.industry) lines.push(`- Industry: ${job.industry}`);
  if (job.full_description) lines.push(`- Job Description: ${job.full_description}`);
  if (job.minimum_qualifications) lines.push(`- Minimum Qualifications: ${job.minimum_qualifications}`);

  lines.push("\nAPPLICANT PROFILE:");
  if (profile) {
    lines.push(`- Professional Summary: ${profile.professional_summary || "Not provided"}`);
    lines.push(`- Location: ${[profile.city, profile.state].filter(Boolean).join(", ") || "Not provided"}`);
    if (profile.strength_statement) lines.push(`- Strengths: ${profile.strength_statement}`);
  }

  if (employment.length > 0) {
    lines.push("\nEMPLOYMENT HISTORY:");
    employment.forEach((emp, i) => {
      lines.push(`${i + 1}. ${emp.job_title} at ${emp.employer_name}`);
      if (emp.duties) lines.push(`   Duties: ${emp.duties}`);
      const start = [emp.start_month, emp.start_year].filter(Boolean).join(" ");
      const end = emp.currently_employed ? "Present" : [emp.end_month, emp.end_year].filter(Boolean).join(" ");
      if (start || end) lines.push(`   Dates: ${start || "?"} - ${end}`);
    });
  } else {
    lines.push("\nEMPLOYMENT HISTORY: None provided");
  }

  if (education.length > 0) {
    lines.push("\nEDUCATION:");
    education.forEach((edu, i) => {
      lines.push(`${i + 1}. ${edu.institution_name}`);
      if (edu.degree_or_credential) lines.push(`   Degree: ${edu.degree_or_credential}`);
      if (edu.field_of_study) lines.push(`   Field: ${edu.field_of_study}`);
      if (edu.graduation_year) lines.push(`   Graduated: ${edu.graduation_year}`);
    });
  }

  if (skills.length > 0) {
    lines.push("\nSKILLS:");
    lines.push(skills.map((s) => s.skill_name).join(", "));
  }

  return lines.join("\n");
}

function loadCompanion(jobId) {
  try {
    const saved = sessionStorage.getItem(`workspace_companion_${jobId}`);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return { questions: [], currentStep: 0, copiedIds: [], lastCopiedId: null };
}

function saveCompanion(jobId, companion) {
  sessionStorage.setItem(`workspace_companion_${jobId}`, JSON.stringify(companion));
}

function SuggestionCard({ match, onCopy, copiedId, onAddToCompanion }) {
  const { answer, matchedWords } = match;
  const isCopied = copiedId === answer.id;

  const isPreviouslyUsed = (answer.times_used || 0) > 0;
  const isFavorite = answer.favorite;
  const isMostRecent = false; // will be flagged by parent for top recent

  return (
    <div className="border border-border rounded-xl p-3 space-y-1.5">
      <div className="flex items-center gap-1.5 flex-wrap mb-1">
        {isFavorite && (
          <span className="inline-flex items-center gap-1 text-xs bg-warning/10 text-warning rounded-full px-2 py-0.5 font-medium">
            <Star className="w-3 h-3 fill-warning" />
            Favorite
          </span>
        )}
        {isPreviouslyUsed && (
          <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5 font-medium">
            <RotateCw className="w-3 h-3" />
            Previously Used{answer.times_used > 1 ? ` (${answer.times_used}×)` : ""}
          </span>
        )}
        {answer.question_type && (
          <span className="text-xs bg-accent text-accent-foreground rounded-full px-2 py-0.5">
            {answer.question_type}
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{answer.question}</p>
      <p className="text-sm text-foreground whitespace-pre-wrap">{answer.answer}</p>
      <div className="flex gap-2 mt-1.5">
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={() => onCopy(answer.answer, answer.id)}
        >
          {isCopied ? <Check className="w-3.5 h-3.5 text-success" /> : <Sparkles className="w-3.5 h-3.5" />}
          {isCopied ? "Copied" : "Use"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8"
          onClick={() => onAddToCompanion(answer.question, answer.answer, "saved", answer.id)}
        >
          <Plus className="w-3.5 h-3.5" />
          Add to Companion
        </Button>
      </div>
    </div>
  );
}

export default function QuestionGeneratorSection({ profile, employment, education, skills, job, reusableAnswers, onAnswerSaved }) {
  const [question, setQuestion] = useState("");
  const [view, setView] = useState("idle"); // idle | suggestions | generating | draft
  const [suggestions, setSuggestions] = useState([]);
  const [draft, setDraft] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [companion, setCompanion] = useState(() => loadCompanion(job?.id));
  const [showReturnBanner, setShowReturnBanner] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveAnswer, setSaveAnswer] = useState("");
  const [saveType, setSaveType] = useState("General");
  const [savingAnswer, setSavingAnswer] = useState(false);
  const companionRef = useRef(companion);
  companionRef.current = companion;
  const questionInputRef = useRef(null);

  // Reload companion state when job changes
  useEffect(() => {
    setCompanion(loadCompanion(job.id));
  }, [job.id]);

  // Show return banner when page becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && companionRef.current.questions.length > 0) {
        setShowReturnBanner(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const updateCompanion = (updater) => {
    setCompanion((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveCompanion(job.id, next);
      return next;
    });
  };

  const addToCompanion = (q, ans, source, savedAnswerId = null) => {
    if (!q || !ans) return;
    const exists = companion.questions.some(
      (item) => item.question === q && item.answer === ans
    );
    if (exists) return;
    const id = `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    updateCompanion((prev) => ({
      ...prev,
      questions: [...prev.questions, { id, question: q, answer: ans, source, savedAnswerId }],
      currentStep: prev.questions.length,
    }));
    setQuestion("");
    setView("idle");
    setSuggestions([]);
    setDraft("");
  };

  const handleEditAnswer = (id, newAnswer) => {
    updateCompanion((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => (q.id === id ? { ...q, answer: newAnswer } : q)),
    }));
  };

  const handleNext = () => {
    updateCompanion((prev) => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, prev.questions.length - 1),
    }));
  };

  const handlePrev = () => {
    updateCompanion((prev) => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 0),
    }));
  };

  const handleJumpTo = (index) => {
    updateCompanion((prev) => ({ ...prev, currentStep: index }));
  };

  const handleCompanionCopySuccess = (id) => {
    updateCompanion((prev) => ({
      ...prev,
      copiedIds: prev.copiedIds.includes(id) ? prev.copiedIds : [...prev.copiedIds, id],
      lastCopiedId: id,
    }));
  };

  const handleAddMore = () => {
    questionInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => questionInputRef.current?.focus(), 300);
  };

  const handleSearch = () => {
    if (!question.trim()) return;
    const matches = findSimilar(question, reusableAnswers);
    if (matches.length > 0) {
      setSuggestions(matches);
      setView("suggestions");
    } else {
      generateNew();
    }
  };

  const handleCopy = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const generateNew = async () => {
    if (!question.trim()) return;
    setView("generating");
    setDraft("");
    try {
      const context = buildContext(profile, employment, education, skills, job);
      const prompt = `${context}

QUESTION TO ANSWER:
${question}

IMPORTANT RULES:
- Use ONLY the information provided above.
- NEVER invent experience, jobs, education, or skills that are not listed above.
- Write a natural, authentic answer in first person as the applicant.
- Keep it concise (3-5 sentences).
- If the question asks about experience the applicant doesn't have, be honest and focus on transferable skills.
- Do not start with meta-language like "Based on the information provided" — just write the answer directly.

Write the answer:`;

      const result = await base44.integrations.Core.InvokeLLM({ prompt });
      setDraft(typeof result === "string" ? result : String(result));
      setView("draft");
    } catch (err) {
      console.error("Failed to generate answer:", err);
      setDraft("Sorry, something went wrong while generating the draft. Please try again.");
      setView("draft");
    }
  };

  const handleSaveAnswer = async () => {
    const q = question.trim();
    const a = saveAnswer.trim();
    if (!q || !a) return;
    setSavingAnswer(true);
    try {
      const payload = {
        question: q,
        answer: a,
        question_type: saveType,
        employer: job?.employer_name || "",
        industry: job?.industry || "",
        ai_generated: true,
        user_confirmed: false,
      };
      if (isGuest()) {
        addGuestRecord("ReusableAnswer", payload);
      } else {
        await base44.entities.ReusableAnswer.create(payload);
      }
      setShowSaveForm(false);
      onAnswerSaved?.();
    } catch (err) {
      console.error("Failed to save reusable answer:", err);
    } finally {
      setSavingAnswer(false);
    }
  };

  return (
    <AssistantSection title="Answer a Question" icon={Sparkles} defaultOpen>
      <div className="space-y-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">
            Paste an employer question. We'll check your saved answers first, then generate a draft if needed.
          </p>
          <Textarea
            ref={questionInputRef}
            value={question}
            onChange={(e) => {
              setQuestion(e.target.value);
              if (view !== "idle") setView("idle");
            }}
            placeholder="e.g. Why do you want to work for Franjo Construction?"
            rows={2}
            className="resize-none"
          />
        </div>

        <Button
          onClick={handleSearch}
          disabled={view === "generating" || !question.trim()}
          className="w-full"
        >
          {view === "generating" ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating draft...
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Generate Answer
            </>
          )}
        </Button>

        {/* Suggestions from saved answers */}
        {view === "suggestions" && suggestions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-foreground">
              <Search className="w-3.5 h-3.5" />
              {suggestions.length} similar {suggestions.length === 1 ? "answer" : "answers"} found
            </div>
            {suggestions.map((match) => (
              <SuggestionCard
                key={match.answer.id}
                match={match}
                onCopy={handleCopy}
                copiedId={copiedId}
                onAddToCompanion={addToCompanion}
              />
            ))}
            <Button
              variant="outline"
              className="w-full"
              onClick={generateNew}
            >
              <Sparkles className="w-4 h-4" />
              Generate New Instead
            </Button>
          </div>
        )}

        {/* AI-generated draft */}
        {view === "draft" && (
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-xs text-warning bg-warning/5 rounded-lg p-2.5 border border-warning/20">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <p>
                AI draft — please review before using. Based only on your saved profile
                and experience. Nothing was invented. Not saved.
              </p>
            </div>
            <div className="border border-border rounded-xl p-3 bg-accent/30">
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{draft}</p>
            </div>
            <Button
              className="w-full"
              onClick={() => handleCopy(draft, "draft")}
            >
              {copiedId === "draft" ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              {copiedId === "draft" ? "Copied to clipboard" : "Use Draft"}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => addToCompanion(question, draft, "generated")}
            >
              <Plus className="w-4 h-4" />
              Add to Companion
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setSaveAnswer(draft);
                setSaveType("General");
                setShowSaveForm(true);
              }}
            >
              <Save className="w-4 h-4" />
              Save to Reusable Answers
            </Button>

            {showSaveForm && (
              <div className="space-y-2 border border-border rounded-xl p-3 bg-card">
                <p className="text-xs font-medium text-foreground">
                  Save this answer for future applications
                </p>
                <Textarea
                  value={saveAnswer}
                  onChange={(e) => setSaveAnswer(e.target.value)}
                  rows={4}
                  className="resize-none"
                  placeholder="Edit the answer before saving"
                />
                <Select value={saveType} onValueChange={setSaveType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {QUESTION_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    disabled={savingAnswer || !saveAnswer.trim()}
                    onClick={handleSaveAnswer}
                  >
                    {savingAnswer ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowSaveForm(false)}
                    disabled={savingAnswer}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Application Companion — guided one-answer-at-a-time flow */}
        {companion.questions.length > 0 && (
          <ApplicationCompanion
            questions={companion.questions}
            currentStep={companion.currentStep}
            copiedIds={companion.copiedIds}
            lastCopiedId={companion.lastCopiedId}
            showReturnBanner={showReturnBanner}
            jobUrl={job.application_url || job.posting_url}
            employerName={job.employer_name}
            onCopySuccess={handleCompanionCopySuccess}
            onEditAnswer={handleEditAnswer}
            onNext={handleNext}
            onPrev={handlePrev}
            onJumpTo={handleJumpTo}
            onDismissReturnBanner={() => setShowReturnBanner(false)}
            onAddMore={handleAddMore}
          />
        )}
      </div>
    </AssistantSection>
  );
}