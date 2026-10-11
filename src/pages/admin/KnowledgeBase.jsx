import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Search, BookOpen, FileText, Calendar, User, Tag } from "lucide-react";
import KbDocumentEditor from "@/components/admin/kb/KbDocumentEditor";

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

const STATUS_STYLES = {
  Draft: "bg-muted text-muted-foreground",
  Published: "bg-success/10 text-success",
  Archived: "bg-muted text-muted-foreground",
};

export default function KnowledgeBase() {
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [activeFolder, setActiveFolder] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    setLoading(true);
    try {
      const docs = await base44.entities.KnowledgeBaseDocument.list("-updated_date", 200);
      setDocuments(docs);
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setLoading(false);
    }
  }

  const folderCounts = useMemo(() => {
    const counts = {};
    FOLDERS.forEach((f) => { counts[f] = 0; });
    documents.forEach((d) => {
      if (counts[d.folder] !== undefined) counts[d.folder]++;
    });
    return counts;
  }, [documents]);

  const filteredDocs = useMemo(() => {
    let result = documents;
    if (activeFolder !== "All") {
      result = result.filter((d) => d.folder === activeFolder);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.title?.toLowerCase().includes(q) ||
          d.content?.toLowerCase().includes(q) ||
          d.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [documents, activeFolder, searchQuery]);

  const handleNew = () => {
    setEditingDoc(null);
    setEditorOpen(true);
  };

  const handleEdit = (doc) => {
    setEditingDoc(doc);
    setEditorOpen(true);
  };

  const handleSaved = (savedDoc) => {
    setDocuments((prev) => {
      const idx = prev.findIndex((d) => d.id === savedDoc.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = savedDoc;
        return next;
      }
      return [savedDoc, ...prev];
    });
  };

  const handleDeleted = (docId) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Knowledge Base</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Internal documentation for Apply Once
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="w-4 h-4 mr-1" /> New Document
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search documents..."
          className="w-full h-11 pl-10 pr-4 rounded-lg border border-input bg-card text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {/* Folder filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setActiveFolder("All")}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            activeFolder === "All"
              ? "bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground border border-border hover:text-foreground"
          }`}
        >
          All ({documents.length})
        </button>
        {FOLDERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFolder(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeFolder === f
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground border border-border hover:text-foreground"
            }`}
          >
            {f} ({folderCounts[f] || 0})
          </button>
        ))}
      </div>

      {/* Document list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredDocs.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              onClick={() => handleEdit(doc)}
              className="bg-card rounded-xl border border-border p-4 space-y-2 cursor-pointer hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <p className="font-semibold text-foreground truncate">{doc.title}</p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                    STATUS_STYLES[doc.status] || ""
                  }`}
                >
                  {doc.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{doc.folder}</p>
              {doc.tags && doc.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {doc.tags.slice(0, 4).map((tag, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-0.5 text-xs text-muted-foreground bg-accent rounded-full px-2 py-0.5"
                    >
                      <Tag className="w-2.5 h-2.5" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                {doc.author && (
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {doc.author}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(doc.updated_date)}
                </span>
                {doc.file_urls && doc.file_urls.length > 0 && (
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {doc.file_urls.length} file{doc.file_urls.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-dashed border-border p-12 text-center">
          <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No documents found.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={handleNew}>
            <Plus className="w-4 h-4 mr-1" /> Create your first document
          </Button>
        </div>
      )}

      {/* Editor dialog */}
      <KbDocumentEditor
        open={editorOpen}
        document={editingDoc}
        onClose={() => setEditorOpen(false)}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
      />
    </div>
  );
}