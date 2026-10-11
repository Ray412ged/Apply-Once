import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ExternalLink, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function MissingQuestionsList({ items, answers, onAnswer, onSaveReusable }) {
  if (!items || items.length === 0) return null;
  return (
    <div id="missing-section">
      <h2 className="font-bold text-foreground mb-3">Still needed</h2>
      <div className="space-y-3">
        {items.map((item) => (
          <MissingItem
            key={item.id}
            item={item}
            answer={answers[item.id] || ""}
            onAnswer={(value) => onAnswer(item.id, value)}
            onSaveReusable={onSaveReusable}
          />
        ))}
      </div>
    </div>
  );
}

function MissingItem({ item, answer, onAnswer, onSaveReusable }) {
  const navigate = useNavigate();
  const [draft, setDraft] = useState(answer || "");
  const [savedForFuture, setSavedForFuture] = useState(null);
  const [reusableSaved, setReusableSaved] = useState(false);

  const isAnswered = answer !== "" && answer !== undefined && answer !== null;

  const handleSubmit = () => {
    if (!draft.trim()) return;
    onAnswer(draft.trim());
  };

  const handleBoolean = (value) => {
    onAnswer(value);
    setDraft(String(value));
  };

  const handleSaveReusable = (shouldSave) => {
    setSavedForFuture(shouldSave);
    if (shouldSave) {
      onSaveReusable(item.question || item.label, String(answer), item.category);
      setReusableSaved(true);
    }
  };

  // Link-type items — direct to profile
  if (item.type === "link") {
    return (
      <div className="bg-card rounded-xl border border-warning/30 p-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground text-sm">{item.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{item.question}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-3 h-10"
          onClick={() => navigate(item.linkTo)}
        >
          <ExternalLink className="w-4 h-4 mr-1" />
          Go to profile
        </Button>
      </div>
    );
  }

  return (
    <div className={`bg-card rounded-xl border p-3 ${isAnswered ? "border-success/30" : "border-warning/30"}`}>
      <div className="flex items-start gap-3 mb-2">
        <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isAnswered ? "text-success" : "text-warning"}`} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground text-sm">{item.label}</p>
          {item.question && <p className="text-xs text-muted-foreground mt-0.5">{item.question}</p>}
        </div>
      </div>

      {item.type === "boolean" ? (
        <div className="flex gap-2">
          <Button
            variant={answer === true ? "default" : "outline"}
            size="sm"
            className="flex-1 h-10"
            onClick={() => handleBoolean(true)}
          >
            Yes
          </Button>
          <Button
            variant={answer === false ? "default" : "outline"}
            size="sm"
            className="flex-1 h-10"
            onClick={() => handleBoolean(false)}
          >
            No
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            type={item.type === "date" ? "date" : "text"}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Your answer..."
            className="flex-1 h-10"
          />
          <Button size="sm" className="h-10" onClick={handleSubmit} disabled={!draft.trim()}>
            <Save className="w-4 h-4 mr-1" />
            Save
          </Button>
        </div>
      )}

      {/* Save to reusable answers prompt */}
      {isAnswered && item.saveable && savedForFuture === null && (
        <div className="mt-3 bg-accent rounded-lg p-2.5">
          <p className="text-xs text-muted-foreground mb-2">Save this answer for future applications?</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => handleSaveReusable(true)}>
              Yes, save it
            </Button>
            <Button variant="ghost" size="sm" className="flex-1 h-8 text-xs" onClick={() => handleSaveReusable(false)}>
              Use only for this application
            </Button>
          </div>
        </div>
      )}

      {reusableSaved && (
        <p className="text-xs text-success mt-2">Saved to your reusable answers.</p>
      )}
      {savedForFuture === false && isAnswered && (
        <p className="text-xs text-muted-foreground mt-2">Saved for this application only.</p>
      )}
    </div>
  );
}