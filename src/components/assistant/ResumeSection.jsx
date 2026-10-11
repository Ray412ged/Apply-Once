import React from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Download } from "lucide-react";
import AssistantSection from "./AssistantSection";
import CopyButton from "./CopyButton";

export default function ResumeSection({ documents, status }) {
  const navigate = useNavigate();
  const resume = documents[0];

  return (
    <AssistantSection
      title="Resume"
      icon={FileText}
      status={status}
      onEdit={() => navigate("/profile")}
    >
      {resume ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium text-foreground text-sm truncate">{resume.document_name}</p>
              <p className="text-xs text-muted-foreground">
                Uploaded {resume.upload_date ? new Date(resume.upload_date).toLocaleDateString() : ""}
              </p>
            </div>
            {resume.file_url && (
              <a
                href={resume.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline text-sm flex items-center gap-1 flex-shrink-0"
              >
                <Download className="w-4 h-4" /> Download
              </a>
            )}
          </div>
          {resume.user_notes && <CopyButton text={resume.user_notes} label="Use Resume Summary" />}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground py-2">
          <button onClick={() => navigate("/profile")} className="text-primary hover:underline">
            Upload a resume
          </button>
        </p>
      )}
    </AssistantSection>
  );
}