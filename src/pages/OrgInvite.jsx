import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, BriefcaseBusiness } from "lucide-react";
import WelcomeAuthLayout from "@/components/WelcomeAuthLayout";
import { rememberAuberleInvite } from "@/lib/auberleInvite";

export default function OrgInvite() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await base44.functions.invoke("claimOrgReferral", { action: "preview", token });
        const payload = res?.data || res;
        if (payload?.error) throw new Error(payload.error);
        if (!cancelled) {
          setData(payload);
          rememberAuberleInvite({ token, email: payload?.email || "" });
        }
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.error || err?.message || "This invitation is unavailable.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [token]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>;
  }

  if (error) {
    return (
      <WelcomeAuthLayout eyebrow="Apply Once" title="Invitation unavailable" subtitle={error}>
        <Button className="w-full" onClick={() => navigate("/login")}>Go to Apply Once</Button>
      </WelcomeAuthLayout>
    );
  }

  return (
    <WelcomeAuthLayout
      eyebrow="Auberle Employment Institute"
      title={`Welcome${data?.participant_name ? `, ${data.participant_name.split(" ")[0]}` : ""}`}
      subtitle="Auberle Employment Institute invited you to use Apply Once for your job search."
    >
      <div className="rounded-2xl border border-border bg-card p-4 mb-5">
        <BriefcaseBusiness className="w-7 h-7 text-primary mb-2" />
        <p className="text-sm text-foreground font-medium">Your Apply Once account stays yours.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Build your profile and resume, find jobs, and apply. Auberle Employment Institute staff can see your employment progress so they can support you.
        </p>
        <p className="text-xs text-muted-foreground mt-3">
          Continuing with this invitation connects your Apply Once account to Auberle Employment Institute after your email is verified.
        </p>
      </div>

      <div className="space-y-2">
        <Button
          className="w-full h-12"
          onClick={() => navigate("/register", { state: { email: data?.email || "" } })}
        >
          Create My Account
        </Button>
        <Button
          variant="outline"
          className="w-full h-12"
          onClick={() => navigate("/login", { state: { email: data?.email || "" } })}
        >
          Sign In to My Account
        </Button>
      </div>
    </WelcomeAuthLayout>
  );
}