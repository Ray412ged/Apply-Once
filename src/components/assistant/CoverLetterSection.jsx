import React from "react";
import { useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";
import AssistantSection from "./AssistantSection";
import CopyButton from "./CopyButton";

export default function CoverLetterSection({ documents, status }) {
  const navigate = useNavigate();
  const coverLetter = documents[0];

  return (
    <AssistantSection
      title="Cover Letter"
      icon={Mail}
      status={status}
      onEdit={() => navigate("/profile")}
    >
      {coverLetter ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium text-foreground text-sm truncate">{coverLetter.document_name}</p>
              <p className="text-xs text-muted-foreground">
                Uploaded {coverLetter.upload_date ? new Date(coverLetter.upload_date).toLocaleDateString() : ""}
              </p>
            </div>
          </div>
          {coverLetter.user_notes && (
            <CopyButton text={coverLetter.user_notes} label="Use Cover Letter" />
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground py-2">
          <button onClick={() => navigate("/profile")} className="text-primary hover:underline">
            Add a cover letter
          </button>
        </p>
      )}
    </AssistantSection>
  );
}