import React from "react";
import ConfirmationCard from "@/components/profile/ConfirmationCard";

// Backwards-compatible wrapper: delegates to ConfirmationCard.
// Supports an optional `state` prop ("pending" | "confirmed" | "needs_attention").
export default function ExtractedItemCard({ state = "pending", icon, title, subtitle, details, attentionNote, onConfirm, onEdit, onRemove, confirming }) {
  return (
    <ConfirmationCard
      state={state}
      icon={icon}
      title={title}
      subtitle={subtitle}
      details={details}
      attentionNote={attentionNote}
      onConfirm={onConfirm}
      onEdit={onEdit}
      onRemove={onRemove}
      confirming={confirming}
    />
  );
}