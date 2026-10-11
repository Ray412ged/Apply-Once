import React, { useState } from "react";
import { Shield, Info, Database, Bug } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { isDiagnosticDebugEnabled, setDiagnosticDebug } from "@/lib/debugMode";

export default function Settings() {
  const [debugEnabled, setDebugEnabled] = useState(() => isDiagnosticDebugEnabled());

  const handleToggle = (checked) => {
    setDiagnosticDebug(checked);
    setDebugEnabled(checked);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">System configuration and information</p>
      </div>

      {/* App Info */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">AO</span>
          </div>
          <div>
            <p className="font-heading font-bold text-foreground">Apply Once</p>
            <p className="text-sm text-muted-foreground">Version 0.1</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          A supportive employment assistant that helps job seekers enter their information once and reuse it for future applications.
        </p>
      </div>

      {/* Privacy & Security */}
      <div>
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-2 px-1">
          Privacy & Security
        </h2>
        <div className="bg-card rounded-2xl border border-border divide-y divide-border">
          <div className="flex items-start gap-3 p-4">
            <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground text-sm">Data Privacy</p>
              <p className="text-sm text-muted-foreground mt-1">
                All user profile records are private to the owning user. Administrators cannot access private documents, demographic information, or application answers.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4">
            <Database className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground text-sm">Data Collection</p>
              <p className="text-sm text-muted-foreground mt-1">
                Apply Once does not collect Social Security numbers, banking information, driver's license numbers, or birth certificates.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4">
            <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground text-sm">Matching Disclaimer</p>
              <p className="text-sm text-muted-foreground mt-1">
                Job match levels are informational estimates. The employer always makes the final hiring decision.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Diagnostics */}
      <div>
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-2 px-1">
          Diagnostics
        </h2>
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-start gap-3">
            <Bug className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-foreground text-sm">Diagnostic Debug Panel</p>
                <Switch checked={debugEnabled} onCheckedChange={handleToggle} />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                When enabled, internal diagnostic panels (such as the Credential Import Debug Log) become visible on profile pages. End users never see these panels. Disable after troubleshooting.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Info */}
      <div>
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-2 px-1">
          Admin Access
        </h2>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-sm text-muted-foreground">
            As an administrator, you can manage job postings, import jobs, and view non-sensitive system activity. You cannot browse users' private data, documents, or sensitive application answers.
          </p>
        </div>
      </div>
    </div>
  );
}