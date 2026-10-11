import React from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const inputClass =
  "w-full h-10 rounded-lg border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";
const textareaClass =
  "w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

function Field({ label, required, children, full }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <Label className="mb-1.5 block text-sm font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="space-y-3">
      <h3 className="font-heading font-semibold text-foreground border-b border-border pb-1.5">
        {title}
      </h3>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Temporary", "Seasonal", "Internship", "Contract"];
const REMOTE_TYPES = ["On-site", "Hybrid", "Remote", "Not specified"];
const PAY_PERIODS = ["hourly", "annual", "monthly", "weekly"];
const APP_METHODS = [
  "External website",
  "Email employer",
  "Call employer",
  "Apply in person",
  "Employer instructions",
  "Future Apply Once employer application",
];

export default function LocalJobForm({ formData, setFormData, employerSources }) {
  const update = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-5">
      <Section title="Employer">
        <Field label="Employer source">
          <select
            value={formData.employer_source_id || ""}
            onChange={(e) => {
              const src = employerSources.find((s) => s.id === e.target.value);
              if (src) {
                setFormData((prev) => ({
                  ...prev,
                  employer_source_id: src.id,
                  employer_name: src.employer_name,
                  industry: src.industry || prev.industry,
                }));
              } else {
                update("employer_source_id", "");
              }
            }}
            className={inputClass}
          >
            <option value="">Custom employer (type below)</option>
            {employerSources.map((s) => (
              <option key={s.id} value={s.id}>{s.employer_name}</option>
            ))}
          </select>
        </Field>
        <Field label="Employer name" required>
          <input
            value={formData.employer_name || ""}
            onChange={(e) => update("employer_name", e.target.value)}
            className={inputClass}
            placeholder="e.g. Downtown Bistro"
          />
        </Field>
        <Field label="Industry / category">
          <input
            value={formData.industry || ""}
            onChange={(e) => update("industry", e.target.value)}
            className={inputClass}
            placeholder="e.g. Hospitality"
          />
        </Field>
        <Field label="Contact name">
          <input
            value={formData.source_name || ""}
            onChange={(e) => update("source_name", e.target.value)}
            className={inputClass}
            placeholder="Hiring manager name"
          />
        </Field>
      </Section>

      <Section title="Job Details">
        <Field label="Job title" required>
          <input
            value={formData.job_title || ""}
            onChange={(e) => update("job_title", e.target.value)}
            className={inputClass}
            placeholder="e.g. Line Cook"
          />
        </Field>
        <Field label="Employment type">
          <select
            value={formData.employment_type || ""}
            onChange={(e) => update("employment_type", e.target.value)}
            className={inputClass}
          >
            <option value="">Select type</option>
            {EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Job description" full>
          <textarea
            value={formData.full_description || ""}
            onChange={(e) => update("full_description", e.target.value)}
            className={`${textareaClass} min-h-[80px]`}
            placeholder="Describe the role..."
          />
        </Field>
        <Field label="Duties" full>
          <textarea
            value={formData.responsibilities || ""}
            onChange={(e) => update("responsibilities", e.target.value)}
            className={`${textareaClass} min-h-[60px]`}
            placeholder="Key responsibilities and duties..."
          />
        </Field>
        <Field label="Requirements" full>
          <textarea
            value={formData.minimum_qualifications || ""}
            onChange={(e) => update("minimum_qualifications", e.target.value)}
            className={`${textareaClass} min-h-[60px]`}
            placeholder="Minimum qualifications..."
          />
        </Field>
        <Field label="Preferred qualifications" full>
          <textarea
            value={formData.preferred_qualifications || ""}
            onChange={(e) => update("preferred_qualifications", e.target.value)}
            className={`${textareaClass} min-h-[60px]`}
            placeholder="Preferred qualifications..."
          />
        </Field>
      </Section>

      <Section title="Location">
        <Field label="Street address / work location" full>
          <input
            value={formData.location || ""}
            onChange={(e) => update("location", e.target.value)}
            className={inputClass}
            placeholder="123 Main Street"
          />
        </Field>
        <Field label="City">
          <input
            value={formData.city || ""}
            onChange={(e) => update("city", e.target.value)}
            className={inputClass}
            placeholder="Pittsburgh"
          />
        </Field>
        <Field label="State">
          <input
            value={formData.state || ""}
            onChange={(e) => update("state", e.target.value)}
            className={inputClass}
            placeholder="PA"
          />
        </Field>
        <Field label="ZIP code">
          <input
            value={formData.postal_code || ""}
            onChange={(e) => update("postal_code", e.target.value)}
            className={inputClass}
            placeholder="15219"
          />
        </Field>
        <Field label="Remote / hybrid / on-site">
          <select
            value={formData.remote_type || "Not specified"}
            onChange={(e) => update("remote_type", e.target.value)}
            className={inputClass}
          >
            {REMOTE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
      </Section>

      <Section title="Compensation & Schedule">
        <Field label="Pay minimum">
          <input
            type="number"
            value={formData.salary_min ?? ""}
            onChange={(e) => update("salary_min", e.target.value ? Number(e.target.value) : undefined)}
            className={inputClass}
            placeholder="15"
          />
        </Field>
        <Field label="Pay maximum">
          <input
            type="number"
            value={formData.salary_max ?? ""}
            onChange={(e) => update("salary_max", e.target.value ? Number(e.target.value) : undefined)}
            className={inputClass}
            placeholder="18"
          />
        </Field>
        <Field label="Pay period">
          <select
            value={formData.salary_period || ""}
            onChange={(e) => update("salary_period", e.target.value)}
            className={inputClass}
          >
            <option value="">Select period</option>
            {PAY_PERIODS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="Work schedule">
          <input
            value={formData.schedule || ""}
            onChange={(e) => update("schedule", e.target.value)}
            className={inputClass}
            placeholder="Mon-Fri 9am-5pm"
          />
        </Field>
        <Field label="Benefits (semicolon-separated)" full>
          <input
            value={(formData.benefits || []).join("; ")}
            onChange={(e) => update("benefits", e.target.value.split(";").map((s) => s.trim()).filter(Boolean))}
            className={inputClass}
            placeholder="Free meals; health insurance; paid time off"
          />
        </Field>
      </Section>

      <Section title="Application Method">
        <Field label="Application method">
          <select
            value={formData.application_method || ""}
            onChange={(e) => update("application_method", e.target.value)}
            className={inputClass}
          >
            <option value="">Select method</option>
            {APP_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </Field>
        <Field label="External application URL">
          <input
            value={formData.posting_url || ""}
            onChange={(e) => update("posting_url", e.target.value)}
            className={inputClass}
            placeholder="https://employer.com/apply"
          />
        </Field>
        <Field label="Application email">
          <input
            type="email"
            value={formData.application_email || ""}
            onChange={(e) => update("application_email", e.target.value)}
            className={inputClass}
            placeholder="hiring@employer.com"
          />
        </Field>
        <Field label="Application phone">
          <input
            type="tel"
            value={formData.application_phone || ""}
            onChange={(e) => update("application_phone", e.target.value)}
            className={inputClass}
            placeholder="412-555-0100"
          />
        </Field>
        <Field label="In-person application instructions" full>
          <textarea
            value={formData.application_instructions || ""}
            onChange={(e) => update("application_instructions", e.target.value)}
            className={`${textareaClass} min-h-[60px]`}
            placeholder="Apply in person at 123 Main St, Monday-Friday 9am-5pm. Bring a photo ID."
          />
        </Field>
      </Section>

      <Section title="Additional Information">
        <Field label="Date posted">
          <input
            type="date"
            value={formData.posting_date || ""}
            onChange={(e) => update("posting_date", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Closing date">
          <input
            type="date"
            value={formData.application_deadline || ""}
            onChange={(e) => update("application_deadline", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Number of openings">
          <input
            type="number"
            value={formData.number_of_openings ?? ""}
            onChange={(e) => update("number_of_openings", e.target.value ? Number(e.target.value) : undefined)}
            className={inputClass}
            placeholder="1"
          />
        </Field>
        <Field label="Background / license requirements" full>
          <input
            value={formData.background_requirements || ""}
            onChange={(e) => update("background_requirements", e.target.value)}
            className={inputClass}
            placeholder="e.g. ServSafe certification, clean driving record"
          />
        </Field>
        <div className="flex items-center justify-between col-span-2 py-1">
          <Label className="text-sm">Apprenticeship or training available</Label>
          <Switch
            checked={!!formData.apprenticeship_available}
            onCheckedChange={(v) => update("apprenticeship_available", v)}
          />
        </div>
        <div className="flex items-center justify-between col-span-2 py-1">
          <Label className="text-sm">Second-chance friendly (employer-confirmed)</Label>
          <Switch
            checked={!!formData.second_chance_friendly}
            onCheckedChange={(v) => update("second_chance_friendly", v)}
          />
        </div>
      </Section>
    </div>
  );
}