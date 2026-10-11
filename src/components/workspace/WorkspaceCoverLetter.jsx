import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PenTool, Sparkles, Loader2, CheckCircle, FileText } from "lucide-react";

/**
 * Receives shared profile data as a prop instead of fetching it independently,
 * so the workspace does not issue a duplicate profile fetch.
 */
export default function WorkspaceCoverLetter({ job, profileData }) {
  const [coverLetter, setCoverLetter] = useState("");
  const [generating, setGenerating] = useState(false);

  const coverLetterDocs = (profileData?.documents || []).filter((d) => d.document_type === "Cover Letter");

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const profile = profileData?.profile;
      const employment = profileData?.employmentRecords?.slice(0, 3) || [];
      const skills = profileData?.skills?.slice(0, 5) || [];
      const education = profileData?.educationRecords?.slice(0, 2) || [];

      const prompt = `Write a professional cover letter for this job application. Use ONLY the information provided below. Do not invent any qualifications, dates, employers, or experiences.

JOB:
- Title: ${job.job_title}
- Employer: ${job.employer_name}
- Description: ${job.full_description || job.responsibilities || ""}

APPLICANT INFORMATION:
- Name: ${[profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Applicant"}
- City: ${profile?.city || ""}, ${profile?.state || ""}
- Phone: ${profile?.phone || ""}
- Email: ${profile?.email || ""}
- Professional Summary: ${profile?.professional_summary || ""}

EMPLOYMENT HISTORY:
${employment.map((e) => `- ${e.job_title} at ${e.employer_name} (${e.start_year || ""}\u2013${e.end_year || "present"}): ${e.duties || ""}`).join("\n")}

SKILLS:
${skills.map((s) => `- ${s.skill_name} (${s.proficiency_level || ""})`).join("\n")}

EDUCATION:
${education.map((e) => `- ${e.degree_or_credential || ""} from ${e.institution_name}`).join("\n")}

Write a warm, professional cover letter. Keep it concise (3-4 paragraphs). Address it to the hiring team. Focus on how the applicant's experience matches the job.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: { type: "object", properties: { cover_letter: { type: "string" } } },
      });

      setCoverLetter(result.cover_letter || result);
    } catch (err) {
      console.error("Failed to generate cover letter:", err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-center gap-2 mb-3">
        <PenTool className="w-5 h-5 text-primary" />
        <h2 className="font-bold text-foreground">Cover Letter</h2>
      </div>

      {coverLetterDocs.length > 0 && (
        <div className="space-y-2 mb-3">
          {coverLetterDocs.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm text-foreground truncate">{doc.document_name}</span>
              </div>
              <span className="flex items-center gap-1 text-sm text-success font-medium flex-shrink-0">
                <CheckCircle className="w-4 h-4" /> Ready
              </span>
            </div>
          ))}
        </div>
      )}

      {!coverLetter ? (
        <Button variant="outline" onClick={handleGenerate} disabled={generating} className="w-full h-12">
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Drafting cover letter...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Draft a Cover Letter
            </>
          )}
        </Button>
      ) : (
        <div className="space-y-3">
          <Textarea
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            className="min-h-[200px] text-sm"
          />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleGenerate} disabled={generating}>
              Regenerate
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setCoverLetter("")}>
              Clear
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            This is a draft. Review and edit it before using it in your application.
          </p>
        </div>
      )}
    </div>
  );
}