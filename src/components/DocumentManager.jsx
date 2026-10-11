import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { updateProfileCompletion } from "@/lib/profileUtils";
import { findDuplicate } from "@/lib/resumeDedup";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Loader2, Upload, FileText, Trash2, ChevronLeft, Check, AlertCircle } from "lucide-react";
import SuccessBanner from "@/components/profile/SuccessBanner";

const DOCUMENT_TYPES = ["Resume", "Cover Letter", "Transcript", "License", "Certification", "Reference List", "Work Sample", "Other"];

export default function DocumentManager() {
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState("Resume");
  const [sensitive, setSensitive] = useState(false);
  const [extractionStatus, setExtractionStatus] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    setLoading(true);
    try {
      const docs = await base44.entities.UserDocument.filter({}, "-created_date", 50);
      setDocuments(docs);
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      // Upload the file
      const result = await base44.integrations.Core.UploadFile({ file: selectedFile });
      
      // Create the document record
      const doc = await base44.entities.UserDocument.create({
        document_name: docName || selectedFile.name,
        document_type: docType,
        file_url: result.file_url,
        upload_date: new Date().toISOString(),
        processing_status: "Completed",
        extraction_status: docType === "Resume" ? "In Progress" : "Not Started",
        verification_status: "User Entered",
        contains_sensitive_information: sensitive,
      });

      setDocuments([doc, ...documents]);
      setSelectedFile(null);
      setDocName("");
      setSensitive(false);

      // If it's a resume, try extraction
      if (docType === "Resume") {
        tryExtractData(doc, result.file_url);
      }

      await updateProfileCompletion();
    } catch (err) {
      console.error("Upload failed:", err);
      alert("We couldn't upload your file. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const tryExtractData = async (doc, fileUrl) => {
    try {
      const extraction = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: fileUrl,
        json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
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
                  start_date: { type: "string" },
                  end_date: { type: "string" },
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
                  degree: { type: "string" },
                  field_of_study: { type: "string" },
                  graduation_year: { type: "string" },
                },
              },
            },
            skills: { type: "array", items: { type: "string" } },
            certifications: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  issuer: { type: "string" },
                },
              },
            },
          },
        },
      });

      if (extraction.status === "success" && extraction.output) {
        setExtractionStatus((prev) => ({ ...prev, [doc.id]: extraction.output }));
        await base44.entities.UserDocument.update(doc.id, {
          extraction_status: "Completed",
          verification_status: "Needs Confirmation",
        });
      } else {
        await base44.entities.UserDocument.update(doc.id, {
          extraction_status: "Failed",
        });
      }
    } catch (err) {
      console.error("Extraction failed:", err);
      await base44.entities.UserDocument.update(doc.id, {
        extraction_status: "Failed",
      });
    }
  };

  const handleDelete = async (id) => {
    await base44.entities.UserDocument.delete(id);
    setDocuments(documents.filter((d) => d.id !== id));
    await updateProfileCompletion();
  };

  // Filter an array of extracted records against existing account records
  // and intra-batch duplicates, returning only genuinely new records.
  // Uses the established findDuplicate rules from resumeDedup.js.
  async function deduplicateExtracted(entityName, rawRecords, mapFn) {
    if (!rawRecords || rawRecords.length === 0) {
      return { toCreate: [], skipped: 0 };
    }
    const existing = await base44.entities[entityName].filter({}, "-created_date", 500);
    // Seed with account records, then append each accepted record so the
    // next extracted record in the same batch is checked against it.
    const knownRecords = [...existing];
    const toCreate = [];
    for (const raw of rawRecords) {
      const record = mapFn(raw);
      const dup = findDuplicate(entityName, record, knownRecords);
      if (!dup) {
        toCreate.push(record);
        knownRecords.push(record);
      }
    }
    return { toCreate, skipped: rawRecords.length - toCreate.length };
  }

  const handleConfirmExtraction = async (docId, extractedData) => {
    const added = { EmploymentRecord: 0, EducationRecord: 0, Skill: 0 };
    const skipped = { EmploymentRecord: 0, EducationRecord: 0, Skill: 0 };

    // Employment
    const empResult = await deduplicateExtracted(
      "EmploymentRecord",
      extractedData.employment_history,
      (e) => ({
        employer_name: e.employer_name || "",
        job_title: e.job_title || "",
        duties: e.duties || "",
        verified_status: "Needs Confirmation",
        source_document_id: docId,
      })
    );
    if (empResult.toCreate.length > 0) {
      await base44.entities.EmploymentRecord.bulkCreate(empResult.toCreate);
    }
    added.EmploymentRecord = empResult.toCreate.length;
    skipped.EmploymentRecord = empResult.skipped;

    // Education
    const eduResult = await deduplicateExtracted(
      "EducationRecord",
      extractedData.education,
      (e) => ({
        institution_name: e.institution_name || "",
        degree_or_credential: e.degree || "",
        field_of_study: e.field_of_study || "",
        graduation_year: e.graduation_year || "",
        verified_status: "Needs Confirmation",
        source_document_id: docId,
      })
    );
    if (eduResult.toCreate.length > 0) {
      await base44.entities.EducationRecord.bulkCreate(eduResult.toCreate);
    }
    added.EducationRecord = eduResult.toCreate.length;
    skipped.EducationRecord = eduResult.skipped;

    // Skills
    const skillResult = await deduplicateExtracted(
      "Skill",
      extractedData.skills,
      (s) => ({
        skill_name: s,
        source: "Document Extracted",
        confirmed_by_user: false,
      })
    );
    if (skillResult.toCreate.length > 0) {
      await base44.entities.Skill.bulkCreate(skillResult.toCreate);
    }
    added.Skill = skillResult.toCreate.length;
    skipped.Skill = skillResult.skipped;

    const totalAdded = added.EmploymentRecord + added.EducationRecord + added.Skill;
    const totalSkipped = skipped.EmploymentRecord + skipped.EducationRecord + skipped.Skill;

    await base44.entities.UserDocument.update(docId, {
      verification_status: "Document Extracted",
    });

    setExtractionStatus((prev) => {
      const next = { ...prev };
      delete next[docId];
      return next;
    });

    const parts = [];
    if (totalAdded > 0) {
      const breakdown = [
        added.EmploymentRecord && `${added.EmploymentRecord} job${added.EmploymentRecord === 1 ? "" : "s"}`,
        added.EducationRecord && `${added.EducationRecord} school${added.EducationRecord === 1 ? "" : "s"}`,
        added.Skill && `${added.Skill} skill${added.Skill === 1 ? "" : "s"}`,
      ].filter(Boolean);
      parts.push(`Added ${breakdown.join(", ")}.`);
    }
    if (totalSkipped > 0) {
      parts.push(`Skipped ${totalSkipped} duplicate${totalSkipped === 1 ? "" : "s"}.`);
    }
    if (totalAdded === 0 && totalSkipped === 0) {
      parts.push("No new records found in this document.");
    }
    showSuccess(parts.join(" "));

    await updateProfileCompletion();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="py-6 space-y-5 animate-fade-in">
      <button
        onClick={() => window.history.back()}
        className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="w-5 h-5" />
        Back to Profile
      </button>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Documents</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Upload your resume and other files. We'll keep them secure and private.
        </p>
      </div>

      {/* Upload area */}
      <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="doc-name">Document name</Label>
          <input
            id="doc-name"
            type="text"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            placeholder="Example: My Resume 2024"
            className="flex h-12 w-full rounded-md border border-input bg-transparent px-3 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        <div className="space-y-2">
          <Label>Document type</Label>
          <Select value={docType} onValueChange={setDocType}>
            <SelectTrigger className="h-12 text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Choose a file</Label>
          <label className="flex items-center justify-center gap-2 w-full h-20 rounded-xl border-2 border-dashed border-border hover:border-primary/40 cursor-pointer transition-colors">
            <Upload className="w-5 h-5 text-muted-foreground" />
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
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={sensitive}
            onChange={(e) => setSensitive(e.target.checked)}
            className="mt-0.5 w-5 h-5 rounded border-input accent-primary"
          />
          <span className="text-sm text-muted-foreground">
            This document contains sensitive information
          </span>
        </label>

        <Button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="w-full h-12 font-semibold"
        >
          {uploading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 mr-1" />
              Upload Document
            </>
          )}
        </Button>
      </div>

      {successMessage && <SuccessBanner message={successMessage} />}

      {/* Document list */}
      {documents.length > 0 ? (
        <div className="space-y-3">
          <h2 className="font-bold text-foreground">Your Documents</h2>
          {documents.map((doc) => (
            <div key={doc.id} className="bg-card rounded-2xl border border-border p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{doc.document_name}</p>
                  <p className="text-sm text-muted-foreground">{doc.document_type}</p>
                  {doc.extraction_status === "Completed" && doc.verification_status === "Needs Confirmation" && (
                    <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-warning/10 text-warning">
                      Review extracted data
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                  aria-label="Delete document"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Extraction review */}
              {extractionStatus[doc.id] && (
                <div className="mt-4 p-3 rounded-xl border border-primary/30 bg-card space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-primary" />
                    <p className="text-sm font-medium text-foreground">
                      We found this information in your document. Please review it.
                    </p>
                  </div>
                  {extractionStatus[doc.id].name && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Name:</span> {extractionStatus[doc.id].name}
                    </p>
                  )}
                  {extractionStatus[doc.id].employment_history?.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Jobs found:</span> {extractionStatus[doc.id].employment_history.length}
                    </p>
                  )}
                  {extractionStatus[doc.id].skills?.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Skills found:</span> {extractionStatus[doc.id].skills.length}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleConfirmExtraction(doc.id, extractionStatus[doc.id])}
                      className="h-9"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Add to Profile
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setExtractionStatus((prev) => {
                          const next = { ...prev };
                          delete next[doc.id];
                          return next;
                        });
                      }}
                      className="h-9"
                    >
                      Ignore
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-dashed border-border p-8 text-center">
          <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">
            No documents yet. Upload your resume to get started.
          </p>
        </div>
      )}
    </div>
  );
}