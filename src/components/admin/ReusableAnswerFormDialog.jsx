import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

export const QUESTION_TYPES = [
  "Motivation",
  "Strengths",
  "Weaknesses",
  "Availability",
  "Leadership",
  "Conflict",
  "Customer Service",
  "Safety",
  "Career Goals",
  "Problem Solving",
  "Teamwork",
  "Background",
  "Experience",
  "Education",
  "General",
];

export default function ReusableAnswerFormDialog({
  open,
  editing,
  form,
  setForm,
  onSave,
  onClose,
  saving,
}) {
  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Answer" : "New Answer"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Question</Label>
            <Textarea
              value={form.question}
              onChange={(e) => update("question", e.target.value)}
              placeholder="e.g. Why do you want to work here?"
              rows={2}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Answer</Label>
            <Textarea
              value={form.answer}
              onChange={(e) => update("answer", e.target.value)}
              placeholder="Your saved answer..."
              rows={5}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Question Type</Label>
            <Select
              value={form.question_type || "General"}
              onValueChange={(v) => update("question_type", v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUESTION_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Employer</Label>
              <Input
                value={form.employer || ""}
                onChange={(e) => update("employer", e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Industry</Label>
              <Input
                value={form.industry || ""}
                onChange={(e) => update("industry", e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <Label htmlFor="fav-switch" className="cursor-pointer">
              Favorite
            </Label>
            <Switch
              id="fav-switch"
              checked={!!form.favorite}
              onCheckedChange={(v) => update("favorite", v)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={saving || !form.question || !form.answer}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editing ? "Update" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}