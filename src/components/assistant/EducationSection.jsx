import React from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, CheckCircle2, AlertCircle } from "lucide-react";
import AssistantSection from "./AssistantSection";
import CopyButton from "./CopyButton";

function isConfirmed(record) {
  return ["User Confirmed", "User Entered", "Document Extracted"].includes(record.verified_status);
}

function EducationEntry({ edu }) {
  const location = [edu.city, edu.state].filter(Boolean).join(", ");
  const confirmed = isConfirmed(edu);
  const gradDate = edu.graduation_date
    ? new Date(edu.graduation_date).toLocaleDateString()
    : edu.graduation_year;
  const statusText = edu.completed ? "Completed" : "In Progress";

  const fullText = [
    `School: ${edu.institution_name}`,
    edu.degree_or_credential && `Degree: ${edu.degree_or_credential}`,
    edu.field_of_study && `Field: ${edu.field_of_study}`,
    location && `Location: ${location}`,
    gradDate && `${edu.completed ? "Completed" : "Expected"}: ${gradDate}`,
    `Status: ${statusText}`,
  ].filter(Boolean).join("\n");

  return (
    <div className="border border-border rounded-xl p-3 space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-medium text-foreground text-sm truncate">{edu.institution_name}</p>
            {confirmed ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-success flex-shrink-0" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-warning flex-shrink-0" />
            )}
          </div>
          {edu.degree_or_credential && (
            <p className="text-sm text-muted-foreground">{edu.degree_or_credential}</p>
          )}
        </div>
        <CopyButton text={fullText} label="Use Education" />
      </div>
      {(edu.field_of_study || location || gradDate) && (
        <p className="text-xs text-muted-foreground">
          {[edu.field_of_study, location, gradDate, statusText].filter(Boolean).join(" · ")}
        </p>
      )}
      <div className="flex gap-1 pt-1 flex-wrap">
        {edu.degree_or_credential && <CopyButton text={edu.degree_or_credential} label="Use Degree" />}
        {edu.field_of_study && <CopyButton text={edu.field_of_study} label="Use Field" />}
        {gradDate && <CopyButton text={gradDate} label="Use Date" />}
      </div>
    </div>
  );
}

export default function EducationSection({ education, status }) {
  const navigate = useNavigate();

  return (
    <AssistantSection
      title="Education"
      icon={GraduationCap}
      status={status}
      onEdit={() => navigate("/profile")}
    >
      {education.length > 0 ? (
        <div className="space-y-2">
          {education.map((edu) => (
            <EducationEntry key={edu.id} edu={edu} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground py-2">
          No education records saved yet.{" "}
          <button onClick={() => navigate("/profile")} className="text-primary hover:underline">
            Add education
          </button>
        </p>
      )}
    </AssistantSection>
  );
}