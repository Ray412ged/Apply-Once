import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SectionShell from "@/components/profile/SectionShell";
import { Check, ArrowRight, Plus, Trash2 } from "lucide-react";
import SchoolSearch from "@/components/profile/SchoolSearch";

// Sentinel stored in `education_level_answer` when the user explicitly
// declares they have no education or training to add. This is the only
// value that resolves the section as "resolved"; any real level answer
// counts as information added ("completed").
const NONE_DECLARED = "none_declared";

const EDUCATION_LEVELS = [
  "No High School Diploma or GED",
  "High School Diploma",
  "GED",
  "Some College",
  "Associate Degree",
  "Bachelor's Degree",
  "Master's Degree",
  "Doctorate",
  "Trade School / Apprenticeship",
  "Military Training",
  "Other",
];

const LEVEL_TO_TYPE = {
  "High School Diploma": "High School",
  "GED": "GED",
  "Some College": "Community College",
  "Associate Degree": "Community College",
  "Bachelor's Degree": "College",
  "Master's Degree": "University",
  "Doctorate": "University",
  "Trade School / Apprenticeship": "Trade School",
  "Military Training": "Training Program",
  "Other": "Other",
  "No High School Diploma or GED": "Other",
};

function DetailsForm({ details, setDetails, onSave, onCancel, saving, saveLabel = "Save" }) {
  return (
    <div className="space-y-4 animate-fade-in">
      <p className="text-sm font-medium text-muted-foreground">
        Optional details — these improve your resume but aren't required.
      </p>
      <div className="space-y-3">
        <SchoolSearch
          value={details.institution_name}
          onChange={(name) => setDetails((d) => ({ ...d, institution_name: name }))}
        />
        <div className="space-y-2">
          <Label htmlFor="field-of-study">Field of study</Label>
          <Input
            id="field-of-study"
            value={details.field_of_study}
            onChange={(e) => setDetails((d) => ({ ...d, field_of_study: e.target.value }))}
            placeholder="Example: Nursing, IT, Business"
            className="h-12 text-base"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="grad-year">Graduation or completion year</Label>
          <Input
            id="grad-year"
            value={details.graduation_year}
            onChange={(e) => setDetails((d) => ({ ...d, graduation_year: e.target.value }))}
            placeholder="Example: 2022"
            className="h-12 text-base"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Button onClick={onSave} disabled={saving} className="w-full h-14 text-base font-semibold">
          {saving ? "Saving..." : saveLabel}
        </Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} className="w-full h-12">
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}

export default function EducationSection({
  profile,
  educationRecords = [],
  onSaveProfile,
  onSaveEducation,
  onDelete,
  onExit,
  onPrev,
  onExitProfile,
  title,
  nextSectionLabel,
}) {
  const savedAnswer = profile?.education_level_answer || "";
  // Resolved only when the user explicitly declared "none" AND added no records.
  // If records exist, the section is completed regardless of the stored answer.
  const isResolved = savedAnswer === NONE_DECLARED && educationRecords.length === 0;
  const [stage, setStage] = useState(savedAnswer ? "answered" : "question");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [details, setDetails] = useState({ institution_name: "", graduation_year: "", field_of_study: "" });
  const [showAddDetails, setShowAddDetails] = useState(false);
  const [saving, setSaving] = useState(false);

  // Two-path question: "Add" leads to the level selection flow.
  const handleChooseAdd = () => setStage("level_select");

  // Two-path question: "I do not have education or training to add" resolves
  // the section immediately.
  const handleChooseNone = async () => {
    setSaving(true);
    try {
      await onSaveProfile({ education_level_answer: NONE_DECLARED });
      setStage("answered");
    } finally {
      setSaving(false);
    }
  };

  // Level selection → save level → details question
  const handleSelectLevel = async (level) => {
    setSelectedLevel(level);
    setSaving(true);
    try {
      await onSaveProfile({ education_level_answer: level });
      setStage("details_question");
    } finally {
      setSaving(false);
    }
  };

  const handleDetailsChoice = (choice) => {
    if (choice === "yes") {
      setStage("details_form");
    } else {
      setStage("answered");
    }
  };

  const handleSaveDetails = async () => {
    setSaving(true);
    try {
      const level = selectedLevel || savedAnswer;
      if (details.institution_name) {
        await onSaveEducation({
          education_type: LEVEL_TO_TYPE[level] || "Other",
          degree_or_credential: level,
          institution_name: details.institution_name,
          graduation_year: details.graduation_year || "",
          field_of_study: details.field_of_study || "",
        });
      }
      setDetails({ institution_name: "", graduation_year: "", field_of_study: "" });
      setShowAddDetails(false);
      setStage("answered");
    } finally {
      setSaving(false);
    }
  };

  const handleChangeAnswer = () => {
    setSelectedLevel("");
    setDetails({ institution_name: "", graduation_year: "", field_of_study: "" });
    setShowAddDetails(false);
    setStage("question");
  };

  // --- Two-path question ---
  if (stage === "question") {
    return (
      <SectionShell
        title={title}
        subtitle="Do you have any education or training to add?"
        onPrev={onPrev}
      >
        <div className="space-y-3">
          <button
            onClick={handleChooseAdd}
            className="w-full p-4 rounded-xl border-2 text-left transition-colors bg-card border-border hover:border-primary/40"
          >
            <span className="text-base font-medium">Add Education or Training</span>
          </button>
          <button
            onClick={handleChooseNone}
            disabled={saving}
            className="w-full p-4 rounded-xl border-2 text-left transition-colors disabled:opacity-50 bg-card border-border hover:border-primary/40"
          >
            <span className="text-base font-medium">I do not have education or training to add</span>
          </button>
        </div>
      </SectionShell>
    );
  }

  // --- Level selection ---
  if (stage === "level_select") {
    return (
      <SectionShell
        title={title}
        subtitle="What is your highest level of education?"
        onPrev={onPrev}
      >
        <div className="space-y-3">
          {EDUCATION_LEVELS.map((level) => (
            <button
              key={level}
              onClick={() => handleSelectLevel(level)}
              disabled={saving}
              className="w-full p-4 rounded-xl border-2 text-left transition-colors disabled:opacity-50 bg-card border-border hover:border-primary/40"
            >
              <span className="text-base font-medium">{level}</span>
            </button>
          ))}
        </div>
      </SectionShell>
    );
  }

  // --- "Would you like to add more details?" ---
  if (stage === "details_question") {
    const displayLevel = selectedLevel || savedAnswer;
    return (
      <SectionShell
        title={title}
        subtitle="Would you like to add more details?"
        onPrev={onPrev}
      >
        <div className="space-y-5">
          <div className="bg-accent rounded-xl p-4">
            <p className="text-sm text-muted-foreground">Your highest level of education:</p>
            <p className="font-semibold text-foreground">{displayLevel}</p>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => handleDetailsChoice("yes")}
              className="w-full p-4 rounded-xl border-2 text-left transition-colors bg-card border-border hover:border-primary/40"
            >
              <span className="text-base font-medium">Yes</span>
            </button>
            <button
              onClick={() => handleDetailsChoice("no")}
              className="w-full p-4 rounded-xl border-2 text-left transition-colors bg-card border-border hover:border-primary/40"
            >
              <span className="text-base font-medium">Not Now</span>
            </button>
          </div>
        </div>
      </SectionShell>
    );
  }

  // --- Optional details form ---
  if (stage === "details_form") {
    return (
      <SectionShell title={title} subtitle="Add education details" onPrev={onPrev}>
        <DetailsForm
          details={details}
          setDetails={setDetails}
          onSave={handleSaveDetails}
          onCancel={() => setStage("answered")}
          saving={saving}
          saveLabel="Save details"
        />
      </SectionShell>
    );
  }

  // --- Resolved (none declared) ---
  if (isResolved) {
    return (
      <SectionShell
        title={title}
        onPrev={onPrev}
        footer={
          <Button onClick={onExit} className="w-full h-14 text-base font-semibold">
            Continue to {nextSectionLabel || "Next Section"}
            <ArrowRight className="w-5 h-5 ml-1" />
          </Button>
        }
      >
        <div className="space-y-5">
          <div className="bg-success/10 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
              <Check className="w-6 h-6 text-success" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Your answer:</p>
              <p className="font-heading font-semibold text-foreground">
                I do not have education or training to add
              </p>
            </div>
          </div>
          <button onClick={handleChangeAnswer} className="text-sm text-primary font-medium hover:underline">
            Change my answer
          </button>
        </div>
      </SectionShell>
    );
  }

  // --- Answered (completed) ---
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
        </>
      }
    >
      <div className="space-y-5">
        <div className="bg-success/10 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
            <Check className="w-6 h-6 text-success" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Your highest level of education:</p>
            <p className="font-heading font-semibold text-foreground">
              {savedAnswer === NONE_DECLARED ? "Education added" : savedAnswer}
            </p>
          </div>
        </div>

        {educationRecords.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Education details:</p>
            {educationRecords.map((record) => (
              <div key={record.id} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-semibold text-foreground truncate">
                    {record.institution_name || record.degree_or_credential || "Untitled"}
                  </p>
                  {record.graduation_year && (
                    <p className="text-sm text-muted-foreground truncate mt-0.5">
                      Graduated: {record.graduation_year}
                    </p>
                  )}
                  {record.field_of_study && (
                    <p className="text-sm text-muted-foreground truncate mt-0.5">
                      Field: {record.field_of_study}
                    </p>
                  )}
                </div>
                <button onClick={() => onDelete(record.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive" aria-label="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {!showAddDetails && (
          <Button variant="outline" onClick={() => setShowAddDetails(true)} className="w-full h-12">
            <Plus className="w-5 h-5 mr-1" />
            Add education details
          </Button>
        )}

        {showAddDetails && (
          <DetailsForm
            details={details}
            setDetails={setDetails}
            onSave={handleSaveDetails}
            onCancel={() => setShowAddDetails(false)}
            saving={saving}
            saveLabel="Save details"
          />
        )}

        <button onClick={handleChangeAnswer} className="text-sm text-primary font-medium hover:underline">
          Change my answer
        </button>
      </div>
    </SectionShell>
  );
}