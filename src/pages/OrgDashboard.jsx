import React, { useState, useEffect } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Loader2,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  ShieldAlert,
  FileBarChart,
  Briefcase,
  CalendarClock,
} from "lucide-react";
import DashboardStatTile from "@/components/dashboard/DashboardStatTile";
import OrgParticipantIntakePanel from "@/components/organization/OrgParticipantIntakePanel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Organizational Dashboard — read-only, aggregate-and-status view for org
// staff. Answers exactly one question: which participants need attention
// today. No messaging, case notes, task assignment, calendar, or
// participant-editing anywhere here or planned for any future phase.
//
// Deliberately excluded, permanently: "Jobs Viewed" and "Jobs Saved" — the
// getOrgDashboard function never reads or returns this data at all.
const STATUS_COLORS = {
  "Needs Encouragement": "hsl(var(--warning))",
  "Building Profile": "hsl(var(--primary))",
  "Ready to Apply": "hsl(var(--success))",
  Employed: "hsl(215 16% 55%)",
};

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl bg-muted/40 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground mt-1">{value}</p>
    </div>
  );
}

export default function OrgDashboard() {
  const { slug } = useParams();
  const { session } = useOutletContext();
  const [org, setOrg] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [participantDetail, setParticipantDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const orgs = await base44.entities.Organization.filter({ slug }, "-created_date", 1);
        if (orgs.length === 0) {
          setError("Auberle Employment Institute workspace unavailable.");
          return;
        }
        setOrg(orgs[0]);
        const result = await base44.functions.invoke("getOrgDashboard", {});
        if (result?.data?.error) {
          setError(result.data.error);
          return;
        }
        setData(result?.data || result);
      } catch (err) {
        setError(err?.response?.data?.error || "Couldn't load this dashboard. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-3">
          <ShieldAlert className="w-10 h-10 text-muted-foreground mx-auto" />
          <p className="text-foreground font-semibold">{error}</p>
          <p className="text-sm text-muted-foreground">
            If you believe this is a mistake, contact your Apply Once administrator.
          </p>
        </div>
      </div>
    );
  }

  const brandColor = org?.primary_color || undefined;
  const statusOrder = ["Needs Encouragement", "Building Profile", "Ready to Apply", "Employed"];
  const grouped = statusOrder.map((status) => ({
    status,
    participants: (data?.participants || []).filter((p) => p.status === status),
  }));
  async function openParticipant(participantId) {
    if (session?.org_role !== "org_admin") return;
    setDetailLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("getOrgParticipantDetail", { participant_id: participantId });
      const payload = res?.data || res;
      if (payload?.error) throw new Error(payload.error);
      setParticipantDetail(payload);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Could not load participant activity.");
    } finally {
      setDetailLoading(false);
    }
  }

  const momentumBadge = (m) => {
    if (m === "Building Momentum")
      return (
        <span className="inline-flex items-center gap-1 text-xs bg-success/10 text-success px-2.5 py-1 rounded-full">
          <TrendingUp className="w-3 h-3" /> {m}
        </span>
      );
    if (m === "Momentum Slowing")
      return (
        <span className="inline-flex items-center gap-1 text-xs bg-warning/10 text-warning px-2.5 py-1 rounded-full">
          <TrendingDown className="w-3 h-3" /> {m}
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1 text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full">
        <Minus className="w-3 h-3" /> {m}
      </span>
    );
  };

  return (
      <main className="p-5 max-w-2xl mx-auto space-y-6">
        {session?.org_role === "org_admin" && <OrgParticipantIntakePanel />}

        <div className="grid grid-cols-2 gap-3">
          <DashboardStatTile icon={Users} label="Active participants" value={data?.total_active_participants ?? 0} accent="primary" accentColor={brandColor} />
          <DashboardStatTile icon={Briefcase} label="Employed" value={data?.by_status?.Employed ?? 0} accent="success" />
          <DashboardStatTile icon={FileBarChart} label="Applications this week" value={data?.applications_submitted_this_week ?? 0} accent="primary" accentColor={brandColor} />
          <DashboardStatTile icon={CalendarClock} label="Inactive 14+ days" value={data?.inactive_14_plus_days ?? 0} accent="warning" />
        </div>

        <div className="space-y-4">
          <h2 className="font-semibold text-foreground">Participants</h2>
          {grouped.map(({ status, participants }) => (
            <div key={status} className="bg-card rounded-2xl border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[status] }} />
                <h3 className="font-semibold text-foreground">{status}</h3>
                <span className="ml-auto text-sm text-muted-foreground">{participants.length}</span>
              </div>
              {participants.length === 0 ? (
                <p className="text-sm text-muted-foreground">No one in this category right now.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {participants.map((p) => (
                    <li key={p.participant_id} className="py-2.5 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        className={`text-left text-sm text-foreground ${session?.org_role === "org_admin" ? "hover:text-primary hover:underline" : ""}`}
                        onClick={() => openParticipant(p.participant_id)}
                        disabled={session?.org_role !== "org_admin" || detailLoading}
                      >
                        {p.participant_name}
                        {status === "Employed" && p.employer_name && (
                          <span className="text-muted-foreground">
                            {" "}
                            — {p.position_title ? `${p.position_title} at ` : ""}
                            {p.employer_name}
                          </span>
                        )}
                      </button>
                      {status !== "Employed" && momentumBadge(p.momentum)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {participantDetail && (
          <Dialog open={!!participantDetail} onOpenChange={(v) => !v && setParticipantDetail(null)}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Participant Activity</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="rounded-xl bg-muted/40 p-4">
                  <p className="font-semibold text-foreground">{participantDetail.participant?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {participantDetail.participant?.email}
                    {participantDetail.participant?.phone ? ` · ${participantDetail.participant.phone}` : ""}
                  </p>
                  {participantDetail.participant?.referring_staff && (
                    <p className="text-xs text-muted-foreground mt-1">Referred by {participantDetail.participant.referring_staff}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <MiniStat label="Profile" value={`${participantDetail.participant?.profile_completion_percentage || 0}%`} />
                  <MiniStat label="Resume" value={participantDetail.participant?.resume_ready ? "Ready" : "Not ready"} />
                  <MiniStat label="Applications" value={participantDetail.applications?.length || 0} />
                  <MiniStat label="Status" value={participantDetail.participant?.employment_status || "Searching"} />
                </div>
                <p className="text-sm text-muted-foreground">
                  Last active: {participantDetail.participant?.last_activity_at
                    ? new Date(participantDetail.participant.last_activity_at).toLocaleString()
                    : "No activity yet"}
                </p>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">Applications</h3>
                  {participantDetail.applications?.length ? (
                    <div className="space-y-2">
                      {participantDetail.applications.slice(0, 20).map((app) => (
                        <div key={app.id} className="rounded-xl border border-border p-3">
                          <p className="text-sm font-medium text-foreground">{app.job_title || "Job application"}</p>
                          <p className="text-xs text-muted-foreground">
                            {[app.employer_name, app.status].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-muted-foreground">No applications yet.</p>}
                </div>

                <Button className="w-full" onClick={() => setParticipantDetail(null)}>Close</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

      </main>
  );
}