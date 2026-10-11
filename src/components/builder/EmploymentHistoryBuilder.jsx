import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { isGuest, isLocalProfile, addGuestRecord, saveGuestSingle } from "@/lib/guestStorage";
import { setProfileEntryMethod } from "@/lib/profileEntryMethod";
import { useProfileData } from "@/hooks/useProfileData";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Check, Plus, Loader2, MapPin, Briefcase, Calendar, ListChecks, PencilLine } from "lucide-react";
import EmployerSearch from "@/components/builder/EmployerSearch";
import JobTitleSelector from "@/components/builder/JobTitleSelector";
import EmploymentTimeline, { validateEmploymentDates } from "@/components/builder/EmploymentTimeline";
import ResponsibilitySelector from "@/components/builder/ResponsibilitySelector";
import BuilderEndScreen from "@/components/builder/BuilderEndScreen";

const TOTAL_STEPS = 6;
const EMPTY_FORM = {
  employer_name: "",
  google_place_id: "",
  street_address: "",
  city: "",
  state: "",
  postal_code: "",
  employer_type: "",
  job_title: "",
  start_month: "",
  start_year: "",
  currently_employed: false,
  end_month: "",
  end_year: "",
  responsibilities_selected: [],
  responsibilities_custom: [],
  additional_notes: "",
  experience_type: "Regular paid job",
  verified_status: "User Entered",
};

const BUILDER_STORAGE_KEY = "applyonce_builder_draft";

function buildLocationBias(profile) {
  if (!profile) return null;
  const parts = [profile.city, profile.state].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

export default function EmploymentHistoryBuilder({
  initialRecord = null,
  onSaveRecord = null,
  onSaved = null,
  onExit = null,
  hideAddAnother = false,
}) {
  const navigate = useNavigate();
  const guest = isLocalProfile();
  const embedded = onSaveRecord !== null;
  const { data: profileData } = useProfileData();
  const locationBias = buildLocationBias(profileData?.profile);

  const [step, setStep] = useState(() => {
    if (embedded) return 1;
    try {
      const saved = JSON.parse(sessionStorage.getItem(BUILDER_STORAGE_KEY) || "{}");
      return saved.step || 1;
    } catch { return 1; }
  });
  const [formData, setFormData] = useState(() => {
    if (initialRecord) return { ...EMPTY_FORM, ...initialRecord };
    if (embedded) return { ...EMPTY_FORM };
    try {
      const saved = JSON.parse(sessionStorage.getItem(BUILDER_STORAGE_KEY) || "{}");
      return saved.formData || { ...EMPTY_FORM };
    } catch { return { ...EMPTY_FORM }; }
  });
  const [savedCount, setSavedCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showEndScreen, setShowEndScreen] = useState(false);
  const [direction, setDirection] = useState(1);
  const [showNoteInput, setShowNoteInput] = useState(() => !!initialRecord?.additional_notes);

  // Persist form state so a refresh mid-flow doesn't lose progress (onboarding only)
  useEffect(() => {
    if (embedded) return;
    try {
      sessionStorage.setItem(BUILDER_STORAGE_KEY, JSON.stringify({ step, formData }));
    } catch {
      // sessionStorage may be unavailable
    }
  }, [step, formData, embedded]);

  const prefersReducedMotion = useReducedMotion();

  const updateField = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const updateEmployer = (employerData) => {
    setFormData((prev) => ({
      ...prev,
      employer_name: employerData.employer_name || prev.employer_name,
      google_place_id: employerData.google_place_id ?? prev.google_place_id,
      street_address: employerData.street_address ?? prev.street_address,
      city: employerData.city ?? prev.city,
      state: employerData.state ?? prev.state,
      postal_code: employerData.postal_code ?? prev.postal_code,
      employer_type: employerData.employer_type ?? prev.employer_type,
    }));
  };

  const canContinue = () => {
    switch (step) {
      case 1:
        return !!formData.employer_name?.trim();
      case 2:
        return !!formData.job_title?.trim();
      case 3:
        return !!formData.start_year?.trim() && validateEmploymentDates(formData).valid;
      default:
        return true;
    }
  };

  const handleContinue = () => {
    if (step < TOTAL_STEPS) {
      setDirection(1);
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    if (embedded && step === 1) {
      onExit?.();
      return;
    }
    if (step === 1) {
      navigate("/onboarding");
    } else {
      setDirection(-1);
      setStep((s) => s - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const resetForm = () => {
    setFormData({ ...EMPTY_FORM });
    setShowNoteInput(false);
    setDirection(-1);
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSave = async (addAnother) => {
    setSaving(true);
    try {
      if (embedded) {
        await onSaveRecord(formData);
        if (addAnother) {
          resetForm();
        } else {
          onSaved?.();
        }
      } else {
        const record = { ...formData };
        if (guest) {
          addGuestRecord("EmploymentRecord", record);
        } else {
          await base44.entities.EmploymentRecord.create(record);
        }
        setProfileEntryMethod("manual");
        setSavedCount((c) => c + 1);
        try { sessionStorage.removeItem(BUILDER_STORAGE_KEY); } catch {}

        if (addAnother) {
          resetForm();
        } else {
          setShowEndScreen(true);
        }
      }
    } catch (err) {
      console.error("Failed to save employment record:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDone = async () => {
    // After the onboarding builder, continue to the next section in the
    // guided flow (Skills) rather than dumping the user at the Profile
    // overview or Home. This keeps onboarding a single continuous journey.
    if (guest) {
      saveGuestSingle("UserProfile", { onboarding_status: "in_progress" });
    } else {
      try {
        const profiles = await base44.entities.UserProfile.filter({}, "-created_date", 1);
        if (profiles.length > 0) {
          await base44.entities.UserProfile.update(profiles[0].id, {
            onboarding_status: "in_progress",
          });
        }
      } catch (err) {
        // Non-critical — continue to next section
      }
    }
    navigate("/profile/edit?section=skills");
  };

  if (showEndScreen) {
    return (
      <BuilderEndScreen
        savedCount={savedCount}
        onContinue={handleDone}
        onAddAnother={() => { setShowEndScreen(false); resetForm(); }}
        nextSectionLabel="Skills"
      />
    );
  }

  const progress = (step / TOTAL_STEPS) * 100;

  const slideVariants = prefersReducedMotion
    ? { enter: { opacity: 0 }, center: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        enter: (dir) => ({ opacity: 0, x: dir > 0 ? 24 : -24 }),
        center: { opacity: 1, x: 0 },
        exit: (dir) => ({ opacity: 0, x: dir > 0 ? -24 : 24 }),
      };

  const isStep5Notes = step === 5 && !showNoteInput;

  const stepContent = {
    1: {
      title: "Where did you work?",
      subtitle: "Search for the business or organization you worked for most recently.",
      icon: MapPin,
      render: () => <EmployerSearch value={formData} onChange={updateEmployer} locationBias={locationBias} />,
    },
    2: {
      title: "What was your role?",
      subtitle: `What was your job title at ${formData.employer_name || "this employer"}?`,
      icon: Briefcase,
      render: () => (
        <JobTitleSelector
          value={formData.job_title}
          onChange={(v) => updateField("job_title", v)}
          employerName={formData.employer_name}
          employerType={formData.employer_type}
        />
      ),
    },
    3: {
      title: "When did you work there?",
      subtitle: "Don't worry about exact dates — approximate is fine.",
      icon: Calendar,
      render: () => <EmploymentTimeline value={formData} onChange={(data) => setFormData((prev) => ({ ...prev, ...data }))} />,
    },
    4: {
      title: "What did you do?",
      subtitle: `Select the tasks you performed as ${formData.job_title || "an employee"}. Don't check things you didn't do.`,
      icon: ListChecks,
      render: () => <ResponsibilitySelector value={formData} onChange={(data) => setFormData((prev) => ({ ...prev, ...data }))} jobTitle={formData.job_title} />,
    },
    5: {
      title: "Anything else?",
      subtitle: "Is there anything else you'd like employers to know about this job? This is optional.",
      icon: ListChecks,
      render: () =>
        showNoteInput ? (
          <div className="space-y-2">
            <Label htmlFor="additional-notes">Additional notes</Label>
            <Textarea
              id="additional-notes"
              value={formData.additional_notes}
              onChange={(e) => updateField("additional_notes", e.target.value)}
              placeholder="Example: Received employee of the month, trained new hires, managed a team of 5..."
              className="min-h-[140px] text-base"
            />
          </div>
        ) : (
          <Button
            onClick={() => setShowNoteInput(true)}
            variant="outline"
            className="w-full h-14 text-base font-semibold"
          >
            <PencilLine className="w-5 h-5 mr-1" />
            Add a note
          </Button>
        ),
    },
    6: {
      title: "Review and save",
      subtitle: "Here's what we'll save. You can edit anything later from your profile.",
      icon: Check,
      render: () => (
        <div className="space-y-4">
          <div className="bg-card rounded-xl border border-border p-4 space-y-3">
            <ReviewRow label="Employer" value={formData.employer_name} />
            <ReviewRow label="Job title" value={formData.job_title} />
            <ReviewRow
              label="Dates"
              value={[
                [formData.start_month, formData.start_year].filter(Boolean).join(" "),
                formData.currently_employed
                  ? "Present"
                  : [formData.end_month, formData.end_year].filter(Boolean).join(" "),
              ].filter(Boolean).join(" – ")}
            />
            {(formData.street_address || formData.city || formData.state || formData.postal_code) && (
              <ReviewRow
                label="Location"
                value={[
                  formData.street_address,
                  [formData.city, formData.state].filter(Boolean).join(", "),
                  formData.postal_code,
                ].filter(Boolean).join(", ")}
              />
            )}
            {(formData.responsibilities_selected?.length > 0 || formData.responsibilities_custom?.length > 0) && (
              <ReviewRow
                label="Responsibilities"
                value={`${(formData.responsibilities_selected?.length || 0) + (formData.responsibilities_custom?.length || 0)} tasks selected`}
              />
            )}
            {formData.additional_notes && (
              <ReviewRow label="Notes" value={formData.additional_notes} />
            )}
          </div>
        </div>
      ),
    },
  };

  const current = stepContent[step];
  const StepIcon = current.icon;

  return (
    <div className={`${embedded ? "min-h-[60vh]" : "min-h-screen"} flex flex-col max-w-md mx-auto px-4`}>
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
          <span className="text-sm text-muted-foreground">Step {step} of {TOTAL_STEPS}</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 py-6 overflow-x-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={prefersReducedMotion ? { duration: 0.15 } : { duration: 0.25, ease: "easeOut" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <StepIcon className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-xl font-bold text-foreground">{current.title}</h1>
            </div>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">{current.subtitle}</p>
            {current.render()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Action bar */}
      <div className="sticky bottom-0 bg-background py-3 border-t border-border safe-bottom -mx-4 px-4">
        {isStep5Notes ? (
          <Button
            onClick={handleContinue}
            variant="ghost"
            className="w-full h-14 text-base font-semibold"
          >
            Skip
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        ) : step < TOTAL_STEPS ? (
          <Button
            onClick={handleContinue}
            disabled={!canContinue()}
            className="w-full h-14 text-base font-semibold"
          >
            Continue
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        ) : (
          <div className="space-y-2">
            {!hideAddAnother && (
              <Button
                onClick={() => handleSave(true)}
                disabled={saving}
                variant="outline"
                className="w-full h-12 font-semibold"
              >
                {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Plus className="w-5 h-5 mr-1" />}
                Save & Add Another
              </Button>
            )}
            <Button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="w-full h-14 text-base font-semibold"
            >
              {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Check className="w-5 h-5 mr-1" />}
              {embedded ? "Save Changes" : "Save & Finish"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-3">
      <span className="text-sm text-muted-foreground flex-shrink-0">{label}</span>
      <span className="text-sm font-medium text-foreground text-right">{value}</span>
    </div>
  );
}