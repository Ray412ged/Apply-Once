import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { SECTION_MAP } from "@/lib/profileSections";
import { updateProfileCompletion, getPrevSection, getNextIncompleteSection } from "@/lib/profileUtils";
import { useProfileData } from "@/hooks/useProfileData";
import GuidedForm from "@/components/GuidedForm";
import { findDuplicate } from "@/lib/resumeDedup";
import { logCredentialEvent, setCredentialSource } from "@/lib/credentialDebugLog";
import { recordActivity } from "@/lib/recordActivity";
import DocumentManager from "@/components/DocumentManager";
import SkillsSelector from "@/components/SkillsSelector";
import EmploymentHub from "@/components/EmploymentHub";
import JobGoals from "@/components/JobGoals";
import ProfileReview from "@/components/ProfileReview";
import ProfessionalIntroduction from "@/components/ProfessionalIntroduction";
import EducationSection from "@/components/profile/EducationSection";
import CredentialsSection from "@/components/profile/CredentialsSection";
import ReferencesSection from "@/components/profile/ReferencesSection";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, ChevronLeft, Trash2, Pencil, ArrowRight, Check } from "lucide-react";

export default function ProfileSection() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sectionId = searchParams.get("section");
  const section = SECTION_MAP[sectionId];

  const { data: completion, isLoading: profileLoading } = useProfileData();
  const [editingRecord, setEditingRecord] = useState(null);
  const [showSaved, setShowSaved] = useState(false);

  // Tracks profile completion transition for auto-navigation to the Command Center
  const justCompletedRef = useRef(false);
  const latestCompletionRef = useRef(null);
  const checkCompletionTransition = (updatedCompletion) => {
    latestCompletionRef.current = updatedCompletion;
    const wasComplete = (completion?.percentage || 0) === 100;
    const isNowComplete = (updatedCompletion?.percentage || 0) === 100;
    if (!wasComplete && isNowComplete) {
      justCompletedRef.current = true;
    }
  };

  const existingRecord = useMemo(() => {
    if (!completion || !section?.entity || section.type !== "single") return null;
    if (section.entity === "UserProfile") return completion.profile || null;
    if (section.entity === "JobPreference") return completion.preferences || null;
    return null;
  }, [completion, section]);

  // Canonical "Continue" label — the next unresolved section in the guided
  // profile sequence (About → Job Goals → Employment → Skills → Education →
  // Licenses → References → Introduction → Review).
  const optionalNextLabel = useMemo(() => {
    const next = getNextIncompleteSection(completion?.sections);
    return next && next.id !== "review" ? next.title : "Review My Profile";
  }, [completion]);

  const records = useMemo(() => {
    if (!completion || !section?.entity || section.type === "single") return [];
    const entityMap = {
      EmploymentRecord: completion.employmentRecords,
      EducationRecord: completion.educationRecords,
      Skill: completion.skills,
      Credential: completion.credentials,
      Reference: completion.references,
    };
    const list = entityMap[section.entity] || [];
    return [...list].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  }, [completion, section]);

  const savedEducationCount = completion?.educationRecords?.length || 0;

  useEffect(() => {
    if (!section) {
      navigate("/profile", { replace: true });
      return;
    }
    setShowSaved(false);
    setEditingRecord(null);
  }, [sectionId]);

  // Records a profile_section_completed activity event whenever the
  // "saved" confirmation appears, regardless of which save handler
  // triggered it — avoids having to instrument every individual save
  // call site (there are several across this file).
  useEffect(() => {
    if (showSaved) {
      recordActivity("profile_section_completed");
    }
  }, [showSaved]);

  // Save for single-record sections (UserProfile, JobPreference)
  const handleSaveSingle = async (formData) => {
    if (existingRecord) {
      await base44.entities[section.entity].update(existingRecord.id, formData);
    } else {
      await base44.entities[section.entity].create(formData);
    }
    const updated = await updateProfileCompletion();
    checkCompletionTransition(updated);
  };

  // Save fields directly to UserProfile (used by question-first sections)
  const handleSaveProfileField = async (data) => {
    const profile = completion?.profile;
    if (profile) {
      await base44.entities.UserProfile.update(profile.id, data);
    } else {
      await base44.entities.UserProfile.create(data);
    }
    const updated = await updateProfileCompletion();
    checkCompletionTransition(updated);
  };

  // Save for list sections (create or update)
  const handleSaveRecord = async (formData) => {
    let saved;
    if (formData.id) {
      saved = await base44.entities[section.entity].update(formData.id, formData);
    } else {
      saved = await base44.entities[section.entity].create(formData);
    }
    const updated = await updateProfileCompletion();
    checkCompletionTransition(updated);
    return saved;
  };

  const handleSaveEducation = async (formData) => {
    let saved;
    if (formData.id) {
      saved = await base44.entities.EducationRecord.update(formData.id, formData);
    } else {
      const dup = findDuplicate("EducationRecord", formData, completion?.educationRecords || []);
      if (dup) {
        saved = await base44.entities.EducationRecord.update(dup.id, formData);
      } else {
        saved = await base44.entities.EducationRecord.create(formData);
      }
    }
    const updated = await updateProfileCompletion();
    checkCompletionTransition(updated);
    return saved;
  };

  const handleSaveCredential = async (formData) => {
    setCredentialSource("ProfileSection.jsx", "handleSaveCredential");
    console.log(`[CRED-DEBUG] ${new Date().toISOString()} — handleSaveCredential ENTER name="${formData.credential_name}" issuer="${formData.issuing_organization}" hasId=${!!formData.id} existingCount=${completion?.credentials?.length || 0}`);
    logCredentialEvent({
      eventName: "handleSaveCredential() called",
      credentialName: formData.credential_name || "",
      recordId: formData.id || "",
      details: `hasId=${!!formData.id} existingCount=${completion?.credentials?.length || 0}`,
    });
    let saved;
    if (formData.id) {
      console.log(`[CRED-DEBUG] ${new Date().toISOString()} — Credential.update CALL id="${formData.id}" name="${formData.credential_name}"`);
      logCredentialEvent({ eventName: "Credential.update() called", credentialName: formData.credential_name || "", recordId: formData.id, action: "UPDATE" });
      saved = await base44.entities.Credential.update(formData.id, formData);
      console.log(`[CRED-DEBUG] ${new Date().toISOString()} — Credential.update DONE id="${formData.id}" name="${formData.credential_name}"`);
      logCredentialEvent({ eventName: "Credential.update() done", credentialName: formData.credential_name || "", recordId: formData.id, action: "UPDATE" });
    } else {
      const dup = findDuplicate("Credential", formData, completion?.credentials || []);
      console.log(`[CRED-DEBUG] ${new Date().toISOString()} — findDuplicate result dup=${dup ? `"${dup.id}"` : 'null'} name="${formData.credential_name}" checkedAgainst=${completion?.credentials?.length || 0} records`);
      logCredentialEvent({
        eventName: "Duplicate check",
        credentialName: formData.credential_name || "",
        recordId: dup?.id || "",
        action: dup ? "DUPLICATE_FOUND" : "SKIP",
        details: `dup=${dup ? `"${dup.id}"` : "null"} checkedAgainst=${completion?.credentials?.length || 0} records`,
      });
      if (dup) {
        console.log(`[CRED-DEBUG] ${new Date().toISOString()} — Credential.update CALL (dedup) dupId="${dup.id}" name="${formData.credential_name}"`);
        logCredentialEvent({ eventName: "Credential.update() called (dedup)", credentialName: formData.credential_name || "", recordId: dup.id, action: "DUPLICATE_FOUND" });
        saved = await base44.entities.Credential.update(dup.id, formData);
        console.log(`[CRED-DEBUG] ${new Date().toISOString()} — Credential.update DONE (dedup) dupId="${dup.id}" name="${formData.credential_name}"`);
        logCredentialEvent({ eventName: "Credential.update() done (dedup)", credentialName: formData.credential_name || "", recordId: dup.id, action: "UPDATE" });
      } else {
        console.log(`[CRED-DEBUG] ${new Date().toISOString()} — Credential.create CALL name="${formData.credential_name}" issuer="${formData.issuing_organization}"`);
        logCredentialEvent({ eventName: "Credential.create() called", credentialName: formData.credential_name || "", action: "CREATE" });
        saved = await base44.entities.Credential.create(formData);
        console.log(`[CRED-DEBUG] ${new Date().toISOString()} — Credential.create DONE name="${formData.credential_name}" newId="${saved?.id || 'none'}"`);
        logCredentialEvent({ eventName: "Credential.create() done", credentialName: formData.credential_name || "", recordId: saved?.id || "", action: "CREATE" });
      }
    }
    const updated = await updateProfileCompletion();
    checkCompletionTransition(updated);
    console.log(`[CRED-DEBUG] ${new Date().toISOString()} — handleSaveCredential EXIT name="${formData.credential_name}" savedId="${saved?.id || 'none'}"`);
    logCredentialEvent({ eventName: "handleSaveCredential() returned", credentialName: formData.credential_name || "", recordId: saved?.id || "", action: saved?.id ? "INFO" : "SKIP" });
    return saved;
  };

  const handleSaveSkill = async (formData) => {
    let saved;
    if (formData.id) {
      saved = await base44.entities.Skill.update(formData.id, formData);
    } else {
      const dup = findDuplicate("Skill", formData, completion?.skills || []);
      if (dup) {
        saved = await base44.entities.Skill.update(dup.id, formData);
      } else {
        saved = await base44.entities.Skill.create(formData);
      }
    }
    const updated = await updateProfileCompletion();
    checkCompletionTransition(updated);
    return saved;
  };

  const handleDelete = async (id) => {
    await base44.entities[section.entity].delete(id);
    await updateProfileCompletion();
  };

  // Guided profile flow follows the canonical section sequence:
  //   About → Job Goals → Employment → Skills → Education → Licenses →
  //   References → Introduction → Review
  // Job Goals participates exactly like every other section — it is never
  // skipped. The readiness engine's priority order is intentionally NOT used
  // here because it omits Job Goals; the canonical PROFILE_SECTIONS order is
  // the source of truth for the guided flow. When the profile reaches 100%,
  // send the user to the Command Center.
  const navigateToNext = () => {
    if (justCompletedRef.current) {
      justCompletedRef.current = false;
      navigate("/home");
      window.scrollTo({ top: 0 });
      return;
    }
    const data = latestCompletionRef.current || completion;
    const next = getNextIncompleteSection(data?.sections);
    if (next && next.id !== "review") {
      navigate(`/profile/edit?section=${next.id}`);
    } else if (next && next.id === "review") {
      navigate("/profile/edit?section=review");
    } else {
      navigate("/home");
    }
    window.scrollTo({ top: 0 });
  };

  const navigateToPrev = () => {
    const prev = getPrevSection(sectionId);
    if (prev) {
      navigate(`/profile/edit?section=${prev.id}`);
      window.scrollTo({ top: 0 });
    } else {
      navigate("/profile");
    }
  };

  const navigateToHome = () => navigate("/home");

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!section) return null;

  // --- Specialized components ---

  if (section.component === "skills") {
    return (
      <SkillsSelector
        initialData={records}
        employmentRecords={completion?.employmentRecords || []}
        onSave={handleSaveRecord}
        onDelete={handleDelete}
        onExit={navigateToNext}
        onPrev={navigateToPrev}
        onExitProfile={navigateToHome}
        title={section.title}
        nextSectionLabel={optionalNextLabel}
        completionPercentage={completion?.percentage || 0}
        sectionId={sectionId}
      />
    );
  }

  if (section.component === "jobgoals") {
    return (
      <JobGoals
        initialData={existingRecord || {}}
        employmentRecords={completion?.employmentRecords || []}
        onSave={async (data) => { await handleSaveSingle(data); navigateToNext(); }}
        onPrev={navigateToPrev}
        onExitProfile={navigateToHome}
        title={section.title}
      />
    );
  }

  if (section.component === "employment") {
    return (
      <EmploymentHub
        records={records}
        onSave={handleSaveRecord}
        onSaveEducation={handleSaveEducation}
        onSaveCredential={handleSaveCredential}
        onSaveSkill={handleSaveSkill}
        educationSteps={SECTION_MAP.education?.steps}
        credentialSteps={SECTION_MAP.credentials?.steps}
        savedEducationCount={savedEducationCount}
        onDelete={handleDelete}
        onExitNext={navigateToNext}
        onPrev={navigateToPrev}
        title={section.title}
        nextSectionLabel={optionalNextLabel}
        profileEntryMethod={completion?.profile?.profile_entry_method || null}
      />
    );
  }

  if (section.component === "introduction") {
    return (
      <ProfessionalIntroduction
        initialData={existingRecord || {}}
        profileData={completion}
        onSave={async (data) => {
          await handleSaveSingle(data);
          if (justCompletedRef.current) {
            justCompletedRef.current = false;
            navigate("/home");
            window.scrollTo({ top: 0 });
          }
        }}
        onPrev={navigateToPrev}
        onExitProfile={navigateToHome}
        onReview={navigateToNext}
        nextLabel={optionalNextLabel}
        title={section.title}
      />
    );
  }

  if (section.component === "review") {
    return <ProfileReview completion={completion} onExit={navigateToPrev} />;
  }

  if (section.component === "documents") {
    return <DocumentManager />;
  }

  if (section.component === "education") {
    return (
      <EducationSection
        profile={completion?.profile}
        educationRecords={completion?.educationRecords || []}
        onSaveProfile={handleSaveProfileField}
        onSaveEducation={handleSaveEducation}
        onDelete={handleDelete}
        onExit={navigateToNext}
        onPrev={navigateToPrev}
        onExitProfile={navigateToHome}
        title={section.title}
        nextSectionLabel={optionalNextLabel}
      />
    );
  }

  if (section.component === "credentials") {
    return (
      <CredentialsSection
        profile={completion?.profile}
        credentials={completion?.credentials || []}
        onSaveProfile={handleSaveProfileField}
        onSaveCredential={handleSaveCredential}
        onDelete={handleDelete}
        onExit={navigateToNext}
        onPrev={navigateToPrev}
        onExitProfile={navigateToHome}
        title={section.title}
        nextSectionLabel={optionalNextLabel}
      />
    );
  }

  if (section.component === "references") {
    return (
      <ReferencesSection
        profile={completion?.profile}
        references={completion?.references || []}
        onSaveProfile={handleSaveProfileField}
        onSaveRecord={handleSaveRecord}
        onDelete={handleDelete}
        onExit={navigateToNext}
        onPrev={navigateToPrev}
        onExitProfile={navigateToHome}
        title={section.title}
        nextSectionLabel={optionalNextLabel}
      />
    );
  }

  // --- Guided form for single-record sections ---
  if (section.type === "single") {
    return (
      <GuidedForm
        steps={section.steps}
        initialData={existingRecord || {}}
        onSave={handleSaveSingle}
        onComplete={navigateToNext}
        onExit={navigateToPrev}
        onExitProfile={navigateToHome}
        title={section.title}
        sectionId={sectionId}
      />
    );
  }

  // --- List sections with GuidedForm (education, credentials, references) ---

  // Editing/adding mode
  if (editingRecord !== null) {
    const isEditing = editingRecord !== "new";
    return (
      <GuidedForm
        steps={section.steps}
        initialData={isEditing ? editingRecord : {}}
        onSave={async (formData) => {
          if (isEditing) {
            await handleSaveRecord({ ...formData, id: editingRecord.id });
          } else {
            await handleSaveRecord(formData);
          }
          setEditingRecord(null);
          setShowSaved(true);
        }}
        onExit={() => setEditingRecord(null)}
        title={section.title}
        sectionId={sectionId}
      />
    );
  }

  // Saved confirmation
  if (showSaved) {
    const savedMessage = (() => {
      switch (section.entity) {
        case "EducationRecord": return "Education added to your profile.";
        case "Credential": return "License added to your profile.";
        case "Reference": return "Reference added to your profile.";
        default: return "Saved to your profile.";
      }
    })();
    return (
      <div className="py-6 space-y-5 animate-fade-in">
        <div className="bg-success/10 rounded-2xl p-6 text-center" role="status" aria-live="polite">
          <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-3">
            <Check className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-xl font-bold text-foreground">{savedMessage}</h2>
          <p className="text-sm text-muted-foreground mt-1">What would you like to do next?</p>
        </div>
        <div className="space-y-2">
          <Button
            onClick={() => setEditingRecord("new")}
            variant="outline"
            className="w-full h-12"
          >
            <Plus className="w-5 h-5 mr-1" />
            Add another
          </Button>
          <Button onClick={navigateToNext} className="w-full h-14 text-base font-semibold">
            Continue to {optionalNextLabel}
            <ArrowRight className="w-5 h-5 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  // List view
  const getRecordTitle = (record) => {
    switch (section.entity) {
      case "EducationRecord": return record.institution_name || "Untitled";
      case "Credential": return record.credential_name || "Untitled";
      case "Reference": return record.full_name || "Untitled";
      default: return "Item";
    }
  };

  const getRecordSubtitle = (record) => {
    switch (section.entity) {
      case "EducationRecord": return record.degree_or_credential || record.field_of_study;
      case "Credential": return record.issuing_organization;
      case "Reference": return record.relationship;
      default: return undefined;
    }
  };

  return (
    <div className="py-6 space-y-5 animate-fade-in">
      <OnboardingProgress currentSectionId={sectionId} completionPercentage={completion?.percentage || 0} />

      <button onClick={navigateToPrev} className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ChevronLeft className="w-5 h-5" />
        Back
      </button>

      <div>
        <h1 className="text-2xl font-bold text-foreground">{section.title}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{section.subtitle}</p>
      </div>

      {records.length > 0 ? (
        <div className="space-y-3">
          {records.map((record) => (
            <div key={record.id} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0" onClick={() => setEditingRecord(record)}>
                <p className="font-heading font-semibold text-foreground truncate">{getRecordTitle(record)}</p>
                {getRecordSubtitle(record) && (
                  <p className="text-sm text-muted-foreground truncate mt-0.5">{getRecordSubtitle(record)}</p>
                )}
              </div>
              <button onClick={() => setEditingRecord(record)} className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground" aria-label="Edit">
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(record.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive" aria-label="Delete">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-dashed border-border p-8 text-center">
          <p className="text-muted-foreground text-sm">No items yet. Tap below to add your first one.</p>
        </div>
      )}

      <div className="space-y-2">
        <Button onClick={() => setEditingRecord("new")} variant="outline" className="w-full h-12">
          <Plus className="w-5 h-5 mr-1" />
          Add
        </Button>
        <Button onClick={navigateToNext} className="w-full h-14 text-base font-semibold">
          Continue to {optionalNextLabel}
          <ArrowRight className="w-5 h-5 ml-1" />
        </Button>
      </div>
    </div>
  );
}