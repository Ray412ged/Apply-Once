import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const inputClass =
  "w-full h-10 rounded-lg border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const PROVIDER_TYPES = [
  "Manual",
  "CSV Import",
  "Greenhouse",
  "Lever",
  "iSolved Hire",
  "Structured Career Page",
  "Future Employer Portal",
];

const EMPLOYER_TYPES = [
  "Restaurant", "University", "Construction", "Nonprofit", "Small Business",
  "Workforce Partner", "Government", "Healthcare", "Retail", "Manufacturing", "Other",
];

export default function EmployerSourceForm({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(
    initial || {
      employer_name: "",
      employer_type: "Other",
      industry: "",
      website_url: "",
      careers_page_url: "",
      provider_type: "Manual",
      provider_identifier: "",
      city: "",
      state: "",
      postal_code: "",
      service_area: "",
      logo_url: "",
      contact_name: "",
      contact_email: "",
      contact_phone: "",
      notes: "",
      approved: false,
    }
  );

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = () => {
    if (!form.employer_name) return;
    onSave(form);
  };

  const providerLabel = (() => {
    switch (form.provider_type) {
      case "Greenhouse": return "Greenhouse board token";
      case "Lever": return "Lever site name";
      case "iSolved Hire": return "iSolved Hire subdomain";
      case "Structured Career Page": return "Career page URL";
      default: return "Provider identifier";
    }
  })();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Employer Source" : "Add Employer Source"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="mb-1.5 block text-sm">Employer name *</Label>
            <Input
              value={form.employer_name}
              onChange={(e) => update("employer_name", e.target.value)}
              className={inputClass}
              placeholder="e.g. Downtown Bistro"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block text-sm">Employer type</Label>
              <select
                value={form.employer_type}
                onChange={(e) => update("employer_type", e.target.value)}
                className={inputClass}
              >
                {EMPLOYER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">Industry</Label>
              <Input
                value={form.industry}
                onChange={(e) => update("industry", e.target.value)}
                className={inputClass}
                placeholder="e.g. Hospitality"
              />
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block text-sm">Provider type</Label>
            <select
              value={form.provider_type}
              onChange={(e) => update("provider_type", e.target.value)}
              className={inputClass}
            >
              {PROVIDER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {(form.provider_type === "Greenhouse" || form.provider_type === "Lever" || form.provider_type === "iSolved Hire" || form.provider_type === "Structured Career Page") && (
            <div>
              <Label className="mb-1.5 block text-sm">{providerLabel}</Label>
              <Input
                value={form.provider_identifier}
                onChange={(e) => update("provider_identifier", e.target.value)}
                className={inputClass}
                placeholder={
                  form.provider_type === "Greenhouse" ? "e.g. companyname"
                    : form.provider_type === "Lever" ? "e.g. companyname"
                    : form.provider_type === "iSolved Hire" ? "e.g. franjoconstruction"
                    : "https://employer.com/careers"
                }
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block text-sm">Website URL</Label>
              <Input
                value={form.website_url}
                onChange={(e) => update("website_url", e.target.value)}
                className={inputClass}
                placeholder="https://"
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">Careers page URL</Label>
              <Input
                value={form.careers_page_url}
                onChange={(e) => update("careers_page_url", e.target.value)}
                className={inputClass}
                placeholder="https://"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="mb-1.5 block text-sm">City</Label>
              <Input value={form.city} onChange={(e) => update("city", e.target.value)} className={inputClass} placeholder="Pittsburgh" />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">State</Label>
              <Input value={form.state} onChange={(e) => update("state", e.target.value)} className={inputClass} placeholder="PA" />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">ZIP</Label>
              <Input value={form.postal_code} onChange={(e) => update("postal_code", e.target.value)} className={inputClass} placeholder="15219" />
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block text-sm">Service area</Label>
            <Input
              value={form.service_area}
              onChange={(e) => update("service_area", e.target.value)}
              className={inputClass}
              placeholder="e.g. Greater Pittsburgh area"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block text-sm">Contact name</Label>
              <Input value={form.contact_name} onChange={(e) => update("contact_name", e.target.value)} className={inputClass} />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">Contact email</Label>
              <Input type="email" value={form.contact_email} onChange={(e) => update("contact_email", e.target.value)} className={inputClass} />
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block text-sm">Contact phone</Label>
            <Input value={form.contact_phone} onChange={(e) => update("contact_phone", e.target.value)} className={inputClass} placeholder="412-555-0100" />
          </div>

          <div>
            <Label className="mb-1.5 block text-sm">Notes</Label>
            <Input value={form.notes} onChange={(e) => update("notes", e.target.value)} className={inputClass} placeholder="Internal notes" />
          </div>

          <div className="flex items-center justify-between py-1">
            <Label className="text-sm">Approved</Label>
            <Switch checked={!!form.approved} onCheckedChange={(v) => update("approved", v)} />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={!form.employer_name}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}