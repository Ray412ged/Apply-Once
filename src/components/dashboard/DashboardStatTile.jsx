import React from "react";

// Shared stat-tile treatment for the Organizational Dashboard family
// (OrgDashboard, OrgOutcomesReport, admin Organizations/ParticipantLookup)
// so all four screens share one visual language instead of four separate
// ad hoc ones. Accent color is themeable per-tile (org brand color where
// relevant) rather than always defaulting to the app primary.
const ACCENT_CLASSES = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  muted: "bg-muted text-muted-foreground",
};

export default function DashboardStatTile({ icon: Icon, label, value, accent = "primary", accentColor }) {
  const accentClass = ACCENT_CLASSES[accent] || ACCENT_CLASSES.primary;
  return (
    <div className="bg-card rounded-2xl border border-border p-4 flex items-start gap-3">
      {Icon && (
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${accentColor ? "" : accentClass}`}
          style={accentColor ? { backgroundColor: `${accentColor}1a`, color: accentColor } : undefined}
        >
          <Icon className="w-4.5 h-4.5" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-2xl font-bold text-foreground leading-tight">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}