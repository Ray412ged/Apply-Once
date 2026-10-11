import React from "react";
import { Check, Pencil, X, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Three standardized confirmation states for profile items.
// state: "pending" (blue) | "confirmed" (green) | "needs_attention" (amber)
export default function ConfirmationCard({
  state = "pending",
  icon: Icon,
  title,
  subtitle,
  details,
  attentionNote,
  onConfirm,
  onEdit,
  onRemove,
  confirming = false,
}) {
  if (state === "confirmed") {
    return (
      <div className="bg-card rounded-2xl border border-success/30 p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
            <Check className="w-5 h-5 text-success" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground">{title}</p>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
            {details && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{details}</p>}
          </div>
          {onEdit && (
            <Button size="sm" variant="ghost" onClick={onEdit} className="h-9">
              <Pencil className="w-4 h-4 mr-1" />
              Edit
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (state === "needs_attention") {
    return (
      <div className="bg-card rounded-2xl border border-warning/40 p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-warning" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground">{title}</p>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
            {attentionNote && (
              <p className="text-xs text-warning mt-1 font-medium">{attentionNote}</p>
            )}
          </div>
        </div>
        {onEdit && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onEdit} className="h-9 flex-1">
              <Pencil className="w-4 h-4 mr-1" />
              Edit
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Default: pending (blue)
  return (
    <div className="bg-card rounded-2xl border border-primary/30 p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground">{title}</p>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          {details && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{details}</p>}
        </div>
      </div>
      <div className="flex gap-2">
        {onConfirm && (
          <Button size="sm" onClick={onConfirm} disabled={confirming} className="h-9 flex-1">
            {confirming ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
            {confirming ? "Saving..." : "Confirm"}
          </Button>
        )}
        {onEdit && (
          <Button size="sm" variant="outline" onClick={onEdit} className="h-9 flex-1">
            <Pencil className="w-4 h-4 mr-1" />
            Edit
          </Button>
        )}
        {onRemove && (
          <Button size="sm" variant="ghost" onClick={onRemove} className="h-9">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}