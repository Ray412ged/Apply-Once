import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Plus,
  Search,
  Star,
  Pencil,
  Trash2,
  Loader2,
  Clock,
  Building2,
} from "lucide-react";
import ReusableAnswerFormDialog, {
  QUESTION_TYPES,
} from "@/components/admin/ReusableAnswerFormDialog";

const EMPTY_FORM = {
  question: "",
  answer: "",
  question_type: "General",
  employer: "",
  industry: "",
  favorite: false,
};

export default function ReusableAnswers() {
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    loadAnswers();
  }, []);

  const loadAnswers = async () => {
    try {
      const data = await base44.entities.ReusableAnswer.list("-created_date", 200);
      setAnswers(data);
    } catch (err) {
      console.error("Failed to load answers:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = answers.filter((a) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      a.question?.toLowerCase().includes(q) ||
      a.answer?.toLowerCase().includes(q);
    const matchesType = filterType === "all" || a.question_type === filterType;
    return matchesSearch && matchesType;
  });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

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
      if (editing) {
        await base44.entities.ReusableAnswer.update(editing.id, form);
      } else {
        await base44.entities.ReusableAnswer.create(form);
      }
      setDialogOpen(false);
      await loadAnswers();
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await base44.entities.ReusableAnswer.delete(deleteId);
      setDeleteId(null);
      await loadAnswers();
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const toggleFavorite = async (answer) => {
    try {
      const updated = await base44.entities.ReusableAnswer.update(answer.id, {
        favorite: !answer.favorite,
      });
      setAnswers((prev) => prev.map((a) => (a.id === answer.id ? updated : a)));
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reusable Answers</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {answers.length} saved {answers.length === 1 ? "answer" : "answers"}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1" />
          New Answer
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions or answers..."
            className="pl-9"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {QUESTION_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((answer) => (
            <AnswerCard
              key={answer.id}
              answer={answer}
              onEdit={() => openEdit(answer)}
              onDelete={() => setDeleteId(answer.id)}
              onFavorite={() => toggleFavorite(answer)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-dashed border-border p-10 text-center">
          <Search className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">
            {search || filterType !== "all"
              ? "No answers match your search."
              : "No saved answers yet. Click \"New Answer\" to get started."}
          </p>
        </div>
      )}

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
    </div>
  );
}

function AnswerCard({ answer, onEdit, onDelete, onFavorite }) {
  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-foreground text-sm">{answer.question}</p>
            {answer.question_type && (
              <span className="text-xs bg-accent text-accent-foreground rounded-full px-2 py-0.5">
                {answer.question_type}
              </span>
            )}
            {answer.ai_generated && (
              <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">
                AI Draft
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{answer.answer}</p>
        </div>
        <button
          onClick={onFavorite}
          className="flex-shrink-0 p-1"
          aria-label={answer.favorite ? "Unfavorite" : "Favorite"}
        >
          <Star
            className={`w-5 h-5 ${
              answer.favorite ? "fill-warning text-warning" : "text-muted-foreground hover:text-foreground"
            }`}
          />
        </button>
      </div>
      <div className="flex items-center justify-between gap-2 mt-3">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {answer.employer && (
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              {answer.employer}
            </span>
          )}
          {answer.times_used > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Used {answer.times_used}×{answer.last_used ? ` · ${new Date(answer.last_used).toLocaleDateString()}` : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={onDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}