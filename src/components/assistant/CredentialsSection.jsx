import React from "react";
import { useNavigate } from "react-router-dom";
import { Award, CheckCircle2, AlertCircle } from "lucide-react";
import AssistantSection from "./AssistantSection";
import CopyButton from "./CopyButton";

function isConfirmed(record) {
  return ["User Confirmed", "User Entered", "Document Extracted"].includes(record.verified_status);
}

function CredentialEntry({ cred }) {
  const confirmed = isConfirmed(cred);
  const fullText = [
    `Credential: ${cred.credential_name}`,
    cred.issuing_organization && `Issued by: ${cred.issuing_organization}`,
    cred.issue_date && `Issued: ${new Date(cred.issue_date).toLocaleDateString()}`,
    cred.expiration_date && `Expires: ${new Date(cred.expiration_date).toLocaleDateString()}`,
    `Status: ${cred.active_status ? "Active" : "Inactive"}`,
  ].filter(Boolean).join("\n");

  return (
    <div className="border border-border rounded-xl p-3 space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-medium text-foreground text-sm truncate">{cred.credential_name}</p>
            {confirmed ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-success flex-shrink-0" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-warning flex-shrink-0" />
            )}
          </div>
          {cred.issuing_organization && (
            <p className="text-sm text-muted-foreground">{cred.issuing_organization}</p>
          )}
        </div>
        <CopyButton text={fullText} label="Use" />
      </div>
      <p className="text-xs text-muted-foreground">
        {[
          cred.credential_type,
          cred.issue_date && `Issued ${new Date(cred.issue_date).toLocaleDateString()}`,
          cred.expiration_date && `Expires ${new Date(cred.expiration_date).toLocaleDateString()}`,
          cred.active_status ? "Active" : "Inactive",
        ].filter(Boolean).join(" · ")}
      </p>
    </div>
  );
}

export default function CredentialsSection({ credentials, status }) {
  const navigate = useNavigate();
  return (
    <AssistantSection
      title="Credentials"
      icon={Award}
      status={status}
      onEdit={() => navigate("/profile")}
    >
      {credentials.length > 0 ? (
        <div className="space-y-2">
          {credentials.map((cred) => (
            <CredentialEntry key={cred.id} cred={cred} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground py-2">
          No credentials saved.{" "}
          <button onClick={() => navigate("/profile")} className="text-primary hover:underline">
            Add credentials
          </button>
        </p>
      )}
    </AssistantSection>
  );
}