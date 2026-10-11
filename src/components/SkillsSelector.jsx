import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SKILL_GROUPS,
  SKILL_TO_GROUP,
  suggestSkillsFromEmployment,
} from "@/lib/skillData";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Plus,
  Search,
  Lightbulb,
  X,
} from "lucide-react";

import OnboardingProgress from "@/components/onboarding/OnboardingProgress";

export default function SkillsSelector({
  initialData = [],
  employmentRecords = [],
  onSave,
  onDelete,
  onExit,
  onPrev,
  onExitProfile,
  title,
  nextSectionLabel = "Next Section",
  completionPercentage = 0,
  sectionId,
}) {
  const [search, setSearch] = useState("");
  const [customInput, setCustomInput] = useState("");
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 2500);
  };

  // Existing saved skills (already confirmed)
  const savedSkills = initialData || [];

  // Suggested skills from employment history (not yet saved)
  const suggestions = useMemo(() => {
    const suggested = suggestSkillsFromEmployment(employmentRecords);
    const alreadySaved = new Set(savedSkills.map((s) => s.skill_name));
    return suggested.filter((s) => !alreadySaved.has(s));
  }, [employmentRecords, savedSkills]);

  const savedSkillNames = new Set(savedSkills.map((s) => s.skill_name));

  // Filter groups by search
  const filteredGroups = useMemo(() => {
    if (!search.trim()) return SKILL_GROUPS;
    const q = search.toLowerCase();
    return SKILL_GROUPS.map((g) => ({
      ...g,
      skills: g.skills.filter((s) => s.toLowerCase().includes(q)),
    })).filter((g) => g.skills.length > 0);
  }, [search]);

  const handleToggleSkill = async (skillName) => {
    const isSaved = savedSkillNames.has(skillName);
    if (isSaved) {
      const record = savedSkills.find((s) => s.skill_name === skillName);
      await onDelete(record.id);
    } else {
      setSaving(true);
      try {
        await onSave({
          skill_name: skillName,
          skill_category: SKILL_TO_GROUP[skillName] || "Other",
          source: "User Entered",
          confirmed_by_user: true,
          suggested_from_employment: suggestions.includes(skillName),
        });
      } finally {
        setSaving(false);
      }
    }
  };

  const handleAddCustom = async () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await onSave({
        skill_name: trimmed,
        skill_category: "Other",
        source: "User Entered",
        confirmed_by_user: true,
      });
      showSuccess("Skills saved.");
      setCustomInput("");
      setShowAddCustom(false);
    } finally {
      setSaving(false);
    }
  };

  const totalSelected = savedSkills.length;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background pt-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={onPrev}
            className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
          <span className="text-sm text-muted-foreground">
            {totalSelected} {totalSelected === 1 ? "skill" : "skills"} selected
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden mb-3">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${Math.min(totalSelected * 10, 100)}%` }}
          />
        </div>
      </div>

      <div className="flex-1 py-2">
        {successMessage && (
          <div className="bg-success/10 rounded-xl p-3 text-center mb-4 animate-fade-in">
            <Check className="w-5 h-5 text-success inline mr-1.5 -mt-0.5" />
            <span className="text-sm font-medium text-success">{successMessage}</span>
          </div>
        )}
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search skills..."
            className="pl-10 h-12 text-base"
          />
        </div>

        {/* Suggestions from employment */}
        {suggestions.length > 0 && (
          <div className="bg-accent rounded-2xl p-4 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-primary" />
              <p className="text-sm font-medium text-accent-foreground">
                Based on your work history, you may have these skills.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => handleToggleSkill(skill)}
                  className="px-3 py-2 rounded-xl text-sm font-medium border-2 border-primary/40 bg-card text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  + {skill}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Skill groups */}
        <div className="space-y-5">
          {filteredGroups.map((group) => (
            <div key={group.name}>
              <h3 className="font-semibold text-foreground text-sm mb-2.5">{group.name}</h3>
              <div className="grid grid-cols-2 gap-2">
                {group.skills.map((skill) => {
                  const isSelected = savedSkillNames.has(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleToggleSkill(skill)}
                      className={`p-2.5 rounded-xl text-sm font-medium border-2 text-center transition-colors ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-foreground border-border hover:border-primary/40"
                      }`}
                    >
                      {isSelected && <Check className="w-4 h-4 inline mr-1" />}
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Add custom skill */}
        {showAddCustom ? (
          <div className="mt-5 flex gap-2">
            <Input
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCustom())}
              placeholder="Type your skill"
              className="h-12 text-base"
              autoFocus
            />
            <Button onClick={handleAddCustom} disabled={saving || !customInput.trim()} className="h-12 px-4">
              <Plus className="w-5 h-5" />
            </Button>
            <Button variant="ghost" onClick={() => setShowAddCustom(false)} className="h-12 px-3">
              <X className="w-5 h-5" />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAddCustom(true)}
            className="w-full flex items-center justify-center gap-2 p-3 mt-5 rounded-xl border-2 border-dashed border-border text-muted-foreground font-medium text-sm hover:border-primary/40 hover:text-foreground transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add my own skill
          </button>
        )}
      </div>

      {/* Onboarding progress */}
      {sectionId && (
        <OnboardingProgress currentSectionId={sectionId} completionPercentage={completionPercentage} />
      )}

      {/* Action buttons */}
      <div className="sticky bottom-16 bg-background py-3 space-y-2 -mx-4 px-4 border-t border-border">
        <Button
          onClick={onExit}
          className="w-full h-14 text-base font-semibold"
        >
          {totalSelected > 0 ? `Continue to ${nextSectionLabel}` : "Skip for now"}
          <ChevronRight className="w-5 h-5 ml-1" />
        </Button>
      </div>
    </div>
  );
}