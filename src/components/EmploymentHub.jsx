import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import GuidedForm from "@/components/GuidedForm";
import EmploymentHistoryBuilder from "@/components/builder/EmploymentHistoryBuilder";
import { base44 } from "@/api/base44Client";
import { setProfileEntryMethod } from "@/lib/profileEntryMethod";
import {
  ChevronLeft,
  Plus,
  Trash2,
  Pencil,
  Upload,
  Check,
  Loader2,
  ArrowRight,
  AlertCircle,
  Briefcase,
  GraduationCap,
  Award,
  Wrench,
  CheckCheck,
} from "lucide-react";
import ExtractedItemCard from "@/components/ExtractedItemCard";
import { logCredentialEvent, setCredentialSource, setCredentialOrigin } from "@/lib/credentialDebugLog";
import CredentialDebugPanel from "@/components/debug/CredentialDebugPanel";
import { isDiagnosticDebugEnabled } from "@/lib/debugMode";

const EXPERIENCE_TYPES = [
  "Regular paid job",
  "Temporary or day labor",
  "Self-employment",
  "Side jobs",
  "Volunteer work",
  "Caregiving",
  "Work while incarcerated",
  "School or training projects",
  "Community service",
  "No experience yet",
];

export default function EmploymentHub({
  records = [],
  onSave,
  onSaveEducation,
  onSaveCredential,
  onSaveSkill,
  educationSteps,
  credentialSteps,
  savedEducationCount = 0,
  onDelete,
  onExitNext,
  onPrev,
  title,
  nextSectionLabel,
  profileEntryMethod,
}) {
  const [mode, setMode] = useState("intro"); // "intro" | "list" | "form" | "saved" | "upload" | "no_experience"
  const [editingRecord, setEditingRecord] = useState(null);
  const [selectedExperienceType, setSelectedExperienceType] = useState(null);
  const [extractedJobs, setExtractedJobs] = useState([]);
  const [extractedEducation, setExtractedEducation] = useState([]);
  const [extractedCredentials, setExtractedCredentials] = useState([]);
  const [extractedSkills, setExtractedSkills] = useState([]);
  const [confirmedSkills, setConfirmedSkills] = useState([]);
  const [educationSkipped, setEducationSkipped] = useState(false);
  const [formType, setFormType] = useState("employment");
  const [returnToReview, setReturnToReview] = useState(false);
  const [confirmedEducation, setConfirmedEducation] = useState([]);
  const [confirmedJobs, setConfirmedJobs] = useState([]);
  const [confirmedCredentials, setConfirmedCredentials] = useState([]);
  const [editingConfirmedEduIdx, setEditingConfirmedEduIdx] = useState(null);
  const [editingConfirmedJobIdx, setEditingConfirmedJobIdx] = useState(null);
  const [editingConfirmedCredIdx, setEditingConfirmedCredIdx] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const confirmingRef = useRef(false);
  const [confirmingKey, setConfirmingKey] = useState(null);
  const [acceptingAll, setAcceptingAll] = useState(false);
  const [savedType, setSavedType] = useState(null);

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  // ---- Intro mode ----
  if (mode === "intro") {
    return (
      <div className="py-6 space-y-5 animate-fade-in">
        <button
          onClick={onPrev}
          className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>

        <div>
          <h1 className="text-2xl font-bold text-foreground">Employment History</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {records.length > 0
              ? "Review your work history or add a new role."
              : profileEntryMethod === "manual"
              ? "Add your work history manually."
              : "Choose how you'd like to get started."}
          </p>
        </div>

        <div className="space-y-3">
          {records.length > 0 && (
            <button
              onClick={() => setMode("list")}
              className="w-full bg-card rounded-2xl border-2 border-primary/30 p-5 text-left hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Review Employment History ({records.length})</p>
                  <p className="text-sm text-muted-foreground">You have saved experience. Add more or continue.</p>
                </div>
              </div>
            </button>
          )}

          {records.length === 0 && profileEntryMethod !== "manual" && (
            <button
              onClick={() => { setProfileEntryMethod("resume_import"); setMode("upload"); }}
              className="w-full bg-card rounded-2xl border-2 border-border p-5 text-left hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Upload My Resume</p>
                  <p className="text-sm text-muted-foreground">Upload a resume and we'll use it to help complete your profile.</p>
                </div>
              </div>
            </button>
          )}

          {records.length === 0 && (
            <button
              onClick={() => {
                setProfileEntryMethod("manual");
                setEditingRecord(null);
                setMode("form");
              }}
              className="w-full bg-card rounded-2xl border-2 border-border p-5 text-left hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Pencil className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Build My Profile Step by Step</p>
                  <p className="text-sm text-muted-foreground">Enter your information once and use it across applications.</p>
                </div>
              </div>
            </button>
          )}

          <button
            onClick={() => { setProfileEntryMethod("manual"); setMode("no_experience"); }}
            className="w-full bg-card rounded-2xl border border-border p-5 text-left hover:border-primary/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">I have not had a formal job yet</p>
                <p className="text-sm text-muted-foreground">Tell us about other types of experience.</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // ---- No experience mode: choose experience type ----
  if (mode === "no_experience") {
    return (
      <div className="py-6 space-y-5 animate-fade-in">
        <button
          onClick={() => setMode("intro")}
          className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>

        <div>
          <h1 className="text-2xl font-bold text-foreground">What kind of experience do you have?</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Experience comes in many forms. Choose what applies to you.
          </p>
        </div>

        <div className="space-y-2.5">
          {EXPERIENCE_TYPES.filter((t) => t !== "No experience yet").map((type) => (
            <button
              key={type}
              onClick={() => {
                setSelectedExperienceType(type);
                setEditingRecord(null);
                setMode("form");
              }}
              className="w-full text-left p-3.5 rounded-xl text-sm font-medium border-2 border-border bg-card text-foreground hover:border-primary/40 transition-colors"
            >
              {type}
            </button>
          ))}
        </div>

        <Button variant="ghost" onClick={() => setMode("intro")} className="w-full h-12">
          Back
        </Button>
      </div>
    );
  }

  // ---- Upload mode ----
  if (mode === "upload") {
    return (
      <UploadResumeFlow
        onBack={() => setMode(records.length > 0 ? "list" : "intro")}
        onDataExtracted={({ employment, education, credentials, skills }) => {
          setExtractedJobs(employment);
          setExtractedEducation(education);
          setExtractedSkills(skills);
          setConfirmedEducation([]);
          setConfirmedJobs([]);
          setConfirmedCredentials([]);
          setConfirmedSkills([]);
          setEditingConfirmedEduIdx(null);
          setEditingConfirmedJobIdx(null);
          setEditingConfirmedCredIdx(null);
          setExtractedCredentials(credentials);
          setEducationSkipped(false);
          setMode("review_all");
        }}
      />
    );
  }

  // ---- Review all extracted items ----
  if (mode === "review_all") {
    const allReviewed = extractedJobs.length === 0 && extractedEducation.length === 0 && extractedCredentials.length === 0 && extractedSkills.length === 0;

    return (
      <div className="py-6 space-y-6 animate-fade-in">
        <button
          onClick={() => setMode(records.length > 0 ? "list" : "intro")}
          className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>

        <div>
          <h1 className="text-2xl font-bold text-foreground">Review your resume</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            We found the following information. Please review each item.
          </p>
        </div>

        {successMessage && (
          <div className="bg-success/10 rounded-xl p-3 text-center animate-fade-in">
            <Check className="w-5 h-5 text-success inline mr-1.5 -mt-0.5" />
            <span className="text-sm font-medium text-success">{successMessage}</span>
          </div>
        )}

        {/* Accept All */}
        {(extractedJobs.length > 0 || extractedEducation.length > 0 || extractedCredentials.length > 0 || extractedSkills.length > 0) && (
          <Button
            disabled={acceptingAll}
            onClick={async () => {
              if (acceptingAll) return;
              setAcceptingAll(true);
              setCredentialSource("EmploymentHub.jsx", "AcceptAll");
              setCredentialOrigin("Accept All");
              try {
              for (const job of extractedJobs) {
                const saved = await onSave({
                  employer_name: job.employer_name || "",
                  job_title: job.job_title || "",
                  duties: job.duties || "",
                  experience_type: "Regular paid job",
                  verified_status: "Document Extracted",
                });
                setConfirmedJobs((prev) => [...prev, { ...job, savedId: saved?.id }]);
              }
              for (const edu of extractedEducation) {
                const saved = await onSaveEducation({
                  institution_name: edu.institution_name || "",
                  degree_or_credential: edu.degree_or_credential || "",
                  field_of_study: edu.field_of_study || "",
                  graduation_year: edu.graduation_year || "",
                  verified_status: "Document Extracted",
                });
                setConfirmedEducation((prev) => [...prev, { ...edu, savedId: saved?.id }]);
              }
              for (const cred of extractedCredentials) {
                setCredentialOrigin("Accept All");
                console.log(`[CRED-DEBUG] ${new Date().toISOString()} — AcceptAll onSaveCredential CALL name="${cred.credential_name}" issuer="${cred.issuing_organization}"`);
                logCredentialEvent({ eventName: "onSaveCredential() called", credentialName: cred.credential_name || "", details: "source=AcceptAll" });
                const saved = await onSaveCredential({
                  credential_name: cred.credential_name || "",
                  issuing_organization: cred.issuing_organization || "",
                  credential_type: cred.credential_type || "Other",
                  verified_status: "Document Extracted",
                });
                console.log(`[CRED-DEBUG] ${new Date().toISOString()} — AcceptAll onSaveCredential RETURN name="${cred.credential_name}" savedId="${saved?.id || 'none'}"`);
                logCredentialEvent({ eventName: "onSaveCredential() returned", credentialName: cred.credential_name || "", recordId: saved?.id || "", details: "source=AcceptAll" });
                setConfirmedCredentials((prev) => [...prev, { ...cred, savedId: saved?.id }]);
              }
              for (const skill of extractedSkills) {
                const saved = await onSaveSkill({
                  skill_name: skill.skill_name || "",
                  skill_category: skill.skill_category || "Other",
                  source: "Document Extracted",
                  confirmed_by_user: false,
                });
                setConfirmedSkills((prev) => [...prev, { ...skill, savedId: saved?.id }]);
              }
              setExtractedJobs([]);
              setExtractedEducation([]);
              setExtractedCredentials([]);
              setExtractedSkills([]);
              showSuccess("All items added to your profile.");
              } finally {
                setAcceptingAll(false);
              }
            }}
            className="w-full h-12 font-semibold"
          >
            {acceptingAll ? <Loader2 className="w-5 h-5 mr-1 animate-spin" /> : <CheckCheck className="w-5 h-5 mr-1" />}
            {acceptingAll ? "Saving..." : `Accept All (${extractedJobs.length + extractedEducation.length + extractedCredentials.length + extractedSkills.length})`}
          </Button>
        )}

        {/* Employment History */}
        <div className="space-y-3">
          <h2 className="font-heading font-semibold text-foreground flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            Employment History
          </h2>
          {confirmedJobs.map((job, idx) => (
            <ExtractedItemCard
              key={`confirmed-job-${idx}`}
              state="confirmed"
              icon={Briefcase}
              title={job.job_title || "Unknown title"}
              subtitle={job.employer_name || "Unknown employer"}
              details={job.duties}
              onEdit={() => {
                setEditingRecord({
                  id: job.savedId,
                  employer_name: job.employer_name || "",
                  job_title: job.job_title || "",
                  duties: job.duties || "",
                  experience_type: "Regular paid job",
                });
                setFormType("employment");
                setReturnToReview(true);
                setEditingConfirmedJobIdx(idx);
                setMode("form");
              }}
            />
          ))}
          {extractedJobs.length > 0 ? (
            extractedJobs.map((job, idx) => (
              <ExtractedItemCard
                key={`job-${idx}`}
                icon={Briefcase}
                title={job.job_title || "Unknown title"}
                subtitle={job.employer_name || "Unknown employer"}
                details={job.duties}
                confirming={confirmingKey === `job-${idx}`}
                onConfirm={async () => {
                  if (confirmingRef.current) return;
                  confirmingRef.current = true;
                  setConfirmingKey(`job-${idx}`);
                  try {
                    const saved = await onSave({
                      employer_name: job.employer_name || "",
                      job_title: job.job_title || "",
                      duties: job.duties || "",
                      experience_type: "Regular paid job",
                      verified_status: "Document Extracted",
                    });
                    setConfirmedJobs([...confirmedJobs, { ...job, savedId: saved?.id }]);
                    setExtractedJobs(extractedJobs.filter((_, i) => i !== idx));
                    showSuccess("Employment added to your profile.");
                  } finally {
                    confirmingRef.current = false;
                    setConfirmingKey(null);
                  }
                }}
                onEdit={() => {
                  setEditingRecord({
                    employer_name: job.employer_name || "",
                    job_title: job.job_title || "",
                    duties: job.duties || "",
                    experience_type: "Regular paid job",
                  });
                  setFormType("employment");
                  setReturnToReview(true);
                  setExtractedJobs(extractedJobs.filter((_, i) => i !== idx));
                  setMode("form");
                }}
                onRemove={() => setExtractedJobs(extractedJobs.filter((_, i) => i !== idx))}
              />
            ))
          ) : confirmedJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No employment history found on your resume.</p>
          ) : null}
        </div>

        {/* Education */}
        <div className="space-y-3">
          <h2 className="font-heading font-semibold text-foreground flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            Education
          </h2>

          {/* Confirmed education items */}
          {confirmedEducation.length > 0 && extractedEducation.length === 0 && (
            <div className="bg-success/10 rounded-xl p-3 text-center">
              <Check className="w-5 h-5 text-success inline mr-1.5 -mt-0.5" />
              <span className="text-sm font-medium text-success">Education added to your profile.</span>
            </div>
          )}
          {confirmedEducation.map((edu, idx) => (
            <ExtractedItemCard
              key={`confirmed-edu-${idx}`}
              state="confirmed"
              icon={GraduationCap}
              title={edu.institution_name || "Unknown institution"}
              subtitle={[edu.degree_or_credential, edu.field_of_study].filter(Boolean).join(" • ") || undefined}
              details={edu.graduation_year ? `Graduated: ${edu.graduation_year}` : undefined}
              onEdit={() => {
                setEditingRecord({
                  id: edu.savedId,
                  institution_name: edu.institution_name || "",
                  degree_or_credential: edu.degree_or_credential || "",
                  field_of_study: edu.field_of_study || "",
                  graduation_year: edu.graduation_year || "",
                });
                setFormType("education");
                setReturnToReview(true);
                setEditingConfirmedEduIdx(idx);
                setMode("form");
              }}
            />
          ))}

          {/* Pending extracted education items */}
          {extractedEducation.length > 0 ? (
            extractedEducation.map((edu, idx) => (
              <ExtractedItemCard
                key={`edu-${idx}`}
                icon={GraduationCap}
                title={edu.institution_name || "Unknown institution"}
                subtitle={[edu.degree_or_credential, edu.field_of_study].filter(Boolean).join(" • ") || undefined}
                details={edu.graduation_year ? `Graduated: ${edu.graduation_year}` : undefined}
                confirming={confirmingKey === `edu-${idx}`}
                onConfirm={async () => {
                  if (confirmingRef.current) return;
                  confirmingRef.current = true;
                  setConfirmingKey(`edu-${idx}`);
                  try {
                    const saved = await onSaveEducation({
                      institution_name: edu.institution_name || "",
                      degree_or_credential: edu.degree_or_credential || "",
                      field_of_study: edu.field_of_study || "",
                      graduation_year: edu.graduation_year || "",
                      verified_status: "Document Extracted",
                    });
                    setConfirmedEducation([...confirmedEducation, { ...edu, savedId: saved?.id }]);
                    setExtractedEducation(extractedEducation.filter((_, i) => i !== idx));
                  } finally {
                    confirmingRef.current = false;
                    setConfirmingKey(null);
                  }
                }}
                onEdit={() => {
                  setEditingRecord({
                    institution_name: edu.institution_name || "",
                    degree_or_credential: edu.degree_or_credential || "",
                    field_of_study: edu.field_of_study || "",
                    graduation_year: edu.graduation_year || "",
                  });
                  setFormType("education");
                  setReturnToReview(true);
                  setExtractedEducation(extractedEducation.filter((_, i) => i !== idx));
                  setMode("form");
                }}
                onRemove={() => setExtractedEducation(extractedEducation.filter((_, i) => i !== idx))}
              />
            ))
          ) : confirmedEducation.length === 0 && savedEducationCount === 0 && !educationSkipped ? (
            <div className="bg-accent rounded-xl p-4">
              <p className="text-sm text-foreground">
                We couldn't find any education on your resume. Would you like to add it manually?
              </p>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingRecord(null);
                    setFormType("education");
                    setReturnToReview(true);
                    setMode("form");
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Education
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEducationSkipped(true)}>
                  Skip for Now
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Licenses & Certifications */}
        <div className="space-y-3">
          <h2 className="font-heading font-semibold text-foreground flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Licenses & Certifications
          </h2>
          {confirmedCredentials.map((cred, idx) => (
            <ExtractedItemCard
              key={`confirmed-cred-${idx}`}
              state="confirmed"
              icon={Award}
              title={cred.credential_name || "Unknown credential"}
              subtitle={cred.issuing_organization}
              details={cred.credential_type}
              onEdit={() => {
                setEditingRecord({
                  id: cred.savedId,
                  credential_name: cred.credential_name || "",
                  issuing_organization: cred.issuing_organization || "",
                  credential_type: cred.credential_type || "Other",
                });
                setFormType("credential");
                setReturnToReview(true);
                setEditingConfirmedCredIdx(idx);
                setMode("form");
              }}
            />
          ))}
          {extractedCredentials.length > 0 ? (
            extractedCredentials.map((cred, idx) => (
              <ExtractedItemCard
                key={`cred-${idx}`}
                icon={Award}
                title={cred.credential_name || "Unknown credential"}
                subtitle={cred.issuing_organization}
                details={cred.credential_type}
                confirming={confirmingKey === `cred-${idx}`}
                onConfirm={async () => {
                  if (confirmingRef.current) return;
                  confirmingRef.current = true;
                  setConfirmingKey(`cred-${idx}`);
                  setCredentialSource("EmploymentHub.jsx", "individualConfirm");
                  setCredentialOrigin("Individual Accept");
                  try {
                    console.log(`[CRED-DEBUG] ${new Date().toISOString()} — individualConfirm onSaveCredential CALL name="${cred.credential_name}" issuer="${cred.issuing_organization}"`);
                    logCredentialEvent({ eventName: "onSaveCredential() called", credentialName: cred.credential_name || "", details: "source=individualConfirm" });
                    const saved = await onSaveCredential({
                      credential_name: cred.credential_name || "",
                      issuing_organization: cred.issuing_organization || "",
                      credential_type: cred.credential_type || "Other",
                      verified_status: "Document Extracted",
                    });
                    console.log(`[CRED-DEBUG] ${new Date().toISOString()} — individualConfirm onSaveCredential RETURN name="${cred.credential_name}" savedId="${saved?.id || 'none'}"`);
                    logCredentialEvent({ eventName: "onSaveCredential() returned", credentialName: cred.credential_name || "", recordId: saved?.id || "", details: "source=individualConfirm" });
                    setConfirmedCredentials([...confirmedCredentials, { ...cred, savedId: saved?.id }]);
                    setExtractedCredentials(extractedCredentials.filter((_, i) => i !== idx));
                    showSuccess("License added to your profile.");
                  } finally {
                    confirmingRef.current = false;
                    setConfirmingKey(null);
                  }
                }}
                onEdit={() => {
                  setEditingRecord({
                    credential_name: cred.credential_name || "",
                    issuing_organization: cred.issuing_organization || "",
                    credential_type: cred.credential_type || "Other",
                  });
                  setFormType("credential");
                  setReturnToReview(true);
                  setExtractedCredentials(extractedCredentials.filter((_, i) => i !== idx));
                  setMode("form");
                }}
                onRemove={() => setExtractedCredentials(extractedCredentials.filter((_, i) => i !== idx))}
              />
            ))
          ) : confirmedCredentials.length === 0 ? (
            <p className="text-sm text-muted-foreground">No licenses or certifications found on your resume.</p>
          ) : null}
        </div>

        {/* Skills */}
        <div className="space-y-3">
          <h2 className="font-heading font-semibold text-foreground flex items-center gap-2">
            <Wrench className="w-5 h-5 text-primary" />
            Skills
          </h2>
          {confirmedSkills.map((skill, idx) => (
            <ExtractedItemCard
              key={`confirmed-skill-${idx}`}
              state="confirmed"
              icon={Wrench}
              title={skill.skill_name || "Unknown skill"}
            />
          ))}
          {extractedSkills.length > 0 ? (
            extractedSkills.map((skill, idx) => (
              <ExtractedItemCard
                key={`skill-${idx}`}
                icon={Wrench}
                title={skill.skill_name || "Unknown skill"}
                subtitle={skill.skill_category}
                confirming={confirmingKey === `skill-${idx}`}
                onConfirm={async () => {
                  if (confirmingRef.current) return;
                  confirmingRef.current = true;
                  setConfirmingKey(`skill-${idx}`);
                  try {
                    const saved = await onSaveSkill({
                      skill_name: skill.skill_name || "",
                      skill_category: skill.skill_category || "Other",
                      source: "Document Extracted",
                      confirmed_by_user: false,
                    });
                    setConfirmedSkills([...confirmedSkills, { ...skill, savedId: saved?.id }]);
                    setExtractedSkills(extractedSkills.filter((_, i) => i !== idx));
                    showSuccess("Skill added to your profile.");
                  } finally {
                    confirmingRef.current = false;
                    setConfirmingKey(null);
                  }
                }}
                onRemove={() => setExtractedSkills(extractedSkills.filter((_, i) => i !== idx))}
              />
            ))
          ) : confirmedSkills.length === 0 ? (
            <p className="text-sm text-muted-foreground">No skills found on your resume.</p>
          ) : null}
        </div>

        {allReviewed && (
          <div className="bg-success/10 rounded-xl p-4 text-center">
            <Check className="w-8 h-8 text-success mx-auto mb-2" />
            <p className="font-medium text-foreground">All items reviewed!</p>
            <p className="text-sm text-muted-foreground mt-1">Is anything missing? You can add it from the next screen.</p>
          </div>
        )}

        <div className="space-y-2">
          <Button
            onClick={() => setMode("list")}
            className="w-full h-14 text-base font-semibold"
          >
            Continue
            <ArrowRight className="w-5 h-5 ml-1" />
          </Button>
        </div>

        {isDiagnosticDebugEnabled() && <CredentialDebugPanel />}
      </div>
    );
  }

  // ---- Form mode: employment (uses EmploymentHistoryBuilder) ----
  if (mode === "form" && formType === "employment") {
    const initialData = editingRecord ? { ...editingRecord } : {};
    if (selectedExperienceType && !initialData.experience_type) {
      initialData.experience_type = selectedExperienceType;
    }

    return (
      <EmploymentHistoryBuilder
        initialRecord={initialData}
        hideAddAnother={returnToReview}
        onSaveRecord={async (data) => {
          const mergedData = editingRecord ? { ...editingRecord, ...data } : data;
          const saved = await onSave(mergedData);
          setSelectedExperienceType(null);
          if (returnToReview) {
            if (editingConfirmedJobIdx !== null) {
              setConfirmedJobs(confirmedJobs.map((item, i) =>
                i === editingConfirmedJobIdx ? { ...item, ...data, savedId: saved?.id || item.savedId } : item
              ));
              setEditingConfirmedJobIdx(null);
            } else {
              setConfirmedJobs([...confirmedJobs, { ...data, savedId: saved?.id }]);
            }
          }
          return saved;
        }}
        onSaved={() => {
          setSelectedExperienceType(null);
          if (returnToReview) {
            setReturnToReview(false);
            setMode("review_all");
          } else {
            setSavedType("employment");
            setMode("saved");
          }
        }}
        onExit={() => {
          setSelectedExperienceType(null);
          if (returnToReview) {
            setReturnToReview(false);
            setMode("review_all");
          } else {
            setMode(records.length > 0 ? "list" : "intro");
          }
        }}
      />
    );
  }

  // ---- Form mode: education/credential (uses GuidedForm) ----
  if (mode === "form") {
    const formConfig = {
      education: { steps: educationSteps || [], save: onSaveEducation, label: "Education" },
      credential: { steps: credentialSteps || [], save: onSaveCredential, label: "License or Certification" },
    };
    const config = formConfig[formType] || formConfig.education;
    const initialData = editingRecord || {};

    return (
      <GuidedForm
        steps={config.steps}
        initialData={initialData}
        onSave={async (formData) => {
          const saved = await config.save(formData);
          setSelectedExperienceType(null);
          if (returnToReview) {
            if (formType === "education") {
              if (editingConfirmedEduIdx !== null) {
                setConfirmedEducation(confirmedEducation.map((item, i) =>
                  i === editingConfirmedEduIdx ? { ...formData, savedId: saved?.id || item.savedId } : item
                ));
                setEditingConfirmedEduIdx(null);
              } else {
                setConfirmedEducation([...confirmedEducation, { ...formData, savedId: saved?.id }]);
              }
            } else if (formType === "credential" && editingConfirmedCredIdx !== null) {
              setConfirmedCredentials(confirmedCredentials.map((item, i) =>
                i === editingConfirmedCredIdx ? { ...formData, savedId: saved?.id || item.savedId } : item
              ));
              setEditingConfirmedCredIdx(null);
            }
            setFormType("employment");
            setReturnToReview(false);
            setMode("review_all");
          } else {
            setSavedType(formType);
            setFormType("employment");
            setMode("saved");
          }
        }}
        onExit={() => {
          setSelectedExperienceType(null);
          setFormType("employment");
          setEditingConfirmedEduIdx(null);
          setEditingConfirmedJobIdx(null);
          setEditingConfirmedCredIdx(null);
          if (returnToReview) {
            setReturnToReview(false);
            setMode("review_all");
          } else {
            setMode(records.length > 0 ? "list" : "intro");
          }
        }}
        title={config.label}
      />
    );
  }

  // ---- Saved mode (post-save confirmation) ----
  if (mode === "saved") {
    const isEmploymentSave = savedType === "employment";
    const savedCount = records.length;
    const savedHeading = isEmploymentSave ? "Job Added" : "Saved to your profile.";
    const savedSubtext = isEmploymentSave
      ? "Your employment experience has been saved."
      : "Great work! What would you like to do next?";
    const addLabel = isEmploymentSave ? "Add Another Position" : "Add another";
    const cardLabel = isEmploymentSave ? "Review Employment History" : null;
    const cardCount = isEmploymentSave
      ? `${savedCount} ${savedCount === 1 ? "position" : "positions"} added`
      : null;

    return (
      <div className="py-6 space-y-5 animate-fade-in">
        <div className="bg-success/10 rounded-2xl p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-3">
            <Check className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-xl font-bold text-foreground">{savedHeading}</h2>
          <p className="text-sm text-muted-foreground mt-1">{savedSubtext}</p>
        </div>

        {cardLabel && (
          <div className="bg-card rounded-2xl border border-border p-5 flex items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-heading font-semibold text-foreground">{cardLabel}</p>
              <p className="text-sm text-muted-foreground">{cardCount}</p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Button
            onClick={onExitNext}
            className="w-full h-14 text-base font-semibold"
          >
            Continue to {nextSectionLabel || "Next Section"}
            <ArrowRight className="w-5 h-5 ml-1" />
          </Button>
          <Button
            onClick={() => {
              setEditingRecord(null);
              setMode("form");
            }}
            variant="outline"
            className="w-full h-12 font-semibold"
          >
            <Plus className="w-5 h-5 mr-1" />
            {addLabel}
          </Button>
        </div>
      </div>
    );
  }

  // ---- List mode (default for viewing existing records) ----
  return (
    <div className="py-6 space-y-5 animate-fade-in">
      <button
        onClick={onPrev}
        className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="w-5 h-5" />
        Back
      </button>

      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{records.length} {records.length === 1 ? "position" : "positions"} saved</p>
      </div>

      {records.length > 0 ? (
        <div className="space-y-3">
          {records.map((record) => (
            <div key={record.id} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0" onClick={() => { setEditingRecord(record); setMode("form"); }}>
                <p className="font-heading font-semibold text-foreground truncate">
                  {record.job_title || "Untitled"} at {record.employer_name || ""}
                </p>
                <p className="text-sm text-muted-foreground truncate mt-0.5">
                  {[record.city, record.state].filter(Boolean).join(", ") || record.experience_type}
                </p>
              </div>
              <button
                onClick={() => { setEditingRecord(record); setMode("form"); }}
                className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
                aria-label="Edit"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(record.id)}
                className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                aria-label="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-dashed border-border p-8 text-center">
          <p className="text-muted-foreground text-sm">No positions yet. Tap below to add your first one.</p>
        </div>
      )}

      <div className="space-y-2">
        <Button
          onClick={() => { setEditingRecord(null); setMode("form"); }}
          variant="outline"
          className="w-full h-12"
        >
          <Plus className="w-5 h-5 mr-1" />
          Add a position
        </Button>
        <Button
          onClick={onExitNext}
          className="w-full h-14 text-base font-semibold"
        >
          Continue to {nextSectionLabel || "Next Step"}
          <ArrowRight className="w-5 h-5 ml-1" />
        </Button>
      </div>
    </div>
  );
}

// ---- Sub-component: Upload resume flow ----
function UploadResumeFlow({ onBack, onDataExtracted }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError("");
    setCredentialSource("EmploymentHub.jsx", "handleUpload");
    setCredentialOrigin("Resume Upload");
    console.log(`[CRED-DEBUG] ${new Date().toISOString()} — resume upload begins, file=${selectedFile.name}`);
    logCredentialEvent({ eventName: "Resume upload started", details: `file=${selectedFile.name}` });
    try {
      const uploadResult = await base44.integrations.Core.UploadFile({ file: selectedFile });
      logCredentialEvent({ eventName: "Resume uploaded successfully", details: `file_url=${uploadResult?.file_url || ""}` });

      // Create document record
      await base44.entities.UserDocument.create({
        document_name: selectedFile.name,
        document_type: "Resume",
        file_url: uploadResult.file_url,
        upload_date: new Date().toISOString(),
        processing_status: "Completed",
        extraction_status: "In Progress",
        verification_status: "User Entered",
      });

      // Extract employment, education, credentials, and skills using LLM
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Extract all employment history, education, professional licenses/certifications, and skills from this resume.\n\nFor each job, include: employer_name, job_title, duties (main responsibilities).\nFor each education entry, include: institution_name, degree_or_credential, field_of_study, graduation_year.\nFor each credential, include: credential_name, issuing_organization, credential_type (one of: License, Certification, Permit, Other).\nFor each skill, include: skill_name, and skill_category (one of: Dependability, Working with people, Hands-on work, Office and technology, Leadership and thinking, Other).\n\nIMPORTANT: Include any education, credentials, or skills that seem likely, even if you are not fully confident. It is better to include a possible match and let the user confirm it than to miss it. Do not discard items simply because confidence is low.\n\nReturn a JSON object with four arrays: employment_history, education, credentials, skills. If a category has no items, return an empty array.`,
        file_urls: [uploadResult.file_url],
        response_json_schema: {
          type: "object",
          properties: {
            employment_history: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  employer_name: { type: "string" },
                  job_title: { type: "string" },
                  duties: { type: "string" },
                },
              },
            },
            education: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  institution_name: { type: "string" },
                  degree_or_credential: { type: "string" },
                  field_of_study: { type: "string" },
                  graduation_year: { type: "string" },
                },
              },
            },
            credentials: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  credential_name: { type: "string" },
                  issuing_organization: { type: "string" },
                  credential_type: { type: "string" },
                },
              },
            },
            skills: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  skill_name: { type: "string" },
                  skill_category: { type: "string" },
                },
              },
            },
          },
        },
      });

      const employment = result?.employment_history || [];
      const education = result?.education || [];
      const credentials = result?.credentials || [];
      const skills = result?.skills || [];
      console.log(`[CRED-DEBUG] ${new Date().toISOString()} — LLM extraction complete, credentials_extracted=${credentials.length}`);
      logCredentialEvent({ eventName: "AI extraction completed", details: `credentials_extracted=${credentials.length}` });
      logCredentialEvent({ eventName: "Credentials extracted", details: `count=${credentials.length}` });
      credentials.forEach((c, i) => {
        console.log(`[CRED-DEBUG] ${new Date().toISOString()} — extracted[${i}] name="${c.credential_name}" issuer="${c.issuing_organization}" type="${c.credential_type}"`);
        logCredentialEvent({
          eventName: "Extracted credential",
          credentialName: c.credential_name || "",
          details: `issuer="${c.issuing_organization || ""}" type="${c.credential_type || ""}"`,
        });
      });

      if (employment.length === 0 && education.length === 0 && credentials.length === 0 && skills.length === 0) {
        setError("We couldn't find any information in your resume. You can add it manually.");
      } else {
        onDataExtracted({ employment, education, credentials, skills });
      }
    } catch (err) {
      console.error("Upload/extraction failed:", err);
      setError("We couldn't process your resume. You can add jobs manually instead.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="py-6 space-y-5 animate-fade-in">
      <button onClick={onBack} className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ChevronLeft className="w-5 h-5" />
        Back
      </button>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Upload your resume</h1>
        <p className="text-muted-foreground text-sm mt-0.5">We'll pull out your jobs, education, and certifications for you to review.</p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
        <label className="flex items-center justify-center gap-2 w-full h-24 rounded-xl border-2 border-dashed border-border hover:border-primary/40 cursor-pointer transition-colors">
          <Upload className="w-6 h-6 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {selectedFile ? selectedFile.name : "Tap to select a PDF or DOCX file"}
          </span>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={(e) => setSelectedFile(e.target.files[0])}
          />
        </label>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="w-full h-12 font-semibold"
        >
          {uploading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 mr-1" />
              Upload and Extract
            </>
          )}
        </Button>
      </div>
    </div>
  );
}