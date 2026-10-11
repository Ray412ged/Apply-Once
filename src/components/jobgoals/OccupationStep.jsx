import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X, Plus, Search } from "lucide-react";
import { OCCUPATIONS_BY_CATEGORY } from "@/lib/occupationData";

export default function OccupationStep({ value = [], onChange, categories = [] }) {
  const [search, setSearch] = useState("");
  const [customInput, setCustomInput] = useState("");

  const availableOccupations = categories.flatMap((cat) => OCCUPATIONS_BY_CATEGORY[cat] || []);
  const customSelected = value.filter((v) => !availableOccupations.includes(v));

  const filtered = search
    ? availableOccupations.filter((occ) => occ.toLowerCase().includes(search.toLowerCase()))
    : availableOccupations;

  const toggle = (occ) => {
    if (value.includes(occ)) {
      onChange(value.filter((v) => v !== occ));
    } else {
      onChange([...value, occ]);
    }
  };

  const addCustom = () => {
    const trimmed = customInput.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setCustomInput("");
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search occupations..."
          className="h-12 text-base pl-10"
        />
      </div>

      {/* Selected chips */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((occ, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium"
            >
              {occ}
              <button type="button" onClick={() => toggle(occ)} className="hover:text-destructive" aria-label={`Remove ${occ}`}>
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Available occupations */}
      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground">Select at least one work category first.</p>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar">
          {filtered.map((occ) => {
            const selected = value.includes(occ);
            return (
              <button
                key={occ}
                type="button"
                onClick={() => toggle(occ)}
                className={`w-full text-left p-3 rounded-xl text-sm font-medium border-2 transition-colors ${
                  selected
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-card text-foreground border-border hover:border-primary/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{occ}</span>
                  {selected && <Check className="w-4 h-4" />}
                </div>
              </button>
            );
          })}
          {customSelected.map((occ, i) => (
            <button
              key={`custom-${i}`}
              type="button"
              onClick={() => toggle(occ)}
              className="w-full text-left p-3 rounded-xl text-sm font-medium border-2 bg-primary/10 text-primary border-primary/30"
            >
              <div className="flex items-center justify-between">
                <span>{occ} <span className="text-xs text-muted-foreground">(custom)</span></span>
                <Check className="w-4 h-4" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Add custom occupation */}
      <div className="flex gap-2">
        <Input
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
          placeholder="Add your own occupation"
          className="h-12 text-base"
        />
        <Button type="button" variant="secondary" onClick={addCustom} className="h-12 px-4" aria-label="Add occupation">
          <Plus className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}