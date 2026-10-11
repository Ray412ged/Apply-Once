import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { BUILDING_BLOCKS, suggestBlocks, composeFromBlocks } from "@/lib/introductionData";
import { ChevronLeft, ChevronRight, Check, Plus, X } from "lucide-react";

const CATEGORY_LABELS = {
  whoIAm: "Who I Am",
  whatIBring: "What I Bring",
  whatILookFor: "What I Am Looking For",
};

export default function IntroductionBuilder({ profileData, onCompose, onBack, onSkip }) {
  const suggestions = suggestBlocks(profileData);
  const [selected, setSelected] = useState({ whoIAm: [], whatIBring: [], whatILookFor: [], ownWords: [] });
  const [customWord, setCustomWord] = useState("");

  const toggle = (category, item) => {
    setSelected((prev) => {
      const list = prev[category];
      return {
        ...prev,
        [category]: list.includes(item) ? list.filter((i) => i !== item) : [...list, item],
      };
    });
  };

  const addCustomWord = () => {
    const trimmed = customWord.trim();
    if (!trimmed) return;
    setSelected((prev) => ({ ...prev, ownWords: [...prev.ownWords, trimmed] }));
    setCustomWord("");
  };

  const removeCustom = (idx) => {
    setSelected((prev) => ({ ...prev, ownWords: prev.ownWords.filter((_, i) => i !== idx) }));
  };

  const totalSelected = selected.whoIAm.length + selected.whatIBring.length + selected.whatILookFor.length + selected.ownWords.length;

  const sortedBlocks = (category) => {
    const all = BUILDING_BLOCKS[category];
    const sugg = suggestions[category];
    return [...all].sort((a, b) => {
      const aS = sugg.includes(a);
      const bS = sugg.includes(b);
      if (aS && !bS) return -1;
      if (!aS && bS) return 1;
      return 0;
    });
  };

  return (
    <div className="py-4 space-y-5 animate-fade-in">
      <button onClick={onBack} className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ChevronLeft className="w-5 h-5" />
        Back
      </button>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Help Me Build It</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Tap the statements that sound most like you. Highlighted ones match your profile.
        </p>
      </div>

      {["whoIAm", "whatIBring", "whatILookFor"].map((category) => (
        <div key={category} className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">{CATEGORY_LABELS[category]}</h2>
          <div className="flex flex-wrap gap-2">
            {sortedBlocks(category).map((item) => {
              const isSelected = selected[category].includes(item);
              const isSuggested = suggestions[category].includes(item);
              return (
                <button
                  key={item}
                  onClick={() => toggle(category, item)}
                  className={`px-3 py-2 rounded-full text-sm border transition-colors text-left ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary"
                      : isSuggested
                      ? "bg-accent text-accent-foreground border-primary/30"
                      : "bg-card text-foreground border-border"
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                  {item}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground">Add My Own Words</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={customWord}
            onChange={(e) => setCustomWord(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomWord();
              }
            }}
            placeholder="Type a few words and press Enter"
            className="flex h-9 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          />
          <Button onClick={addCustomWord} variant="outline" size="icon">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {selected.ownWords.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selected.ownWords.map((word, idx) => (
              <span key={idx} className="px-3 py-1.5 rounded-full text-sm bg-primary text-primary-foreground flex items-center gap-1">
                {word}
                <button onClick={() => removeCustom(idx)} className="ml-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2 pt-2">
        <Button
          onClick={() => onCompose(composeFromBlocks(selected))}
          disabled={totalSelected === 0}
          className="w-full h-14 text-base font-semibold"
        >
          Generate My Introduction
          <ChevronRight className="w-5 h-5 ml-1" />
        </Button>
        <Button onClick={onSkip} variant="ghost" className="w-full h-12">
          Skip for Now
        </Button>
      </div>
    </div>
  );
}