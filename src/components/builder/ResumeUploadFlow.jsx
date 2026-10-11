import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { saveGuestSingle, bulkAddGuestRecords } from "@/lib/guestStorage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronLeft, Upload, FileText, Loader2, AlertCircle, ArrowRight, Check,
  PartyPopper, X, Plus, Briefcase, Sparkles, GraduationCap, Award, User,
} from "lucide-react";

const EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    first_name: { type: "string" },
    last_name: { type: "string" },
    email: { type: "string" },
    phone: { type: "string" },
    city: { type: "string" },
    state: { type: "string" },
    employment_history: {
      type: "array",
      items: {
        type: "object",
        properties: {
          employer_name: { type: "string" },
          job_title: { type: "string" },
          start_month: { type: "string" },
          start_year: { type: "string" },
          end_month: { type: "string" },
          end_year: { type: "string" },
          currently_employed: { type: "boolean" },
          duties: { type: "string" },
        },
      },
    },
    skills: { type: "array", items: { type: "string" } },
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
    certifications: {
      type: "array",
      items: {
        type: "object",
        properties: {
          credential_name: { type: "string" },
          issuing_organization: { type: "string" },
        },
      },
    },
  },
};

const BENEFITS = [
  "Generate professional resumes",
  "Prepare job applications",
  "Generate interview questions",
  "Build your professional profile",
];

export default function ResumeUploadFlow() {
  const navigate = useNavigate();
  const [step, setStep] = useState("upload");
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [parseError, setParseError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const fileInputRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setParseError("");
    }
  };

  const handleUploadAndParse = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setParseError("");
    setStep("parsing");
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });
      const extraction = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: EXTRACTION_SCHEMA,
      });

      if (extraction.status === "error" || !extraction.output) {
        throw new Error(extraction.details || "We couldn't read this file.");
      }

      const r = extraction.output;
      const data = {
        contact_info: {
          first_name: r.first_name || "",
          last_name: r.last_name || "",
          email: r.email || "",
          phone: r.phone || "",
          city: r.city || "",
          state: r.state || "",
        },
        employment_history: (r.employment_history || []).filter((e) => e.employer_name || e.job_title),
        skills: (r.skills || []).filter(Boolean),
        education: (r.education || []).filter((e) => e.institution_name),
        certifications: (r.certifications || []).filter((c) => c.credential_name),
      };

      const hasData =
        data.employment_history.length > 0 ||
        data.skills.length > 0 ||
        data.education.length > 0 ||
        data.certifications.length > 0 ||
        data.contact_info.first_name;

      if (!hasData) {
        setParseError("We couldn't find any information in your resume. Please try a different file.");
        setStep("upload");
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 600));
      setParsedData(data);
      setStep("review");
    } catch (err) {
      console.error("Resume parsing failed:", err);
      setParseError("We couldn't read your resume. Please try a PDF file.");
      setStep("upload");
    } finally {
      setUploading(false);
    }
  };

  const handleContinue = () => {
    const d = parsedData;
    if (d.contact_info.first_name || d.contact_info.last_name || d.contact_info.email) {
      saveGuestSingle("UserProfile", { ...d.contact_info, onboarding_status: "in_progress" });
    }
    if (d.employment_history.length > 0) {
      bulkAddGuestRecords("EmploymentRecord", d.employment_history.map((e) => ({
        employer_name: e.employer_name || "",
        job_title: e.job_title || "",
        start_month: e.start_month || "",
        start_year: e.start_year || "",
        end_month: e.end_month || "",
        end_year: e.end_year || "",
        currently_employed: e.currently_employed || false,
        duties: e.duties || "",
        verified_status: "Document Extracted",
      })));
    }
    if (d.skills.length > 0) {
      bulkAddGuestRecords("Skill", d.skills.map((s) => ({
        skill_name: s, skill_category: "Other", source: "Document Extracted",
      })));
    }
    if (d.education.length > 0) {
      bulkAddGuestRecords("EducationRecord", d.education.map((e) => ({
        institution_name: e.institution_name || "",
        degree_or_credential: e.degree_or_credential || "",
        field_of_study: e.field_of_study || "",
        graduation_year: e.graduation_year || "",
        verified_status: "Document Extracted",
      })));
    }
    if (d.certifications.length > 0) {
      bulkAddGuestRecords("Credential", d.certifications.map((c) => ({
        credential_name: c.credential_name || "",
        issuing_organization: c.issuing_organization || "",
        credential_type: "Certification",
        verified_status: "Document Extracted",
      })));
    }
    setStep("complete");
  };

  // --- Helpers for editing parsed data ---
  const updateContact = (field, value) =>
    setParsedData((p) => ({ ...p, contact_info: { ...p.contact_info, [field]: value } }));

  const updateArrayItem = (key, index, field, value) =>
    setParsedData((p) => {
      const updated = [...p[key]];
      updated[index] = { ...updated[index], [field]: value };
      return { ...p, [key]: updated };
    });

  const removeArrayItem = (key, index) =>
    setParsedData((p) => ({ ...p, [key]: p[key].filter((_, i) => i !== index) }));

  const addSkill = () => {
    if (!newSkill.trim()) return;
    setParsedData((p) => ({ ...p, skills: [...p.skills, newSkill.trim()] }));
    setNewSkill("");
  };

  // --- Parsing step ---
  if (step === "parsing") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center max-w-md mx-auto px-5">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <h1 className="text-xl font-bold text-foreground mb-1">Analyzing your resume...</h1>
        <p className="text-muted-foreground text-sm">This usually takes a few seconds.</p>
      </div>
    );
  }

  // --- Complete step ---
  if (step === "complete") {
    return (
      <div className="min-h-screen flex flex-col max-w-md mx-auto px-5 py-8">
        <div className="flex-1 flex flex-col justify-center text-center">
          <div className="w-20 h-20 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-6">
            <PartyPopper className="w-10 h-10 text-success" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">Your Employment History Is Ready</h1>
          <p className="text-muted-foreground text-sm mb-1">Great news!</p>
          <p className="text-muted-foreground text-sm mb-8">
            We've organized your resume into a reusable Employment History.
          </p>
          <p className="text-sm font-medium text-foreground mb-3">From here you'll be able to:</p>
          <div className="space-y-3 mb-8">
            {BENEFITS.map((b) => (
              <div key={b} className="flex items-center gap-3 bg-card rounded-xl border border-border p-4">
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
                  <Check className="w-5 h-5 text-success" />
                </div>
                <p className="text-sm font-medium text-foreground text-left">{b}</p>
              </div>
            ))}
          </div>
          <div className="bg-primary/5 rounded-xl border border-primary/15 p-4 mb-8">
            <p className="text-sm text-foreground leading-relaxed">
              To securely save your work and continue using Apply Once, create your free account.
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <Button onClick={() => navigate("/profile/edit?section=about")} className="w-full h-14 text-base font-semibold">
            Continue Building My Profile
            <ArrowRight className="w-5 h-5 ml-1" />
          </Button>
          <Button onClick={() => navigate("/register")} variant="outline" className="w-full h-12 font-semibold">
            Create Free Account
          </Button>
        </div>
      </div>
    );
  }

  const summaryItems = [
    parsedData?.employment_history?.length > 0 && {
      icon: Briefcase,
      label: `${parsedData.employment_history.length} ${parsedData.employment_history.length === 1 ? "Employer" : "Employers"}`,
    },
    parsedData?.skills?.length > 0 && {
      icon: Sparkles,
      label: `${parsedData.skills.length} ${parsedData.skills.length === 1 ? "Skill" : "Skills"}`,
    },
    parsedData?.education?.length > 0 && {
      icon: GraduationCap,
      label: parsedData.education.length === 1 ? "Education" : `${parsedData.education.length} Education`,
    },
    parsedData?.certifications?.length > 0 && {
      icon: Award,
      label: `${parsedData.certifications.length} ${parsedData.certifications.length === 1 ? "Certification" : "Certifications"}`,
    },
    (parsedData?.contact_info?.first_name || parsedData?.contact_info?.email) && {
      icon: User,
      label: "Contact Information",
    },
  ].filter(Boolean);

  const slideVariants = prefersReducedMotion
    ? { enter: { opacity: 0 }, center: { opacity: 1 }, exit: { opacity: 0 } }
    : { enter: { opacity: 0, x: 24 }, center: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -24 } };

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto">
      <AnimatePresence mode="wait" custom={step}>
        <motion.div
          key={step}
          custom={step}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={prefersReducedMotion ? { duration: 0.15 } : { duration: 0.25, ease: "easeOut" }}
          className="flex-1 flex flex-col"
        >
          {/* === Upload step === */}
          {step === "upload" && (
            <div className="flex-1 flex flex-col px-5 py-8">
              <button onClick={() => navigate("/onboarding")} className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground mb-6">
                <ChevronLeft className="w-5 h-5" /> Back
              </button>
              <div className="flex-1 flex flex-col justify-center">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center mb-3">
                  <Upload className="w-5 h-5 text-primary-foreground" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">Upload Your Resume</h1>
                <p className="text-muted-foreground text-sm mb-1">Already have a resume? We'll import it and review it with you.</p>
                <p className="text-primary text-xs font-medium mb-6">No account required</p>

                {parseError && (
                  <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-3 mb-4 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-destructive">{parseError}</p>
                  </div>
                )}

                <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" onChange={handleFileSelect} className="hidden" />

                {!selectedFile ? (
                  <button onClick={() => fileInputRef.current?.click()} className="w-full border-2 border-dashed border-border rounded-2xl p-8 text-center hover:border-primary/50 hover:bg-primary/5 transition-colors">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm font-medium text-foreground mb-1">Tap to select your resume</p>
                    <p className="text-xs text-muted-foreground">PDF recommended</p>
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 bg-card rounded-xl border border-border p-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(0)} KB</p>
                      </div>
                      <button onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="text-muted-foreground hover:text-destructive text-sm font-medium">
                        Change
                      </button>
                    </div>
                    <Button onClick={handleUploadAndParse} disabled={uploading} className="w-full h-14 text-base font-semibold">
                      {uploading ? "Analyzing..." : "Upload & Analyze"}
                      {!uploading && <ArrowRight className="w-5 h-5 ml-1" />}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* === Review step === */}
          {step === "review" && parsedData && (
            <>
              <div className="px-4 pt-4">
                <button onClick={() => navigate("/onboarding")} className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground mb-2">
                  <ChevronLeft className="w-5 h-5" /> Back
                </button>
                <h1 className="text-2xl font-bold text-foreground mb-1">We Found...</h1>
                <p className="text-muted-foreground text-sm mb-4">We organized your experience into a reusable Employment History.</p>
                <div className="bg-card rounded-xl border border-border p-4 space-y-2.5 mb-2">
                  {summaryItems.map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-success/15 flex items-center justify-center flex-shrink-0">
                          <Check className="w-4 h-4 text-success" />
                        </div>
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed mt-2">Review the information below and make any corrections.</p>

                {/* Contact Info */}
                {summaryItems.some((s) => s.label === "Contact Information") && (
                  <ReviewSection title="Contact Information">
                    <div className="grid grid-cols-2 gap-3">
                      <LabeledInput label="First Name" value={parsedData.contact_info.first_name} onChange={(v) => updateContact("first_name", v)} />
                      <LabeledInput label="Last Name" value={parsedData.contact_info.last_name} onChange={(v) => updateContact("last_name", v)} />
                      <LabeledInput label="Email" value={parsedData.contact_info.email} onChange={(v) => updateContact("email", v)} full />
                      <LabeledInput label="Phone" value={parsedData.contact_info.phone} onChange={(v) => updateContact("phone", v)} />
                      <LabeledInput label="City" value={parsedData.contact_info.city} onChange={(v) => updateContact("city", v)} />
                      <LabeledInput label="State" value={parsedData.contact_info.state} onChange={(v) => updateContact("state", v)} />
                    </div>
                  </ReviewSection>
                )}

                {/* Employment */}
                {parsedData.employment_history.length > 0 && (
                  <ReviewSection title="Employment History" count={parsedData.employment_history.length}>
                    <div className="space-y-3">
                      {parsedData.employment_history.map((rec, i) => (
                        <div key={i} className="rounded-lg border border-border p-3 space-y-3 bg-background/50">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-medium text-muted-foreground">Employer {i + 1}</span>
                            <button onClick={() => removeArrayItem("employment_history", i)} className="text-muted-foreground hover:text-destructive"><X className="w-4 h-4" /></button>
                          </div>
                          <LabeledInput label="Employer" value={rec.employer_name} onChange={(v) => updateArrayItem("employment_history", i, "employer_name", v)} full />
                          <LabeledInput label="Job Title" value={rec.job_title} onChange={(v) => updateArrayItem("employment_history", i, "job_title", v)} full />
                          <div className="grid grid-cols-2 gap-3">
                            <LabeledInput label="Start Month" value={rec.start_month} onChange={(v) => updateArrayItem("employment_history", i, "start_month", v)} />
                            <LabeledInput label="Start Year" value={rec.start_year} onChange={(v) => updateArrayItem("employment_history", i, "start_year", v)} />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <LabeledInput label="End Month" value={rec.end_month} onChange={(v) => updateArrayItem("employment_history", i, "end_month", v)} />
                            <LabeledInput label="End Year" value={rec.end_year} onChange={(v) => updateArrayItem("employment_history", i, "end_year", v)} />
                          </div>
                          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                            <input type="checkbox" checked={rec.currently_employed || false} onChange={(e) => updateArrayItem("employment_history", i, "currently_employed", e.target.checked)} className="rounded border-input" />
                            Currently employed here
                          </label>
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1 block">Duties</Label>
                            <Textarea value={rec.duties || ""} onChange={(e) => updateArrayItem("employment_history", i, "duties", e.target.value)} placeholder="Main responsibilities..." className="min-h-[60px] text-sm" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </ReviewSection>
                )}

                {/* Skills */}
                {parsedData.skills.length > 0 && (
                  <ReviewSection title="Skills" count={parsedData.skills.length}>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {parsedData.skills.map((skill, i) => (
                          <span key={i} className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-full">
                            {skill}
                            <button onClick={() => removeArrayItem("skills", i)} className="text-primary/60 hover:text-primary"><X className="w-3.5 h-3.5" /></button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }} placeholder="Add a skill..." className="h-9 text-sm" />
                        <Button variant="outline" size="sm" onClick={addSkill}><Plus className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  </ReviewSection>
                )}

                {/* Education */}
                {parsedData.education.length > 0 && (
                  <ReviewSection title="Education" count={parsedData.education.length}>
                    <div className="space-y-3">
                      {parsedData.education.map((rec, i) => (
                        <div key={i} className="rounded-lg border border-border p-3 space-y-3 bg-background/50">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-medium text-muted-foreground">Education {i + 1}</span>
                            <button onClick={() => removeArrayItem("education", i)} className="text-muted-foreground hover:text-destructive"><X className="w-4 h-4" /></button>
                          </div>
                          <LabeledInput label="Institution" value={rec.institution_name} onChange={(v) => updateArrayItem("education", i, "institution_name", v)} full />
                          <div className="grid grid-cols-2 gap-3">
                            <LabeledInput label="Degree" value={rec.degree_or_credential} onChange={(v) => updateArrayItem("education", i, "degree_or_credential", v)} />
                            <LabeledInput label="Field of Study" value={rec.field_of_study} onChange={(v) => updateArrayItem("education", i, "field_of_study", v)} />
                          </div>
                          <LabeledInput label="Graduation Year" value={rec.graduation_year} onChange={(v) => updateArrayItem("education", i, "graduation_year", v)} />
                        </div>
                      ))}
                    </div>
                  </ReviewSection>
                )}

                {/* Certifications */}
                {parsedData.certifications.length > 0 && (
                  <ReviewSection title="Certifications" count={parsedData.certifications.length}>
                    <div className="space-y-3">
                      {parsedData.certifications.map((rec, i) => (
                        <div key={i} className="rounded-lg border border-border p-3 space-y-3 bg-background/50">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-medium text-muted-foreground">Credential {i + 1}</span>
                            <button onClick={() => removeArrayItem("certifications", i)} className="text-muted-foreground hover:text-destructive"><X className="w-4 h-4" /></button>
                          </div>
                          <LabeledInput label="Name" value={rec.credential_name} onChange={(v) => updateArrayItem("certifications", i, "credential_name", v)} full />
                          <LabeledInput label="Issuing Organization" value={rec.issuing_organization} onChange={(v) => updateArrayItem("certifications", i, "issuing_organization", v)} full />
                        </div>
                      ))}
                    </div>
                  </ReviewSection>
                )}
              </div>

              <div className="sticky bottom-0 bg-background py-3 border-t border-border safe-bottom px-4">
                <Button onClick={handleContinue} className="w-full h-14 text-base font-semibold">
                  Continue
                  <ArrowRight className="w-5 h-5 ml-1" />
                </Button>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// --- Small helper components ---
function ReviewSection({ title, count, children }) {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="flex items-center gap-2 p-4 pb-2">
        <span className="font-semibold text-foreground text-sm">{title}</span>
        {count > 0 && <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{count}</span>}
      </div>
      <div className="px-4 pb-4">{children}</div>
    </div>
  );
}

function LabeledInput({ label, value, onChange, placeholder, full }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <Label className="text-xs text-muted-foreground mb-1 block">{label}</Label>
      <Input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-9 text-sm" />
    </div>
  );
}