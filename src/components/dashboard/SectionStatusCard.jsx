import React from "react";

const STATUS_STYLES = {
  "Complete":        { badge: "bg-success/10 text-success",            dot: "bg-success" },
  "Needs Attention":  { badge: "bg-destructive/10 text-destructive",    dot: "bg-destructive" },
  "In Progress":       { badge: "bg-primary/10 text-primary",            dot: "bg-primary" },
  "Optional":          { badge: "bg-muted text-muted-foreground",        dot: "bg-muted-foreground/40" },
  "Not Applicable":    { badge: "bg-muted/60 text-muted-foreground/60",  dot: "bg-muted-foreground/30" },
};

export default function SectionStatusCard({ icon: Icon, label, status, detail, onClick }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES["Optional"];

  return (
    <button
      onClick={onClick}
      className="bg-card rounded-2xl border border-border p-4 text-left hover:shadow-md transition-shadow w-full"
    >
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${style.badge}`}>
          {status}
        </span>
      </div>
      <p className="font-heading font-semibold text-foreground mt-3">{label}</p>
      <p className="text-sm text-muted-foreground mt-0.5">{detail}</p>
    </button>
  );
}