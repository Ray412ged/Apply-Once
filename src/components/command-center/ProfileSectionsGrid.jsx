import React from "react";
import SectionStatusCard from "@/components/dashboard/SectionStatusCard";
import { User, FileText, Briefcase, Wrench, GraduationCap, Award, Users } from "lucide-react";

const SECTION_ICON_MAP = {
  contact: User,
  summary: FileText,
  employment: Briefcase,
  skills: Wrench,
  education: GraduationCap,
  credentials: Award,
  references: Users,
};

const SECTION_ORDER = [
  "contact",
  "employment",
  "skills",
  "summary",
  "education",
  "credentials",
  "references",
];

export default function ProfileSectionsGrid({ sectionStatuses, onNavigate }) {
  return (
    <section aria-label="Profile sections">
      <h2 className="text-lg font-bold text-foreground mb-3">Profile Sections</h2>
      <div className="grid grid-cols-2 gap-3">
        {SECTION_ORDER.map((key) => {
          const s = sectionStatuses?.[key];
          if (!s) return null;
          const Icon = SECTION_ICON_MAP[key] || User;
          return (
            <SectionStatusCard
              key={key}
              icon={Icon}
              label={s.label}
              status={s.status}
              detail={s.detail}
              onClick={() => onNavigate(s.route)}
            />
          );
        })}
      </div>
    </section>
  );
}