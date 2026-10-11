import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Star, Pencil, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import AssistantSection from "./AssistantSection";
import CopyButton from "./CopyButton";
import ReusableAnswerFormDialog from "@/components/admin/ReusableAnswerFormDialog";

const EMPTY_FORM = {
  question: "",
  answer: "",
  question_type: "General",
  employer: "",
  industry: "",
  favorite: false,
};

export default function ReusableAnswersSection({ answers, status }) {
  const navigate = useNavigate();
  const [localAnswers, setLocalAnswers] = useState(answers);
  const [editing, setEditing] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const openEdit = (answer) => {
    setEditing(answer);
    setForm({
      question: answer.question || "",
      answer: answer.answer || "",
      question_type: answer.question_type || "General",
      employer: answer.employer || "",
      industry: answer.industry || "",
      favorite: answer.favorite || false,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await base44.entities.ReusableAnswer.update(editing.id, form);
      setLocalAnswers((prev) => prev.map((a) => (a.id === editing.id ? updated : a)));
      setDialogOpen(false);
    } catch (err) {
      console.error("Failed to update answer:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await base44.entities.ReusableAnswer.delete(deleteId);
      setLocalAnswers((prev) => prev.filter((a) => a.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      console.error("Failed to delete answer:", err);
    }
  };

  const toggleFavorite = async (answer) => {
    try {
      const updated = await base44.entities.ReusableAnswer.update(answer.id, {
        favorite: !answer.favorite,
      });
      setLocalAnswers((prev) => prev.map((a) => (a.id === answer.id ? updated : a)));
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  };

  return (
    <>
      <AssistantSection
        title="Reusable Answers"
        icon={MessageSquare}
        status={status}
      >
        {localAnswers.length > 0 ? (
          <div className="space-y-2">
            {localAnswers.map((answer) => (
              <div
                key={answer.id}
                className="border border-border rounded-xl p-3 space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {answer.question_type && (
                        <span className="text-xs bg-accent text-accent-foreground rounded-full px-2 py-0.5">
                          {answer.question_type}
                        </span>
                      )}
                      {answer.employer && (
                        <span className="text-xs text-muted-foreground">
                          {answer.employer}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{answer.question}</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{answer.answer}</p>
                  </div>
                  <button
                    onClick={() => toggleFavorite(answer)}
                    className="flex-shrink-0 p-1"
                    aria-label="Toggle favorite"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        answer.favorite
                          ? "fill-warning text-warning"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center gap-1 pt-1 flex-wrap">
                  <CopyButton text={answer.answer} label="Use" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2.5 text-xs"
                    onClick={() => openEdit(answer)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span className="ml-1">Edit</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2.5 text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleteId(answer.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="ml-1">Delete</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-2">
            No saved answers yet.{" "}
            <button onClick={() => navigate("/profile")} className="text-primary hover:underline">
              Prepare answers
            </button>
          </p>
        )}
      </AssistantSection>

      <ReusableAnswerFormDialog
        open={dialogOpen}
        editing={editing}
        form={form}
        setForm={setForm}
        onSave={handleSave}
        onClose={() => setDialogOpen(false)}
        saving={saving}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this answer?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The saved answer will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}