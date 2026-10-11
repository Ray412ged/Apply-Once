import React, { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";

const STATUS_BADGES = {
  ready: { label: "Ready", className: "bg-success/10 text-success" },
  needs_review: { label: "Needs Review", className: "bg-warning/10 text-warning" },
  missing: { label: "Missing", className: "bg-muted text-muted-foreground" },
};

export default function AssistantSection({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
  badge,
  status,
  onEdit,
  editLabel = "Edit",
  forceOpen,
}) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (forceOpen) setOpen(true);
  }, [forceOpen]);
  const statusBadge = status ? STATUS_BADGES[status] : null;

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setOpen(!open)}
          className="flex-1 flex items-center justify-between p-4 text-left"
        >
          <div className="flex items-center gap-2">
            {Icon && <Icon className="w-5 h-5 text-primary" />}
            <h3 className="font-semibold text-foreground">{title}</h3>
            {statusBadge && (
              <span className={`text-xs rounded-full px-2 py-0.5 ${statusBadge.className}`}>
                {statusBadge.label}
              </span>
            )}
            {badge != null && !statusBadge && (
              <span className="text-xs bg-accent text-accent-foreground rounded-full px-2 py-0.5">
                {badge}
              </span>
            )}
          </div>
          <ChevronDown
            className={`w-5 h-5 text-muted-foreground transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`}
          />
        </button>
        {onEdit && (
          <button
            onClick={onEdit}
            className="text-xs font-medium text-primary hover:underline px-4 py-2 whitespace-nowrap"
          >
            {editLabel}
          </button>
        )}
      </div>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
}