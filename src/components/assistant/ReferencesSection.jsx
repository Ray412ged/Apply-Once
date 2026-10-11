import React from "react";
import { useNavigate } from "react-router-dom";
import { Users, Shield } from "lucide-react";
import AssistantSection from "./AssistantSection";
import CopyButton from "./CopyButton";

function ReferenceEntry({ ref: refRecord }) {
  const fullText = [
    `Name: ${refRecord.full_name}`,
    refRecord.relationship && `Relationship: ${refRecord.relationship}`,
    refRecord.organization && `Organization: ${refRecord.organization}`,
    refRecord.job_title && `Title: ${refRecord.job_title}`,
    refRecord.phone && `Phone: ${refRecord.phone}`,
    refRecord.email && `Email: ${refRecord.email}`,
    refRecord.years_known && `Years known: ${refRecord.years_known}`,
  ].filter(Boolean).join("\n");

  return (
    <div className="border border-border rounded-xl p-3 space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-foreground text-sm truncate">{refRecord.full_name}</p>
          {refRecord.relationship && (
            <p className="text-sm text-muted-foreground">{refRecord.relationship}</p>
          )}
        </div>
        <CopyButton text={fullText} label="Use" />
      </div>
      <p className="text-xs text-muted-foreground">
        {[refRecord.organization, refRecord.job_title, refRecord.phone, refRecord.email]
          .filter(Boolean)
          .join(" · ")}
      </p>
    </div>
  );
}

export default function ReferencesSection({ references, status }) {
  const navigate = useNavigate();
  return (
    <AssistantSection
      title="References"
      icon={Users}
      status={status}
      onEdit={() => navigate("/profile")}
    >
      {references.length > 0 ? (
        <>
          <div className="space-y-2">
            {references.map((ref) => (
              <ReferenceEntry key={ref.id} ref={ref} />
            ))}
          </div>
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-accent/50 rounded-lg p-2">
            <Shield className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <p>Only share a reference after confirming that the person has agreed to be contacted.</p>
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground py-2">
          <button onClick={() => navigate("/profile")} className="text-primary hover:underline">
            Add a reference
          </button>
        </p>
      )}
    </AssistantSection>
  );
}