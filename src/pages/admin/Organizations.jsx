import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, Building2, Users, Search, TrendingUp, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import DashboardStatTile from "@/components/dashboard/DashboardStatTile";

// Platform Administrator overview (Phase 8). Default view is aggregate-only
// — organization adoption and platform-wide counts, no participant-
// identifiable data anywhere on this screen. Individual participant
// lookups live on a separate, reason-gated screen (ParticipantLookup),
// linked from here but never inlined into this aggregate view.
export default function AdminOrganizations() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const result = await base44.functions.invoke("getPlatformAdminOverview", {});
        if (result?.data?.error) {
          setError(result.data.error);
          return;
        }
        setData(result?.data || result);
      } catch (err) {
        setError(err?.response?.data?.error || "Couldn't load the overview.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive">{error}</p>;
  }

  const topOrgs = (data?.organizations || []).filter((o) => o.active_participants > 0).slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Organizations</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Platform-wide adoption and health — aggregate only.</p>
        </div>
        <Link to="/admin/participant-lookup">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Search className="w-4 h-4" /> Participant lookup
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <DashboardStatTile icon={Building2} label="Total organizations" value={data?.total_organizations ?? 0} accent="primary" />
        <DashboardStatTile icon={Building2} label="Active organizations" value={data?.active_organizations ?? 0} accent="success" />
        <DashboardStatTile icon={TrendingUp} label="Orgs with active participants" value={data?.organizations_with_active_participants ?? 0} accent="primary" />
        <DashboardStatTile icon={Users} label="Platform-wide active participants" value={data?.total_active_participant_links ?? 0} accent="primary" />
      </div>

      {topOrgs.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-4">
          <h2 className="font-semibold text-foreground mb-3">Active participants by organization</h2>
          <ResponsiveContainer width="100%" height={Math.max(160, topOrgs.length * 36)}>
            <BarChart data={topOrgs} layout="vertical" margin={{ left: 0, right: 16 }}>
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "hsl(var(--muted))" }} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="active_participants" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-accent/40 border border-primary/15 rounded-2xl p-4 flex items-center gap-3">
        <History className="w-4 h-4 text-primary shrink-0" />
        <p className="text-sm text-muted-foreground">
          Admin participant lookups (reason-gated, logged) in the last 30 days:{" "}
          <span className="font-semibold text-foreground">{data?.admin_lookups_last_30_days ?? 0}</span>
        </p>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Building2 className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">All organizations</h2>
        </div>
        {(data?.organizations || []).length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No organizations yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-2.5">Name</th>
                <th className="text-left px-4 py-2.5">Type</th>
                <th className="text-left px-4 py-2.5">Status</th>
                <th className="text-right px-4 py-2.5">Active participants</th>
                <th className="text-right px-4 py-2.5">Ever enrolled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.organizations.map((org) => (
                <tr key={org.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-foreground font-medium">{org.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{org.organization_type}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        org.active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {org.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-foreground font-medium">
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-muted-foreground" /> {org.active_participants}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{org.total_ever_enrolled}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}