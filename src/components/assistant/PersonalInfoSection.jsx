import React from "react";
import { useNavigate } from "react-router-dom";
import { User, CheckCircle2 } from "lucide-react";
import AssistantSection from "./AssistantSection";
import CopyButton from "./CopyButton";

function FieldRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-2 py-1.5 border-b border-border last:border-0">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground truncate">{value}</p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <CheckCircle2 className="w-3.5 h-3.5 text-success" />
        <CopyButton text={value} />
      </div>
    </div>
  );
}

export default function PersonalInfoSection({ profile, status, forceOpen }) {
  const navigate = useNavigate();

  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ");
  const fullNameWithMiddle = [profile?.first_name, profile?.middle_name, profile?.last_name]
    .filter(Boolean).join(" ");

  return (
    <AssistantSection
      title="Professional Introduction"
      icon={User}
      defaultOpen={false}
      forceOpen={forceOpen}
      status={status}
      onEdit={() => navigate("/profile")}
    >
      {fullName ? (
        <div className="space-y-0">
          <FieldRow label="Full Name" value={fullNameWithMiddle || fullName} />
          {profile?.preferred_name && profile.preferred_name !== fullName && (
            <FieldRow label="Preferred Name" value={profile.preferred_name} />
          )}
          <FieldRow label="Email" value={profile?.email} />
          <FieldRow label="Phone" value={profile?.phone} />
          <FieldRow
            label="Location"
            value={[profile?.city, profile?.state, profile?.postal_code].filter(Boolean).join(", ")}
          />
          {profile?.professional_summary && (
            <div className="pt-2">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-xs text-muted-foreground">Professional Summary</p>
                <CopyButton text={profile.professional_summary} label="Use Summary" />
              </div>
              <p className="text-sm text-foreground">{profile.professional_summary}</p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground py-2">
          No profile information saved yet.{" "}
          <button onClick={() => navigate("/profile")} className="text-primary hover:underline">
            Add your information
          </button>
        </p>
      )}
    </AssistantSection>
  );
}