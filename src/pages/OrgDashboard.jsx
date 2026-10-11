import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
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
  Gauge,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import DashboardStatTile from "@/components/dashboard/DashboardStatTile";

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

export default function OrgDashboard() {
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
  const orgName = org?.display_name || org?.name;

  const statusOrder = ["Needs Encouragement", "Building Profile", "Ready to Apply", "Employed"];
  const grouped = statusOrder.map((status) => ({
    status,
    participants: (data?.participants || []).filter((p) => p.status === status),
  }));
  const chartData = statusOrder.map((status) => ({
    status,
    count: data?.by_status?.[status] ?? 0,
  }));

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
        <div className="grid grid-cols-2 gap-3">
          <DashboardStatTile icon={Users} label="Active participants" value={data?.total_active_participants ?? 0} accent="primary" accentColor={brandColor} />
          <DashboardStatTile icon={Briefcase} label="Employed" value={data?.by_status?.Employed ?? 0} accent="success" />
          <DashboardStatTile icon={FileBarChart} label="Applications this week" value={data?.applications_submitted_this_week ?? 0} accent="primary" accentColor={brandColor} />
          <DashboardStatTile icon={CalendarClock} label="Inactive 14+ days" value={data?.inactive_14_plus_days ?? 0} accent="warning" />
        </div>

        <DashboardStatTile
          icon={Gauge}
          label="Average profile completion across active participants"
          value={`${data?.average_profile_completion_pct ?? 0}%`}
          accent="primary"
          accentColor={brandColor}
        />

        {/* At-a-glance status breakdown */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <h2 className="font-semibold text-foreground mb-3">Status at a glance</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 16 }}>
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="status" width={130} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "hsl(var(--muted))" }} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={22}>
                {chartData.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Which participants need attention today */}
        <div className="space-y-4">
          <h2 className="font-semibold text-foreground">Who needs your attention today</h2>
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
                      <span className="text-sm text-foreground">
                        {p.participant_name}
                        {status === "Employed" && p.employer_name && (
                          <span className="text-muted-foreground">
                            {" "}
                            — {p.position_title ? `${p.position_title} at ` : ""}
                            {p.employer_name}
                          </span>
                        )}
                      </span>
                      {status !== "Employed" && momentumBadge(p.momentum)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* Program-level interests — aggregate only, never per-participant */}
        {(data?.program_career_interests?.length > 0 || data?.program_industry_interests?.length > 0) && (
          <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Users className="w-4 h-4" /> Program-level interests
            </h2>
            {data?.program_career_interests?.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Most common career interests</p>
                <div className="flex flex-wrap gap-1.5">
                  {data.program_career_interests.map((c) => (
                    <span key={c.label} className="text-xs bg-accent text-accent-foreground px-2.5 py-1 rounded-full">
                      {c.label} ({c.count})
                    </span>
                  ))}
                </div>
              </div>
            )}
            {data?.program_industry_interests?.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Most common industries</p>
                <div className="flex flex-wrap gap-1.5">
                  {data.program_industry_interests.map((c) => (
                    <span key={c.label} className="text-xs bg-accent text-accent-foreground px-2.5 py-1 rounded-full">
                      {c.label} ({c.count})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
  );
}