import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  ClipboardPaste,
  Link as LinkIcon,
  FileSpreadsheet,
  PenLine,
  Sparkles,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

const JOB_SCHEMA = {
  type: "object",
  properties: {
    job_title: { type: "string" },
    employer_name: { type: "string" },
    city: { type: "string" },
    state: { type: "string" },
    employment_type: { type: "string" },
    remote_type: { type: "string" },
    salary_text: { type: "string" },
    full_description: { type: "string" },
    responsibilities: { type: "string" },
    minimum_qualifications: { type: "string" },
    preferred_qualifications: { type: "string" },
    required_education: { type: "string" },
    required_experience: { type: "string" },
    required_credentials: { type: "string" },
    posting_url: { type: "string" },
    application_deadline: { type: "string" },
  },
};

const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Temporary", "Contract", "Seasonal"];
const REMOTE_TYPES = ["On-site", "Hybrid", "Remote", "Not specified"];

export default function ImportJobs() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("paste");
  const [pastedText, setPastedText] = useState("");
  const [url, setUrl] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [jobForm, setJobForm] = useState(null);
  const [csvFile, setCsvFile] = useState(null);
  const [csvImporting, setCsvImporting] = useState(false);

  const handleExtract = async () => {
    if (!pastedText.trim()) return;
    setExtracting(true);
    setDuplicateWarning(null);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Extract job posting information from the following text. Fill in as many fields as possible. If a field is not mentioned in the text, leave it empty. Do not make up information.\n\nText:\n${pastedText}`,
        response_json_schema: JOB_SCHEMA,
      });

      setJobForm({
        job_title: result.job_title || "",
        employer_name: result.employer_name || "",
        city: result.city || "",
        state: result.state || "",
        employment_type: result.employment_type || "",
        remote_type: result.remote_type || "Not specified",
        salary_text: result.salary_text || "",
        full_description: result.full_description || "",
        responsibilities: result.responsibilities || "",
        minimum_qualifications: result.minimum_qualifications || "",
        preferred_qualifications: result.preferred_qualifications || "",
        required_education: result.required_education || "",
        required_experience: result.required_experience || "",
        required_credentials: result.required_credentials || "",
        posting_url: result.posting_url || "",
        application_deadline: result.application_deadline || "",
        status: "Draft",
        source_name: "Pasted Text",
      });
      await checkDuplicates(setJobForm ? result : null);
    } catch (err) {
      console.error("Extraction failed:", err);
      alert("We couldn't extract job information. Please try the manual form.");
    } finally {
      setExtracting(false);
    }
  };

  const checkDuplicates = async (data) => {
    if (!data) return;
    try {
      const existing = await base44.entities.JobPosting.filter({}, "-created_date", 200);
      const dup = existing.find((j) => {
        const sameEmployer = j.employer_name?.toLowerCase() === data.employer_name?.toLowerCase();
        const sameTitle = j.job_title?.toLowerCase() === data.job_title?.toLowerCase();
        const sameLocation = j.city?.toLowerCase() === data.city?.toLowerCase();
        const sameUrl = data.posting_url && j.posting_url === data.posting_url;
        return (sameEmployer && sameTitle && sameLocation) || sameUrl;
      });
      if (dup) {
        setDuplicateWarning(`This may be a duplicate of: "${dup.job_title}" at ${dup.employer_name}`);
      } else {
        setDuplicateWarning(null);
      }
    } catch {
      // Ignore duplicate check errors
    }
  };

  const handleSave = async () => {
    if (!jobForm?.job_title || !jobForm?.employer_name) {
      alert("Job title and employer name are required.");
      return;
    }
    setSaving(true);
    try {
      await base44.entities.JobPosting.create({
        ...jobForm,
        posting_date: new Date().toISOString().split("T")[0],
      });
      navigate("/admin/jobs");
    } catch (err) {
      console.error("Failed to save job:", err);
      alert("Failed to save the job posting. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleUrlImport = async () => {
    if (!url.trim()) return;
    setExtracting(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `A user wants to import a job from this URL: ${url}. Create a basic job posting record. The posting_url should be set to this URL. Leave other fields empty for the admin to fill in.`,
        response_json_schema: JOB_SCHEMA,
      });
      setJobForm({
        ...result,
        posting_url: url,
        status: "Draft",
        source_name: "URL Import",
      });
      setTab("review");
    } catch (err) {
      console.error("URL import failed:", err);
      // Fallback: just create a form with the URL
      setJobForm({
        job_title: "",
        employer_name: "",
        posting_url: url,
        status: "Draft",
        source_name: "URL Import",
        remote_type: "Not specified",
      });
      setTab("review");
    } finally {
      setExtracting(false);
    }
  };

  const handleCsvImport = async () => {
    if (!csvFile) return;
    setCsvImporting(true);
    try {
      const upload = await base44.integrations.Core.UploadFile({ file: csvFile });
      const extraction = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: upload.file_url,
        json_schema: {
          type: "object",
          properties: {
            jobs: {
              type: "array",
              items: JOB_SCHEMA,
            },
          },
        },
      });

      if (extraction.status === "success" && extraction.output?.jobs) {
        const jobs = extraction.output.jobs.filter((j) => j.job_title && j.employer_name);
        await base44.entities.JobPosting.bulkCreate(
          jobs.map((j) => ({
            ...j,
            status: "Draft",
            source_name: "CSV Import",
            posting_date: new Date().toISOString().split("T")[0],
          }))
        );
        alert(`${jobs.length} job(s) imported as drafts. Review them in Job Postings.`);
        navigate("/admin/jobs");
      } else {
        alert("We couldn't read the CSV file. Please check the format and try again.");
      }
    } catch (err) {
      console.error("CSV import failed:", err);
      alert("CSV import failed. Please try the manual form.");
    } finally {
      setCsvImporting(false);
    }
  };

  const startManual = () => {
    setJobForm({
      job_title: "",
      employer_name: "",
      city: "",
      state: "",
      employment_type: "",
      remote_type: "Not specified",
      salary_text: "",
      full_description: "",
      minimum_qualifications: "",
      required_education: "",
      required_experience: "",
      required_credentials: "",
      posting_url: "",
      application_deadline: "",
      status: "Draft",
      source_name: "Manual Entry",
    });
    setTab("review");
  };

  // Review/Edit form
  if (jobForm && (tab === "review" || tab === "paste" || tab === "url")) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Review Job Posting</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Review the extracted information. Edit any fields before saving as a draft.
          </p>
        </div>

        {duplicateWarning && (
          <div className="bg-warning/5 border border-warning/20 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Possible Duplicate</p>
              <p className="text-sm text-muted-foreground">{duplicateWarning}</p>
            </div>
          </div>
        )}

        <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
          <div>
            <Label>Job Title *</Label>
            <Input
              value={jobForm.job_title}
              onChange={(e) => setJobForm({ ...jobForm, job_title: e.target.value })}
              className="h-11"
            />
          </div>
          <div>
            <Label>Employer *</Label>
            <Input
              value={jobForm.employer_name}
              onChange={(e) => setJobForm({ ...jobForm, employer_name: e.target.value })}
              className="h-11"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>City</Label>
              <Input
                value={jobForm.city || ""}
                onChange={(e) => setJobForm({ ...jobForm, city: e.target.value })}
                className="h-11"
              />
            </div>
            <div>
              <Label>State</Label>
              <Input
                value={jobForm.state || ""}
                onChange={(e) => setJobForm({ ...jobForm, state: e.target.value })}
                className="h-11"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Employment Type</Label>
              <select
                value={jobForm.employment_type || ""}
                onChange={(e) => setJobForm({ ...jobForm, employment_type: e.target.value })}
                className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Select type</option>
                {EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <Label>Remote Type</Label>
              <select
                value={jobForm.remote_type || "Not specified"}
                onChange={(e) => setJobForm({ ...jobForm, remote_type: e.target.value })}
                className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {REMOTE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <Label>Salary Text</Label>
            <Input
              value={jobForm.salary_text || ""}
              onChange={(e) => setJobForm({ ...jobForm, salary_text: e.target.value })}
              className="h-11"
              placeholder="Example: $20-25/hr"
            />
          </div>
          <div>
            <Label>Posting URL</Label>
            <Input
              value={jobForm.posting_url || ""}
              onChange={(e) => setJobForm({ ...jobForm, posting_url: e.target.value })}
              className="h-11"
            />
          </div>
          <div>
            <Label>Application Deadline</Label>
            <Input
              type="date"
              value={jobForm.application_deadline || ""}
              onChange={(e) => setJobForm({ ...jobForm, application_deadline: e.target.value })}
              className="h-11"
            />
          </div>
          <div>
            <Label>Full Description</Label>
            <textarea
              value={jobForm.full_description || ""}
              onChange={(e) => setJobForm({ ...jobForm, full_description: e.target.value })}
              className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div>
            <Label>Minimum Qualifications</Label>
            <textarea
              value={jobForm.minimum_qualifications || ""}
              onChange={(e) => setJobForm({ ...jobForm, minimum_qualifications: e.target.value })}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label>Required Education</Label>
              <Input
                value={jobForm.required_education || ""}
                onChange={(e) => setJobForm({ ...jobForm, required_education: e.target.value })}
                className="h-11"
              />
            </div>
            <div>
              <Label>Required Experience</Label>
              <Input
                value={jobForm.required_experience || ""}
                onChange={(e) => setJobForm({ ...jobForm, required_experience: e.target.value })}
                className="h-11"
              />
            </div>
            <div>
              <Label>Required Credentials</Label>
              <Input
                value={jobForm.required_credentials || ""}
                onChange={(e) => setJobForm({ ...jobForm, required_credentials: e.target.value })}
                className="h-11"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            className="flex-1 h-12"
            onClick={() => {
              setJobForm(null);
              setTab("paste");
            }}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 h-12 font-semibold"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="w-5 h-5 mr-2" />
            )}
            Save as Draft
          </Button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "paste", label: "Paste Text", icon: ClipboardPaste },
    { id: "url", label: "URL", icon: LinkIcon },
    { id: "manual", label: "Manual", icon: PenLine },
    { id: "csv", label: "CSV", icon: FileSpreadsheet },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Import Jobs</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Add job postings by pasting text, entering a URL, filling a form, or uploading a CSV.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id);
              setJobForm(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground border border-border hover:text-foreground"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Paste Text */}
      {tab === "paste" && (
        <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
          <div>
            <Label>Paste the job description</Label>
            <p className="text-sm text-muted-foreground mt-1 mb-3">
              Copy the text from any job posting and paste it here. We'll extract the key information for you to review.
            </p>
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste the full job description here..."
              className="flex min-h-[200px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <Button
            onClick={handleExtract}
            disabled={!pastedText.trim() || extracting}
            className="w-full h-12 font-semibold"
          >
            {extracting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Extracting...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Extract Job Information
              </>
            )}
          </Button>
        </div>
      )}

      {/* URL */}
      {tab === "url" && (
        <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
          <div>
            <Label>Job posting URL</Label>
            <p className="text-sm text-muted-foreground mt-1 mb-3">
              Enter the link to the job posting. We'll create a draft with the URL for you to fill in.
            </p>
            <Input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/jobs/123"
              className="h-12"
            />
          </div>
          <Button
            onClick={handleUrlImport}
            disabled={!url.trim() || extracting}
            className="w-full h-12 font-semibold"
          >
            {extracting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <LinkIcon className="w-5 h-5 mr-2" />
                Import from URL
              </>
            )}
          </Button>
        </div>
      )}

      {/* Manual */}
      {tab === "manual" && (
        <div className="bg-card rounded-2xl border border-dashed border-border p-8 text-center">
          <PenLine className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm mb-4">
            Fill in the job details manually.
          </p>
          <Button onClick={startManual} className="h-12">
            Start Manual Entry
          </Button>
        </div>
      )}

      {/* CSV */}
      {tab === "csv" && (
        <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
          <div>
            <Label>Upload a CSV file</Label>
            <p className="text-sm text-muted-foreground mt-1 mb-3">
              Upload a spreadsheet with job postings. Required columns: job_title, employer_name. Jobs will be imported as drafts.
            </p>
            <label className="flex items-center justify-center gap-2 w-full h-24 rounded-xl border-2 border-dashed border-border hover:border-primary/40 cursor-pointer transition-colors">
              <FileSpreadsheet className="w-6 h-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {csvFile ? csvFile.name : "Tap to select a CSV file"}
              </span>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => setCsvFile(e.target.files[0])}
              />
            </label>
          </div>
          <Button
            onClick={handleCsvImport}
            disabled={!csvFile || csvImporting}
            className="w-full h-12 font-semibold"
          >
            {csvImporting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-5 h-5 mr-2" />
                Import CSV
              </>
            )}
          </Button>
        </div>
      )}

    </div>
  );
}