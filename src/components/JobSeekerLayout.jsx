import React from "react";
import { Outlet, NavLink, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Home, User, Briefcase, ClipboardList, MoreHorizontal, Loader2 } from "lucide-react";
import { useOrgStaffDestination } from "@/hooks/useOrgStaffDestination";

const navItems = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/profile", label: "My Profile", icon: User },
  { to: "/jobs", label: "Jobs", icon: Briefcase },
  { to: "/applications", label: "Applications", icon: ClipboardList },
  { to: "/more", label: "More", icon: MoreHorizontal },
];

export default function JobSeekerLayout() {
  const { user } = useAuth();
  const shouldCheckStaff = !!user && user.role !== "admin";
  const { loading: staffLoading, destination: staffDestination, error: staffError } =
    useOrgStaffDestination(shouldCheckStaff);

  if (user?.role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (staffLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
      </div>
    );
  }

  if (staffError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">{staffError}</p>
      </div>
    );
  }

  if (staffDestination) {
    return <Navigate to={staffDestination} replace />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 pb-24 max-w-2xl w-full mx-auto px-4">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-50 bg-card border-t border-border safe-bottom">
        <div className="max-w-2xl mx-auto flex items-stretch justify-around">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 py-2 px-1 flex-1 transition-colors min-h-[64px] ${
                  isActive
                    ? "text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              {({ isActive }) => (
                <span
                  className={`flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl transition-colors ${
                    isActive ? "bg-accent/60" : ""
                  }`}
                >
                  <Icon
                    className="w-6 h-6"
                    strokeWidth={isActive ? 2.5 : 2}
                    aria-hidden="true"
                  />
                  <span className={`text-xs ${isActive ? "font-semibold" : "font-medium"}`}>
                    {label}
                  </span>
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}