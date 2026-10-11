import React from "react";
import { useLocation } from "react-router-dom";
import { Building2, BriefcaseBusiness, Settings2 } from "lucide-react";

export default function OrgPlaceholder() {
  const path = useLocation().pathname;
  const isEmployers = path.endsWith("/employers");
  const isStaff = path.endsWith("/staff");
  const Icon = isEmployers ? Building2 : isStaff ? Settings2 : BriefcaseBusiness;
  const title = isEmployers ? "Employers" : isStaff ? "Staff" : "Opportunities";
  const phase = isEmployers ? "Phase 2" : isStaff ? "Phase 6" : "Phase 3";

  return (
    <main className="max-w-4xl mx-auto p-5">
      <div className="bg-card rounded-2xl border border-border p-8 text-center">
        <Icon className="w-9 h-9 mx-auto text-primary mb-3" />
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Organization shell is ready. This workspace will be activated in {phase}.
        </p>
      </div>
    </main>
  );
}