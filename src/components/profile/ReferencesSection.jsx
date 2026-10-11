import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import SectionShell from "@/components/profile/SectionShell";
import GuidedForm from "@/components/GuidedForm";
import { SECTION_MAP } from "@/lib/profileSections";
import { Check, Plus, ArrowRight, Pencil, Trash2 } from "lucide-react";

const OPTIONS = [
  { value: "yes", label: "Add a reference" },
  { value: "dont_have", label: "I do not have references to add" },
];

export default function ReferencesSection({
  profile,
  references = [],
  onSaveProfile,
  onSaveRecord,
  onDelete,
  onExit,
  onPrev,
  onExitProfile,
  title,
  nextSectionLabel,
}) {
  const savedAnswer = profile?.references_status || "";
  const hasReferences = references.length > 0;
  // "later" is no longer a valid resolution — treat it as unaddressed so the
  // user is re-prompted to either add records or declare none.
  const isStaleLater = savedAnswer === "later";
  // Treat the section as "yes" whenever references exist, so that added
  // records clear any stale "no"/"don't have" answer and keep the
  // confirmation banner consistent with the displayed list.
  const effectiveAnswer = hasReferences ? "yes" : (isStaleLater ? "" : savedAnswer);
  const [stage, setStage] = useState(effectiveAnswer ? "answered" : "question");
  const [editingRecord, setEditingRecord] = useState(null);
  const [saving, setSaving] = useState(false);

  // Auto-correct the stored status when references exist but the saved
  // answer is not "yes" — keeps the banner and list always in sync.
  useEffect(() => {
    if (hasReferences && savedAnswer !== "yes") {
      onSaveProfile({ references_status: "yes" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasReferences, savedAnswer]);

  const handleAnswer = async (value) => {
    setSaving(true);
    try {
      await onSaveProfile({ references_status: value });
      setStage("answered");
    } finally {
      setSaving(false);
    }
  };

  // --- Editing/adding mode ---
  if (editingRecord !== null) {
    const isEditing = editingRecord !== "new";
    return (
      <GuidedForm
        steps={SECTION_MAP.references?.steps || []}
        initialData={isEditing ? editingRecord : {}}
        onSave={async (formData) => {
          if (isEditing) {
            await onSaveRecord({ ...formData, id: editingRecord.id });
          } else {
            await onSaveRecord(formData);
          }
          setEditingRecord(null);
        }}
        onExit={() => setEditingRecord(null)}
        onExitProfile={onExitProfile}
        title={title}
        sectionId="references"
      />
    );
  }

  // --- Question view ---
  if (stage === "question") {
    return (
      <SectionShell
        title={title}
        subtitle="Would you like to add professional references?"
        onPrev={onPrev}

      >
        <div className="space-y-3">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleAnswer(opt.value)}
              disabled={saving}
              className="w-full p-4 rounded-xl border-2 text-left transition-colors disabled:opacity-50 bg-card border-border hover:border-primary/40"
            >
              <span className="text-base font-medium">{opt.label}</span>
            </button>
          ))}
        </div>
      </SectionShell>
    );
  }

  // --- Answered "later" or "dont_have" ---
  if (effectiveAnswer !== "yes") {
    const answerLabel = OPTIONS.find((o) => o.value === savedAnswer)?.label || savedAnswer;
    return (
      <SectionShell
        title={title}
        onPrev={onPrev}
        footer={
          <>
            <Button onClick={onExit} className="w-full h-14 text-base font-semibold">
              Continue to {nextSectionLabel || "Next Section"}
              <ArrowRight className="w-5 h-5 ml-1" />
            </Button>
            <Button variant="ghost" onClick={onExitProfile} className="w-full h-12 text-base font-medium">
              Return to My Profile
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="bg-success/10 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
              <Check className="w-6 h-6 text-success" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Your answer:</p>
              <p className="font-heading font-semibold text-foreground">{answerLabel}</p>
            </div>
          </div>

          {references.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Saved references:</p>
              {references.map((record) => (
                <div key={record.id} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-semibold text-foreground truncate">
                      {record.full_name || "Untitled"}
                    </p>
                    {record.relationship && (
                      <p className="text-sm text-muted-foreground truncate mt-0.5">{record.relationship}</p>
                    )}
                  </div>
                  <button onClick={() => onDelete(record.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive" aria-label="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button onClick={() => setStage("question")} className="text-sm text-primary font-medium hover:underline">
            Change my answer
          </button>
        </div>
      </SectionShell>
    );
  }

  // --- Answered "yes" — list view ---
  const canContinueYes = references.length > 0;
  return (
    <SectionShell
      title={title}
      onPrev={onPrev}
      footer={
        <>
          <Button onClick={() => setEditingRecord("new")} variant="outline" className="w-full h-12">
            <Plus className="w-5 h-5 mr-1" />
            Add a reference
          </Button>
          {canContinueYes ? (
            <Button onClick={onExit} className="w-full h-14 text-base font-semibold">
              Continue to {nextSectionLabel || "Next Section"}
              <ArrowRight className="w-5 h-5 ml-1" />
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground text-center px-1">
              Add at least one reference, or choose “I do not have references to add.”
            </p>
          )}
        </>
      }
    >
      <div className="space-y-5">
        <div className="bg-success/10 rounded-2xl p-4 flex items-center gap-3">
          <Check className="w-5 h-5 text-success flex-shrink-0" />
          <p className="text-sm text-muted-foreground">
            Add your references below. Always ask permission before listing someone.
          </p>
        </div>

        {references.length > 0 ? (
          <div className="space-y-3">
            {references.map((record) => (
              <div key={record.id} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0" onClick={() => setEditingRecord(record)}>
                  <p className="font-heading font-semibold text-foreground truncate">
                    {record.full_name || "Untitled"}
                  </p>
                  {record.relationship && (
                    <p className="text-sm text-muted-foreground truncate mt-0.5">{record.relationship}</p>
                  )}
                </div>
                <button onClick={() => setEditingRecord(record)} className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground" aria-label="Edit">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => onDelete(record.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive" aria-label="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-dashed border-border p-8 text-center">
            <p className="text-muted-foreground text-sm">No references added yet.</p>
          </div>
        )}

        <button onClick={() => setStage("question")} className="text-sm text-primary font-medium hover:underline">
          Change my answer
        </button>
      </div>
    </SectionShell>
  );
}