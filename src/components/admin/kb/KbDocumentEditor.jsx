import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
} from "@/components/ui/dialog";
import { Loader2, Save, Trash2, Upload, FileText, Eye, Pencil } from "lucide-react";
import ReactMarkdown from "react-markdown";

const FOLDERS = [
  "Vision",
  "Design System",
  "Architecture",
  "AI Prompts",
  "Employer Integrations",
  "ATS Documentation",
  "Roadmap",
  "Release Notes",
  "Meeting Notes",
  "Research",
];

const STATUSES = ["Draft", "Published", "Archived"];

const MARKDOWN_COMPONENTS = {
  h1: ({ node, ...props }) => <h1 className="text-xl font-bold text-foreground mt-4 mb-2" {...props} />,
  h2: ({ node, ...props }) => <h2 className="text-lg font-bold text-foreground mt-3 mb-2" {...props} />,
  h3: ({ node, ...props }) => <h3 className="text-base font-semibold text-foreground mt-2 mb-1" {...props} />,
  p: ({ node, ...props }) => <p className="text-sm text-foreground mb-2 leading-relaxed" {...props} />,
  ul: ({ node, ...props }) => <ul className="list-disc pl-5 text-sm text-foreground mb-2 space-y-1" {...props} />,
  ol: ({ node, ...props }) => <ol className="list-decimal pl-5 text-sm text-foreground mb-2 space-y-1" {...props} />,
  li: ({ node, ...props }) => <li className="text-sm text-foreground" {...props} />,
  code: ({ node, ...props }) => <code className="bg-accent rounded px-1 py-0.5 text-xs font-mono" {...props} />,
  pre: ({ node, ...props }) => <pre className="bg-accent rounded p-3 text-xs font-mono overflow-x-auto mb-2" {...props} />,
  a: ({ node, ...props }) => <a className="text-primary underline" target="_blank" rel="noopener noreferrer" {...props} />,
  blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-border pl-3 italic text-muted-foreground mb-2" {...props} />,
  hr: ({ node, ...props }) => <hr className="border-border my-3" {...props} />,
};

export default function KbDocumentEditor({ open, document, onClose, onSaved, onDeleted }) {
  const [title, setTitle] = useState("");
  const [folder, setFolder] = useState("Vision");
  const [status, setStatus] = useState("Draft");
  const [tags, setTags] = useState("");
  const [content, setContent] = useState("");
  const [fileUrls, setFileUrls] = useState([]);
  const [author, setAuthor] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    if (document) {
      setTitle(document.title || "");
      setFolder(document.folder || "Vision");
      setStatus(document.status || "Draft");
      setTags((document.tags || []).join(", "));
      setContent(document.content || "");
      setFileUrls(document.file_urls || []);
      setAuthor(document.author || "");
    } else {
      setTitle("");
      setFolder("Vision");
      setStatus("Draft");
      setTags("");
      setContent("");
      setFileUrls([]);
      setAuthor("");
    }
    setPreviewMode(false);
  }, [document, open]);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const tagArray = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const data = {
        title: title.trim(),
        folder,
        status,
        tags: tagArray,
        content,
        file_urls: fileUrls,
        author: author || undefined,
      };
      let result;
      if (document) {
        result = await base44.entities.KnowledgeBaseDocument.update(document.id, data);
      } else {
        result = await base44.entities.KnowledgeBaseDocument.create(data);
      }
      onSaved(result);
      onClose();
    } catch (err) {
      console.error("Failed to save document:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!document) return;
    setSaving(true);
    try {
      await base44.entities.KnowledgeBaseDocument.delete(document.id);
      onDeleted(document.id);
      onClose();
    } catch (err) {
      console.error("Failed to delete document:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFileUrls((prev) => [...prev, file_url]);
    } catch (err) {
      console.error("Failed to upload file:", err);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeFile = (url) => {
    setFileUrls((prev) => prev.filter((u) => u !== url));
  };

  const getFileName = (url) => {
    return url.split("/").pop()?.split("?")[0] || "file";
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{document ? "Edit Document" : "New Document"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="kb-title">Title</Label>
            <Input
              id="kb-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document title"
            />
          </div>

          {/* Folder + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Folder</Label>
              <Select value={folder} onValueChange={setFolder}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FOLDERS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags + Author */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="kb-tags">Tags (comma-separated)</Label>
              <Input
                id="kb-tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="design, principles, ui"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="kb-author">Author</Label>
              <Input
                id="kb-author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Author name"
              />
            </div>
          </div>

          {/* Content editor */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Content (Markdown)</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewMode(!previewMode)}
              >
                {previewMode ? (
                  <>
                    <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 mr-1" /> Preview
                  </>
                )}
              </Button>
            </div>
            {previewMode ? (
              <div className="min-h-[300px] max-h-[400px] overflow-y-auto border border-input rounded-md p-4">
                <ReactMarkdown components={MARKDOWN_COMPONENTS}>
                  {content || "*No content*"}
                </ReactMarkdown>
              </div>
            ) : (
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write document content in Markdown..."
                className="min-h-[300px] max-h-[400px] font-mono text-sm"
              />
            )}
          </div>

          {/* File attachments */}
          <div className="space-y-2">
            <Label>Attachments</Label>
            <div className="flex gap-2">
              <label className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-input bg-card text-sm font-medium cursor-pointer hover:bg-accent">
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {uploading ? "Uploading..." : "Upload File"}
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".pdf,.docx,.md,.txt,.png,.jpg,.jpeg,.gif,.webp"
                />
              </label>
            </div>
            {fileUrls.length > 0 && (
              <div className="space-y-1">
                {fileUrls.map((url, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-sm bg-accent rounded-md px-3 py-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline truncate flex-1"
                    >
                      {getFileName(url)}
                    </a>
                    <button
                      onClick={() => removeFile(url)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between gap-2 pt-2">
            {document ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={saving}
              >
                <Trash2 className="w-4 h-4 mr-1" /> Delete
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving || !title.trim()}>
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <Save className="w-4 h-4 mr-1" />
                )}
                Save
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}