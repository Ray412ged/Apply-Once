import React from "react";
import { AlertTriangle, CheckCircle2, AlertCircle, Circle } from "lucide-react";
import AssistantSection from "./AssistantSection";

const LABELS = {
  personal: "Personal Information",
  employment: "Employment History",
  education: "Education",
  skills: "Skills",
  credentials: "Credentials",
  references: "References",
  resume: "Resume",
  coverLetter: "Cover Letter",
  reusableAnswers: "Reusable Answers",
};

const STATUS_CONFIG = {
  ready: { icon: CheckCircle2, color: "text-success", label: "Ready" },
  needs_review: { icon: AlertCircle, color: "text-warning", label: "Needs Review" },
  missing: { icon: Circle, color: "text-muted-foreground", label: "Missing" },
};

function StatusRow({ label, status }) {
  const { icon: Icon, color, label: statusLabel } = STATUS_CONFIG[status] || STATUS_CONFIG.missing;
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-sm text-foreground">{label}</span>
      </div>
      <span className={`text-xs font-medium ${color}`}>{statusLabel}</span>
    </div>
  );
}

export default function MissingInfoSection({ sections }) {
  return (
    <AssistantSection
      title="Application Readiness Details"
      icon={AlertTriangle}
      defaultOpen
    >
      <div>
        {Object.entries(sections).map(([key, status]) => (
          <StatusRow key={key} label={LABELS[key] || key} status={status} />
        ))}
      </div>
    </AssistantSection>
  );
}