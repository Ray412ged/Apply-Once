import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { isGuest } from "@/lib/guestStorage";
import { findDueFollowupLink } from "@/lib/followupCheckin";
import EmploymentStatusCard from "@/components/dashboard/EmploymentStatusCard";

// Renders the (at most one) due post-engagement follow-up check-in, or
// nothing at all. Reuses EmploymentStatusCard entirely — no new form, no
// new copy — this component's only job is deciding IF the prompt shows.
// Guests are skipped (they have no ParticipantOrgLink history at all).
export default function FollowupCheckinBanner({ profile, onUpdated, onDueChange }) {
  const [dueLink, setDueLink] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (isGuest() || !profile) {
        setLoading(false);
        onDueChange?.(false);
        return;
      }
      try {
        const links = await base44.entities.ParticipantOrgLink.filter(
          { status: "revoked", post_engagement_followup_consent: true },
          "-revoked_at",
          20
        );
        const due = findDueFollowupLink(links, profile.employment_status);
        setDueLink(due);
        onDueChange?.(!!due);
      } catch (err) {
        console.error("Failed to check for a due follow-up:", err);
        onDueChange?.(false);
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const markAnswered = async () => {
    if (!dueLink) return;
    try {
      await base44.functions.invoke("recordFollowupCheckinAnswered", { link_id: dueLink.id });
    } catch (err) {
      console.error("Failed to record follow-up answer:", err);
    } finally {
      // Hide regardless of network outcome — this is a one-time, low-stakes
      // prompt; re-showing it next session on a transient error is worse
      // than occasionally missing one answer being recorded.
      setDueLink(null);
      onDueChange?.(false);
    }
  };

  if (loading || !dueLink || !profile) return null;

  return (
    <EmploymentStatusCard
      profile={profile}
      onUpdated={onUpdated}
      checkinMode
      onStillSearching={markAnswered}
    />
  );
}