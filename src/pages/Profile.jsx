import React from "react";
import { useNavigate } from "react-router-dom";
import { useProfileData } from "@/hooks/useProfileData";
import { PROFILE_SECTIONS } from "@/lib/profileSections";
import ProgressBar from "@/components/ProgressBar";
import { Loader2, ChevronRight, Check, CircleDashed } from "lucide-react";
import { ProfileSectionSkeleton } from "@/components/Skeleton";
import {
  User as UserIcon,
  Target,
  Briefcase,
  GraduationCap,
  Wrench,
  Award,
  Users,
  FileText,
  HelpCircle,
  CheckCircle,
} from "lucide-react";

const ICON_MAP = {
  User: UserIcon,
  Target,
  Briefcase,
  GraduationCap,
  Wrench,
  Award,
  Users,
  FileText,
  HelpCircle,
  CheckCircle,
};

export default function Profile() {
  const navigate = useNavigate();
  const { data, isLoading: loading } = useProfileData();

  if (loading) {
    return <ProfileSectionSkeleton />;
  }

  const completion = data?.percentage || 0;
  const addressedCount = data?.completedCount || 0;
  const totalSections = data?.totalSections || 0;

  // Optional sections may be "resolved" (none declared) in addition to the
  // core three states. Resolved is shown calmly — never as an error.
  const OPTIONAL_IDS = ["education", "credentials", "references"];

  const resolvedLabel = (id) => {
    if (id === "education") return "No education or training added";
    if (id === "credentials") return "No licenses or certifications added";
    if (id === "references") return "No references added";
    return "Resolved";
  };

  return (
    <div className="py-6 space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {completion === 100
            ? "Your profile is complete! Great job."
            : "Build your profile one step at a time. Save and come back anytime."}
        </p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-5">
        <ProgressBar value={completion} showLabel />
        <p className="text-sm text-muted-foreground mt-3">
          {addressedCount === 0
            ? "Let's get started. Tap a section below to begin."
            : addressedCount < totalSections
            ? `${addressedCount} of ${totalSections} sections addressed`
            : "Profile sections complete!"}
        </p>
      </div>

      <div className="space-y-3">
        {PROFILE_SECTIONS.map((section) => {
          const Icon = ICON_MAP[section.icon] || UserIcon;
          const status = data?.sectionStatuses?.[section.id] || "not_started";
          const count = data?.counts?.[section.id];
          const hasCount = count !== undefined && count > 0;
          const isOptional = OPTIONAL_IDS.includes(section.id);

          const iconBg =
            status === "completed"
              ? "bg-success/10"
              : status === "resolved"
              ? "bg-muted"
              : status === "in_progress"
              ? "bg-warning/10"
              : "bg-accent";

          const subtitleText =
            status === "completed"
              ? section.id === "answers" || !hasCount
                ? "Completed"
                : `${count} ${count === 1 ? "item" : "items"} saved`
              : status === "resolved"
              ? resolvedLabel(section.id)
              : status === "in_progress"
              ? "In progress — tap to finish"
              : isOptional
              ? "Tap to answer"
              : section.subtitle;

          return (
            <button
              key={section.id}
              onClick={() => navigate(`/profile/edit?section=${section.id}`)}
              className="w-full bg-card rounded-2xl border border-border p-4 flex items-center gap-4 hover:shadow-md transition-shadow text-left"
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}
              >
                {status === "completed" ? (
                  <Check className="w-6 h-6 text-success" />
                ) : status === "resolved" ? (
                  <Check className="w-6 h-6 text-muted-foreground" />
                ) : status === "in_progress" ? (
                  <CircleDashed className="w-6 h-6 text-warning" />
                ) : (
                  <Icon className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-semibold text-foreground">{section.title}</p>
                <p className="text-sm text-muted-foreground truncate">{subtitleText}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}