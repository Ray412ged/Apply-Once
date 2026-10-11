import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Loader2, History } from "lucide-react";

// Reason-gated, logged individual participant lookup (Phase 8 UI on top of
// adminParticipantLookup, built in Phase 1). This is deliberately NOT the
// default admin view — Organizations.jsx is. Every lookup here requires a
// stated reason and is recorded in AdminAccessLog by the function itself,
// before any data is returned; this screen cannot bypass that.
export default function AdminParticipantLookup() {
  const [participantId, setParticipantId] = useState("");
  const [reason, setReason] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recentLogs, setRecentLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);

  useEffect(() => {
    loadRecentLogs();
  }, []);

  async function loadRecentLogs() {
    try {
      setLogsLoading(true);
      const logs = await base44.entities.AdminAccessLog.filter({}, "-timestamp", 25);
      setRecentLogs(logs);
    } catch (err) {
      console.error("Failed to load audit log:", err);
    } finally {
      setLogsLoading(false);
    }
  }

  const handleLookup = async () => {
    setError(null);
    setResult(null);
    if (!participantId.trim() || !reason.trim()) {
      setError("Both a participant ID and a reason are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await base44.functions.invoke("adminParticipantLookup", {
        participant_id: participantId.trim(),
        reason: reason.trim(),
      });
      if (res?.data?.error) {
        setError(res.data.error);
        return;
      }
      setResult(res?.data || res);
      setReason("");
      loadRecentLogs(); // this lookup just added a new row — refresh the trail
    } catch (err) {
      setError(err?.response?.data?.error || "Lookup failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-foreground">Participant lookup</h1>
        <p className="text-sm text-muted-foreground mt-1">
          For genuine support cases only — every lookup requires a reason and is permanently logged below.
          Default to the Organizations overview for anything that doesn't need a specific person's data.
        </p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
        <div className="space-y-2">
          <Label htmlFor="participant-id">Participant ID</Label>
          <Input
            id="participant-id"
            value={participantId}
            onChange={(e) => setParticipantId(e.target.value)}
            placeholder="User ID"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lookup-reason">Reason (required, logged)</Label>
          <Textarea
            id="lookup-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Support ticket #1234 — participant reports missing employment record"
            rows={2}
          />
        </div>
        {error && (
          <p className="text-sm text-destructive flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" /> {error}
          </p>
        )}
        <Button onClick={handleLookup} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}
          Look up (will be logged)
        </Button>
      </div>

      {result && (
        <div className="bg-card rounded-2xl border border-border p-4 space-y-2">
          <h2 className="font-semibold text-foreground">Result</h2>
          <p className="text-sm text-foreground">
            {result.profile?.first_name} {result.profile?.last_name} — {result.organization_links?.length || 0}{" "}
            organization link(s), {result.activity_events?.length || 0} activity event(s) on file.
          </p>
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <History className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">Recent lookups (audit trail)</h2>
        </div>
        {logsLoading ? (
          <div className="p-4 flex justify-center">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        ) : recentLogs.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No lookups recorded yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-2.5">When</th>
                <th className="text-left px-4 py-2.5">Admin</th>
                <th className="text-left px-4 py-2.5">Participant</th>
                <th className="text-left px-4 py-2.5">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentLogs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{log.admin_id}</td>
                  <td className="px-4 py-3 text-muted-foreground">{log.participant_id}</td>
                  <td className="px-4 py-3 text-foreground">{log.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}