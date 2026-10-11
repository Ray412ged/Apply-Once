import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import WorkCategoriesStep from "@/components/jobgoals/WorkCategoriesStep";
import OccupationStep from "@/components/jobgoals/OccupationStep";
import SuggestionsStep from "@/components/jobgoals/SuggestionsStep";
import StartDateStep from "@/components/jobgoals/StartDateStep";
import ButtonSelectStep from "@/components/jobgoals/ButtonSelectStep";

export default function JobGoals({
  initialData = {},
  employmentRecords = [],
  onSave,
  onPrev,
  onExitProfile,
  title,
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [data, setData] = useState({ ...initialData });
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 2500);
  };

  const hasEmployment = employmentRecords.length > 0;

  const steps = useMemo(() => {
    const allSteps = [
      {
        id: "categories",
        title: "What kind of work interests you?",
        subtitle: "Choose one or more areas that sound interesting. You can always change these later.",
      },
      {
        id: "occupations",
        title: "Which jobs sound interesting?",
        subtitle: "Select occupations from your chosen categories. You can also add your own.",
      },
    ];
    if (hasEmployment) {
      allSteps.push({
        id: "suggestions",
        title: "Based on your experience, you might also like:",
        subtitle: "These are suggestions based on your work history. Tap to add any that interest you.",
      });
    }
    allSteps.push(
      {
        id: "experience",
        title: "How much experience do you have in these fields?",
        subtitle: "This helps us match you with the right opportunities.",
      },
      {
        id: "start_date",
        title: "When could you start?",
        subtitle: "Let employers know your availability.",
      },
      {
        id: "pay",
        title: "What pay are you hoping for?",
        subtitle: "This helps us find jobs that meet your needs.",
      }
    );
    return allSteps;
  }, [hasEmployment]);

  const step = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;
  const progress = ((stepIndex + 1) / steps.length) * 100;

  const updateField = (name, value) => {
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleContinue = async () => {
    if (isLastStep) {
      setSaving(true);
      try {
        await onSave(data);
      } finally {
        setSaving(false);
      }
    } else {
      setStepIndex((i) => i + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    if (stepIndex === 0) {
      onPrev?.();
    } else {
      setStepIndex((i) => i - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const renderStep = () => {
    switch (step.id) {
      case "categories":
        return (
          <WorkCategoriesStep
            value={data.work_categories || []}
            onChange={(val) => updateField("work_categories", val)}
          />
        );
      case "occupations":
        return (
          <OccupationStep
            value={data.desired_job_titles || []}
            onChange={(val) => updateField("desired_job_titles", val)}
            categories={data.work_categories || []}
          />
        );
      case "suggestions":
        return (
          <SuggestionsStep
            employmentRecords={employmentRecords}
            selectedOccupations={data.desired_job_titles || []}
            onAdd={(occ) => {
              updateField("desired_job_titles", [...(data.desired_job_titles || []), occ]);
              showSuccess("Job interests updated.");
            }}
          />
        );
      case "experience":
        return (
          <ButtonSelectStep
            value={data.experience_level}
            onChange={(val) => updateField("experience_level", val)}
            options={["No experience", "Less than 1 year", "1–3 years", "3–5 years", "5–10 years", "10+ years"]}
          />
        );
      case "start_date":
        return (
          <StartDateStep
            value={data.earliest_start_date}
            onChange={(val) => updateField("earliest_start_date", val)}
          />
        );
      case "pay":
        return (
          <ButtonSelectStep
            value={data.pay_preference}
            onChange={(val) => updateField("pay_preference", val)}
            options={[
              "Under $15/hour",
              "$15–20/hour",
              "$20–25/hour",
              "$25–30/hour",
              "$30–40/hour",
              "$40+/hour",
              "I'm flexible for the right opportunity",
            ]}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Progress bar */}
      <div className="sticky top-0 z-10 bg-background pt-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
          <span className="text-sm text-muted-foreground">
            Step {stepIndex + 1} of {steps.length}
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 py-6">
        {successMessage && (
          <div className="bg-success/10 rounded-xl p-3 text-center mb-4 animate-fade-in" role="status" aria-live="polite">
            <Check className="w-5 h-5 text-success inline mr-1.5 -mt-0.5" />
            <span className="text-sm font-medium text-success">{successMessage}</span>
          </div>
        )}
        <h1 className="text-2xl font-bold text-foreground mb-2">{step.title}</h1>
        <p className="text-muted-foreground mb-6">{step.subtitle}</p>
        {renderStep()}
      </div>

      {/* Action buttons */}
      <div className="sticky bottom-16 bg-background py-3 space-y-2 -mx-4 px-4 border-t border-border">
        <Button
          onClick={handleContinue}
          disabled={saving}
          className="w-full h-14 text-base font-semibold"
        >
          {saving ? "Saving..." : isLastStep ? "Save and Continue" : "Continue"}
          {!saving && <ChevronRight className="w-5 h-5 ml-1" />}
        </Button>
        {onExitProfile && (
          <button
            onClick={onExitProfile}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground py-1"
          >
            Return to My Profile
          </button>
        )}
      </div>
    </div>
  );
}