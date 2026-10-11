import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Building2, BriefcaseBusiness, Users, FileBarChart, Loader2, Bell } from "lucide-react";

export default function OrgLayout() {
  const { slug } = useParams();
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const result = await base44.functions.invoke("getOrgSession", {});
        const data = result?.data || result;
        if (data?.organization?.slug && data.organization.slug !== slug) {
          throw new Error("This staff account does not have access to the Auberle Employment Institute workspace.");
        }
        if (!cancelled) setSession(data);
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.error || "Auberle Employment Institute access unavailable.");
      }
    }
    load();
    return () => { cancelled = true; };
  }, [slug]);

  useEffect(() => {
    if (session?.org_role !== "org_admin") {
      setReviewCount(0);
      return;
    }

    let cancelled = false;
    async function loadReviewCount() {
      try {
        const result = await base44.functions.invoke("orgOpportunities", { action: "list" });
        const data = result?.data || result || {};
        const count = (data.opportunities || []).filter(
          (job) => job.status === "Draft" && job.verification_status === "Unverified" && !!job.submitted_at
        ).length;
        if (!cancelled) setReviewCount(count);
      } catch {
        if (!cancelled) setReviewCount(0);
      }
    }

    loadReviewCount();
    const handleQueueChange = () => loadReviewCount();
    window.addEventListener("org-review-queue-changed", handleQueueChange);
    const timer = window.setInterval(loadReviewCount, 60000);

    return () => {
      cancelled = true;
      window.removeEventListener("org-review-queue-changed", handleQueueChange);
      window.clearInterval(timer);
    };
  }, [session?.org_role]);

  if (!session && !error) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>;
  }
  if (error) {
    return <div className="min-h-screen flex items-center justify-center p-6"><p className="text-sm text-muted-foreground">{error}</p></div>;
  }

  const orgName = "Auberle Employment Institute";
  const isAdmin = session?.org_role === "org_admin";
  const items = [
    { to: `/org/${slug}/employers`, label: "Employers", icon: Building2 },
    { to: `/org/${slug}/opportunities`, label: "Opportunities", icon: BriefcaseBusiness, badge: isAdmin ? reviewCount : 0 },
    { to: `/org/${slug}`, label: "Participants", icon: Users, end: true },
    { to: `/org/${slug}/outcomes`, label: "Reports", icon: FileBarChart },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Apply Once for {orgName}</p>
              <h1 className="text-xl font-bold text-foreground">{orgName}</h1>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && reviewCount > 0 && (
                <NavLink
                  to={`/org/${slug}/opportunities`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-3 py-1.5 text-xs font-medium text-warning hover:bg-warning/15"
                >
                  <Bell className="w-3.5 h-3.5" />
                  {reviewCount} ready for review
                </NavLink>
              )}
              <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                {isAdmin ? "EI Lead Admin" : "EI Staff"}
              </span>
            </div>
          </div>
          <nav className="flex gap-2 overflow-x-auto no-scrollbar">
            {items.map(({ to, label, icon: Icon, end, badge }) => (
              <NavLink
                key={label}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                    isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`
                }
              >
                <Icon className="w-4 h-4" /> {label}
                {!!badge && (
                  <span className="inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-warning/15 px-1.5 text-[11px] font-semibold text-warning">
                    {badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <Outlet context={{ session }} />
    </div>
  );
}