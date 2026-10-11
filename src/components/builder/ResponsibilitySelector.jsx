import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, Plus, X, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { RESPONSIBILITY_CATEGORIES } from "@/lib/builder/responsibilityData";
import { getResponsibilitiesForJobTitle } from "@/lib/builder/jobTitleData";

export default function ResponsibilitySelector({ value = {}, onChange, jobTitle }) {
  const selected = value.responsibilities_selected || [];
  const custom = value.responsibilities_custom || [];
  const [customInput, setCustomInput] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState({});

  // Job-title-specific responsibilities (if we have a match)
  const jobTitleMatch = getResponsibilitiesForJobTitle(jobTitle);

  const toggleResponsibility = (item) => {
    if (selected.includes(item)) {
      onChange({ ...value, responsibilities_selected: selected.filter((s) => s !== item) });
    } else {
      onChange({ ...value, responsibilities_selected: [...selected, item] });
    }
  };

  const addCustom = () => {
    const trimmed = customInput.trim();
    if (trimmed && !custom.includes(trimmed) && !selected.includes(trimmed)) {
      onChange({ ...value, responsibilities_custom: [...custom, trimmed] });
      setCustomInput("");
    }
  };

  const removeCustom = (item) => {
    onChange({ ...value, responsibilities_custom: custom.filter((c) => c !== item) });
  };

  const toggleCategory = (category) => {
    setCollapsedCategories((prev) => {
      const current = prev[category] ?? true;
      return { ...prev, [category]: !current };
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground mb-1">
          Select the tasks you actually performed. Don't check things you didn't do.
        </p>
      </div>

      {/* Selected count */}
      {selected.length + custom.length > 0 && (
        <div className="bg-success/10 border border-success/20 rounded-xl p-3 text-center">
          <p className="text-sm font-medium text-success">
            {selected.length + custom.length} {selected.length + custom.length === 1 ? "task" : "tasks"} selected
          </p>
        </div>
      )}

      {/* Custom responsibilities (added by user) */}
      {custom.length > 0 && (
        <div className="space-y-2">
          {custom.map((item) => (
            <div
              key={item}
              className="flex items-center gap-3 p-3.5 rounded-xl border-2 border-primary bg-primary/5"
            >
              <div className="w-6 h-6 rounded-md bg-primary border-2 border-primary flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-medium text-foreground flex-1">{item}</span>
              <button
                type="button"
                onClick={() => removeCustom(item)}
                className="p-1 rounded-md text-muted-foreground hover:text-destructive"
                aria-label={`Remove ${item}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Job-title-specific responsibilities */}
      {jobTitleMatch && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">{jobTitleMatch.label}</p>
          </div>
          {jobTitleMatch.responsibilities.map((item) => {
            const isSelected = selected.includes(item);
            return (
              <button
                key={item}
                type="button"
                onClick={() => toggleResponsibility(item)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-left transition-colors ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected ? "bg-primary border-primary" : "border-input bg-card"
                  }`}
                >
                  {isSelected && <Check className="w-4 h-4 text-primary-foreground" />}
                </div>
                <span className="text-sm text-foreground">{item}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Category groups */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          {jobTitleMatch ? "More responsibilities" : "Browse by category"}
        </p>
      </div>
      {RESPONSIBILITY_CATEGORIES.map((group) => {
        const isCollapsed = collapsedCategories[group.category] ?? true;
        const hasSelectedInGroup = group.responsibilities.some((r) => selected.includes(r));
        return (
          <div key={group.category} className="border border-border rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggleCategory(group.category)}
              className="w-full flex items-center justify-between px-4 py-3 bg-card hover:bg-accent transition-colors"
            >
              <span className="text-sm font-semibold text-foreground">{group.category}</span>
              <div className="flex items-center gap-2">
                {hasSelectedInGroup && (
                  <span className="text-xs text-success font-medium">
                    {group.responsibilities.filter((r) => selected.includes(r)).length} selected
                  </span>
                )}
                {isCollapsed ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </button>
            {!isCollapsed && (
              <div className="divide-y divide-border">
                {group.responsibilities.map((item) => {
                  const isSelected = selected.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleResponsibility(item)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${
                        isSelected ? "bg-primary/5" : "hover:bg-accent"
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                          isSelected ? "bg-primary border-primary" : "border-input bg-card"
                        }`}
                      >
                        {isSelected && <Check className="w-4 h-4 text-primary-foreground" />}
                      </div>
                      <span className="text-sm text-foreground">{item}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Add custom responsibility */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Add a task that's not listed</p>
        <div className="flex gap-2">
          <Input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustom();
              }
            }}
            placeholder="Example: Managed social media accounts"
            className="h-12 text-base"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={addCustom}
            disabled={!customInput.trim()}
            className="h-12 px-4"
            aria-label="Add responsibility"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}