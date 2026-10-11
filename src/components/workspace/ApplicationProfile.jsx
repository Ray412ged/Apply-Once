import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone } from "lucide-react";
import PersonalInfoSection from "@/components/assistant/PersonalInfoSection";
import EmploymentHistorySection from "@/components/assistant/EmploymentHistorySection";
import EducationSection from "@/components/assistant/EducationSection";
import SkillsSection from "@/components/assistant/SkillsSection";
import CredentialsSection from "@/components/assistant/CredentialsSection";
import ReferencesSection from "@/components/assistant/ReferencesSection";
import ResumeSection from "@/components/assistant/ResumeSection";
import JobDetailsSection from "@/components/assistant/JobDetailsSection";
import WorkspaceCoverLetter from "@/components/workspace/WorkspaceCoverLetter";

/**
 * The applicant's profile information for this application: personal info,
 * employment, education, skills, credentials, references, resume, cover
 * letter, freeform notes, and the job details / application instructions.
 *
 * Notes are owned by the parent (they feed the auto-save and the
 * "Mark as Submitted" action) and arrive as controlled props. Profile data
 * is shared and also arrives as props — no duplicate profile fetch here.
 * Section status badges are derived from the canonical readiness result and
 * passed in as `sectionStatuses` (readiness.sections).
 */
export default function ApplicationProfile({
  profile,
  employment,
  education,
  skills,
  credentials,
  references,
  resumeDocs,
  job,
  profileData,
  sectionStatuses,
  notes,
  onNotesChange,
  openNextCounter,
}) {
  return (
    <>
      <PersonalInfoSection profile={profile} status={sectionStatuses.personal} forceOpen={openNextCounter} />
      <div id="employment-section">
        <EmploymentHistorySection employment={employment} status={sectionStatuses.employment} />
      </div>
      <EducationSection education={education} status={sectionStatuses.education} />
      <SkillsSection skills={skills} status={sectionStatuses.skills} />
      <CredentialsSection credentials={credentials} status={sectionStatuses.credentials} />
      <ReferencesSection references={references} status={sectionStatuses.references} />

      <ResumeSection documents={resumeDocs} status={sectionStatuses.resume} />
      <WorkspaceCoverLetter job={job} profileData={profileData} />

      <div className="bg-card rounded-2xl border border-border p-5">
        <h2 className="font-bold text-foreground mb-3">Notes</h2>
        <Textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Add any notes about this application..."
          className="min-h-[80px] text-sm"
        />
      </div>

      <JobDetailsSection job={job} />

      {job.local_job && job.application_instructions && (
        <div id="application-instructions" className="bg-primary/5 rounded-2xl border border-primary/20 p-5">
          <h2 className="font-bold text-foreground mb-3">Application Instructions</h2>
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{job.application_instructions}</p>
          {job.application_email && (
            <a href={`mailto:${job.application_email}`} className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline mt-3">
              <Mail className="w-4 h-4" />
              {job.application_email}
            </a>
          )}
          {job.application_phone && (
            <a href={`tel:${job.application_phone}`} className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline mt-2">
              <Phone className="w-4 h-4" />
              {job.application_phone}
            </a>
          )}
        </div>
      )}
    </>
  );
}