import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import AssistantSection from "./AssistantSection";

export default function SkillsSection({ skills, status }) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(new Set());

  const toggle = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const selectedSkills = skills.filter((s) => selected.has(s.id));
  const selectedText = selectedSkills.map((s) => s.skill_name).join(", ");
  const allText = skills.map((s) => s.skill_name).join(", ");

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  return (
    <AssistantSection
      title="Skills"
      icon={Sparkles}
      status={status}
      onEdit={() => navigate("/profile")}
    >
      {skills.length > 0 ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => {
              const isSelected = selected.has(skill.id);
              return (
                <button
                  key={skill.id}
                  onClick={() => toggle(skill.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-accent text-accent-foreground hover:bg-accent/80"
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                  {skill.skill_name}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-9"
              disabled={selectedSkills.length === 0}
              onClick={() => copyToClipboard(selectedText)}
            >
              <Copy className="w-4 h-4 mr-1" />
              Use Selected ({selectedSkills.length})
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-9"
              onClick={() => copyToClipboard(allText)}
            >
              <Copy className="w-4 h-4 mr-1" />
              Use All Skills
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground py-2">
          No skills saved yet.{" "}
          <button onClick={() => navigate("/profile")} className="text-primary hover:underline">
            Add skills
          </button>
        </p>
      )}
    </AssistantSection>
  );
}