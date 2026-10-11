import React, { useState, useId } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { PROFILE_SECTIONS } from "@/lib/profileSections";
import { ChevronLeft, ChevronRight, X, Plus, Check } from "lucide-react";

function TagInput({ value = [], onChange, placeholder, id }) {
  const [input, setInput] = useState("");

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput("");
  };

  const removeTag = (tag) => {
    onChange(value.filter((t) => t !== tag));
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          id={id}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder={placeholder}
          className="h-12"
        />
        <Button
          type="button"
          variant="secondary"
          onClick={addTag}
          className="h-12 px-4"
          aria-label="Add"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-sm font-medium"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-destructive"
                aria-label={`Remove ${tag}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function MultiSelect({ value = [], onChange, options, id }) {
  const toggle = (option) => {
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option));
    } else {
      onChange([...value, option]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-labelledby={id}>
      {options.map((option) => {
        const selected = value.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border-2 ${
              selected
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border hover:border-primary/40"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function BooleanField({ value, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`flex items-center gap-3 w-full p-4 rounded-xl border-2 transition-colors text-left ${
        value
          ? "bg-primary/5 border-primary"
          : "bg-card border-border hover:border-primary/40"
      }`}
    >
      <div
        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
          value ? "bg-primary border-primary" : "border-input"
        }`}
      >
        {value && <Check className="w-4 h-4 text-primary-foreground" />}
      </div>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

function FieldRenderer({ field, value, onChange, id }) {
  switch (field.type) {
    case "textarea":
      return (
        <Textarea
          id={id}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="min-h-[120px] text-base"
        />
      );
    case "select":
      return (
        <Select value={value || ""} onValueChange={onChange}>
          <SelectTrigger id={id} className="h-12 text-base">
            <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case "multiselect":
      return <MultiSelect value={value || []} onChange={onChange} options={field.options} id={id} />;
    case "boolean":
      return <BooleanField value={!!value} onChange={onChange} label={field.label} />;
    case "tags":
      return <TagInput value={value || []} onChange={onChange} placeholder={field.placeholder} id={id} />;
    case "number":
      return (
        <Input
          id={id}
          type="number"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
          placeholder={field.placeholder}
          className="h-12 text-base"
        />
      );
    case "date":
      return (
        <Input
          id={id}
          type="date"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 text-base"
        />
      );
    case "email":
      return (
        <Input
          id={id}
          type="email"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || "you@example.com"}
          className="h-12 text-base"
        />
      );
    case "tel":
      return (
        <Input
          id={id}
          type="tel"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || "(555) 123-4567"}
          className="h-12 text-base"
        />
      );
    default:
      return (
        <Input
          id={id}
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="h-12 text-base"
        />
      );
  }
}

export default function GuidedForm({ steps, initialData = {}, onSave, onComplete, onExit, onPrev, onExitProfile, title, sectionId }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [formData, setFormData] = useState({ ...initialData });
  const [saving, setSaving] = useState(false);
  const [direction, setDirection] = useState(1);
  const formId = useId();

  const step = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;
  const progress = ((stepIndex + 1) / steps.length) * 100;

  const sectionIndex = PROFILE_SECTIONS.findIndex((s) => s.id === sectionId);
  const hasSection = sectionIndex !== -1;

  const updateField = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleContinue = async () => {
    if (isLastStep) {
      setSaving(true);
      try {
        await onSave(formData);
        if (onComplete) onComplete();
      } finally {
        setSaving(false);
      }
    } else {
      setDirection(1);
      setStepIndex((i) => i + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    if (stepIndex === 0) {
      if (onPrev) onPrev();
      else if (onExit) onExit();
    } else {
      setDirection(-1);
      setStepIndex((i) => i - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSaveExit = async () => {
    setSaving(true);
    try {
      await onSave(formData);
      if (onExitProfile) onExitProfile();
    } finally {
      setSaving(false);
    }
  };

  const prefersReducedMotion = useReducedMotion();
  const slideVariants = prefersReducedMotion
    ? {
        enter: { opacity: 0 },
        center: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        enter: (dir) => ({ opacity: 0, x: dir > 0 ? 24 : -24 }),
        center: { opacity: 1, x: 0 },
        exit: (dir) => ({ opacity: 0, x: dir > 0 ? -24 : 24 }),
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
        {hasSection && (
          <p className="text-xs text-muted-foreground mt-2">
            Section {sectionIndex + 1} of {PROFILE_SECTIONS.length} · {title}
          </p>
        )}
      </div>

      {/* Question content */}
      <div className="flex-1 py-6 overflow-x-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={stepIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={prefersReducedMotion ? { duration: 0.15 } : { duration: 0.25, ease: "easeOut" }}
          >
            <h1 className="text-2xl font-bold text-foreground mb-2">{step.title}</h1>
            <p className="text-muted-foreground mb-6">{step.subtitle}</p>

            <div className="space-y-5">
              {step.fields.map((field) => {
                const fieldId = `${formId}-${field.name}`;
                return (
                <div key={field.name} className="space-y-2">
                  {field.type !== "boolean" && (
                    <Label
                      id={field.type === "multiselect" ? fieldId : undefined}
                      htmlFor={field.type === "multiselect" ? undefined : fieldId}
                      className="text-base font-medium"
                    >
                      {field.label}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                  )}
                  <FieldRenderer
                    field={field}
                    id={fieldId}
                    value={formData[field.name]}
                    onChange={(val) => updateField(field.name, val)}
                  />
                </div>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
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
        <Button
          variant="ghost"
          onClick={handleSaveExit}
          disabled={saving}
          className="w-full h-12 text-base font-medium"
        >
          Save & Exit
        </Button>
      </div>
    </div>
  );
}