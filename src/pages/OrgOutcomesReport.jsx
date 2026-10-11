import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Loader2,
  ShieldAlert,
  ArrowLeft,
  Info,
  Users,
  FileCheck,
  FileText,
  Send,
  ThumbsUp,
  Briefcase,
  CalendarClock,
  Activity,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import DashboardStatTile from "@/components/dashboard/DashboardStatTile";

// Program Outcomes Reporting (Phase 7) — cumulative, all-time figures for
// grant reporting and program evaluation, distinct from the day-to-day
// dashboard (which only covers today's active caseload). Every figure here
// carries the methodology note returned by getOrgOutcomesReport rather
// than presenting numbers as more precise or verified than they are.
export default function OrgOutcomesReport() {
  const { slug } = useParams();
  const [org, setOrg] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const orgs = await base44.entities.Organization.filter({ slug }, "-created_date", 1);
        if (orgs.length === 0) {
          setError("No organization found for this link.");
          return;
        }
        setOrg(orgs[0]);
        const result = await base44.functions.invoke("getOrgOutcomesReport", {});
        if (result?.data?.error) {
          setError(result.data.error);
          return;
        }
        setData(result?.data || result);
      } catch (err) {
        setError(err?.response?.data?.error || "Couldn't load this report. Please try again.");
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
        </div>
      </div>
    );
  }

  const orgName = org?.display_name || org?.name;
  const brandColor = org?.primary_color || undefined;

  // A simple funnel view of the program journey — the most useful single
  // visual for a report meant to demonstrate program impact at a glance.
  const funnelData = [
    { stage: "Enrolled", count: data?.participants_enrolled ?? 0 },
    { stage: "Profile completed", count: data?.profiles_completed ?? 0 },
    { stage: "Applications submitted", count: data?.applications_submitted ?? 0 },
    { stage: "Ready to apply now", count: data?.currently_ready_to_apply ?? 0 },
    { stage: "Employed", count: data?.offer_accepted_count ?? 0 },
  ];

  return (
      <main className="p-5 max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-lg font-bold text-foreground">{orgName} — Program Outcomes</h1>
          <p className="text-sm text-muted-foreground">All-time, cumulative figures for reporting and evaluation.</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <h2 className="font-semibold text-foreground mb-3">Program journey</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={funnelData} layout="vertical" margin={{ left: 0, right: 16 }}>
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="stage" width={140} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "hsl(var(--muted))" }} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={22}>
                {funnelData.map((entry, i) => (
                  <Cell
                    key={entry.stage}
                    fill={
                      i === funnelData.length - 1
                        ? "hsl(var(--success))"
                        : brandColor || "hsl(var(--primary))"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <DashboardStatTile icon={Users} label="Participants enrolled" value={data?.participants_enrolled ?? 0} accent="primary" accentColor={brandColor} />
          <DashboardStatTile icon={FileCheck} label="Profiles completed" value={data?.profiles_completed ?? 0} accent="primary" accentColor={brandColor} />
          <DashboardStatTile icon={FileText} label="Resumes generated" value={data?.resumes_generated ?? 0} accent="primary" accentColor={brandColor} />
          <DashboardStatTile icon={Send} label="Applications submitted" value={data?.applications_submitted ?? 0} accent="primary" accentColor={brandColor} />
          <DashboardStatTile icon={ThumbsUp} label="Currently ready to apply" value={data?.currently_ready_to_apply ?? 0} accent="success" />
          <DashboardStatTile icon={Briefcase} label="Offer accepted" value={data?.offer_accepted_count ?? 0} accent="success" />
          <DashboardStatTile
            icon={CalendarClock}
            label="Avg. days to first application"
            value={data?.average_days_to_first_application != null ? data.average_days_to_first_application : "—"}
            accent="muted"
          />
          <DashboardStatTile
            icon={Activity}
            label="Avg. activity since enrollment"
            value={data?.average_activity_since_enrollment ?? "—"}
            accent="muted"
          />
        </div>

        {(data?.most_common_occupations?.length > 0 || data?.most_common_industries?.length > 0) && (
          <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
            <h2 className="font-semibold text-foreground">Most common interests</h2>
            {data?.most_common_occupations?.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Occupations</p>
                <div className="flex flex-wrap gap-1.5">
                  {data.most_common_occupations.map((c) => (
                    <span key={c.label} className="text-xs bg-accent text-accent-foreground px-2.5 py-1 rounded-full">
                      {c.label} ({c.count})
                    </span>
                  ))}
                </div>
              </div>
            )}
            {data?.most_common_industries?.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Industries</p>
                <div className="flex flex-wrap gap-1.5">
                  {data.most_common_industries.map((c) => (
                    <span key={c.label} className="text-xs bg-accent text-accent-foreground px-2.5 py-1 rounded-full">
                      {c.label} ({c.count})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Methodology — always visible, never buried, since these numbers
            may be cited in grant or funder reports */}
        <div className="bg-accent/40 border border-primary/15 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">How to read these numbers</h2>
          </div>
          <p className="text-sm text-muted-foreground">{data?.methodology?.profile_completion}</p>
          <p className="text-sm text-muted-foreground">{data?.methodology?.employment_outcomes}</p>
          <p className="text-sm text-muted-foreground">{data?.activity_since_enrollment_note}</p>
          <p className="text-sm text-muted-foreground">{data?.methodology?.general}</p>
        </div>
      </main>
  );
}