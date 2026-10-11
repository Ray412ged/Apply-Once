import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import OrgConsentDetail from "@/components/organization/OrgConsentDetail";
import { Building2, ChevronRight, Loader2 } from "lucide-react";

// Participant-facing consent flow. Two modes:
//  - /organization-consent        → list of active organizations to choose from
//  - /organization-consent/:orgId  → consent detail for a specific organization
// The participant always connects as themselves (participant_id == their own
// user id); manageParticipantOrgLink enforces this on the backend.
export default function OrganizationConsent() {
  const navigate = useNavigate();
  const { orgId } = useParams();
  const { user } = useAuth();
  const [orgs, setOrgs] = useState([]);
  const [currentLink, setCurrentLink] = useState(null);
  const [currentOrg, setCurrentOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [orgList, links] = await Promise.all([
          base44.entities.Organization.filter({ active: true }, "name", 200),
          user?.id
            ? base44.entities.ParticipantOrgLink.filter(
                { participant_id: user.id, status: "active" },
                "-linked_at",
                5
              )
            : Promise.resolve([]),
        ]);
        setOrgs(orgList);
        const active = links[0] || null;
        setCurrentLink(active);
        if (active) {
          const co = orgList.find((o) => o.id === active.organization_id);
          setCurrentOrg(co || null);
        }
      } catch (err) {
        setError("Couldn't load organizations. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.id]);

  const selectedOrg = orgId ? orgs.find((o) => o.id === orgId) : null;

  const handleConnect = async ({ replace_existing, post_engagement_followup_consent }) => {
    if (!selectedOrg || !user?.id) return;
    setConnecting(true);
    setError(null);
    try {
      await base44.functions.invoke("manageParticipantOrgLink", {
        participant_id: user.id,
        organization_id: selectedOrg.id,
        action: "create",
        replace_existing,
        consent_scope: "readiness_status,momentum,application_counts",
        post_engagement_followup_consent,
      });
      navigate("/more");
    } catch (err) {
      setError(err?.response?.data?.error || "Couldn't connect. Please try again.");
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-10 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (orgId && !selectedOrg) {
    return (
      <div className="py-6 space-y-4">
        <button
          onClick={() => navigate("/organization-consent")}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to organizations
        </button>
        <p className="text-muted-foreground text-sm">That organization isn't available.</p>
      </div>
    );
  }

  if (orgId && selectedOrg) {
    return (
      <div className="py-6 max-w-md mx-auto animate-fade-in">
        <OrgConsentDetail
          org={selectedOrg}
          currentLink={currentLink}
          currentOrg={currentOrg}
          onConnect={handleConnect}
          onBack={() => navigate("/organization-consent")}
          connecting={connecting}
        />
        {error && <p className="text-sm text-destructive mt-3">{error}</p>}
      </div>
    );
  }

  // List mode
  return (
    <div className="py-6 space-y-4 animate-fade-in">
      <button
        onClick={() => navigate("/more")}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back
      </button>
      <div>
        <h1 className="text-2xl font-bold text-foreground">Organizations</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Choose an organization to share your progress with.
        </p>
      </div>

      {currentLink && currentOrg && (
        <div className="bg-accent/40 border border-primary/15 rounded-xl p-3 text-sm">
          You're currently connected to{" "}
          <span className="font-medium text-foreground">
            {currentOrg.display_name || currentOrg.name}
          </span>
          . Connecting to a new organization will end that connection.
        </div>
      )}

      {orgs.length === 0 ? (
        <p className="text-muted-foreground text-sm">No organizations are available right now.</p>
      ) : (
        <div className="space-y-2">
          {orgs.map((o) => (
            <button
              key={o.id}
              onClick={() => navigate(`/organization-consent/${o.id}`)}
              className="w-full bg-card rounded-2xl border border-border p-4 flex items-center gap-3 hover:bg-accent/50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{o.display_name || o.name}</p>
                <p className="text-sm text-muted-foreground">{o.organization_type}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}