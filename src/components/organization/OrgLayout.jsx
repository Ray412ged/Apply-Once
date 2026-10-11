import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Building2, BriefcaseBusiness, Users, FileBarChart, Settings2, Loader2 } from "lucide-react";

export default function OrgLayout() {
  const { slug } = useParams();
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const result = await base44.functions.invoke("getOrgSession", {});
        const data = result?.data || result;
        if (data?.organization?.slug && data.organization.slug !== slug) {
          throw new Error("This account is not assigned to that organization workspace.");
        }
        if (!cancelled) setSession(data);
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.error || "Organization access unavailable.");
      }
    }
    load();
    return () => { cancelled = true; };
  }, [slug]);

  if (!session && !error) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>;
  }
  if (error) {
    return <div className="min-h-screen flex items-center justify-center p-6"><p className="text-sm text-muted-foreground">{error}</p></div>;
  }

  const orgName = session?.organization?.display_name || session?.organization?.name || "Organization";
  const isAdmin = session?.org_role === "org_admin";
  const items = [
    { to: `/org/${slug}/employers`, label: "Employers", icon: Building2 },
    { to: `/org/${slug}/opportunities`, label: "Opportunities", icon: BriefcaseBusiness },
    { to: `/org/${slug}`, label: "Job Seekers", icon: Users, end: true },
    { to: `/org/${slug}/outcomes`, label: "Reports", icon: FileBarChart },
    ...(isAdmin ? [{ to: `/org/${slug}/staff`, label: "Staff", icon: Settings2 }] : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Apply Once Organization Edition</p>
              <h1 className="text-xl font-bold text-foreground">{orgName}</h1>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
              {isAdmin ? "Organization Admin" : "Staff"}
            </span>
          </div>
          <nav className="flex gap-2 overflow-x-auto no-scrollbar">
            {items.map(({ to, label, icon: Icon, end }) => (
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
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <Outlet context={{ session }} />
    </div>
  );
}