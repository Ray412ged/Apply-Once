import React from "react";
import { Outlet, NavLink, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { isGuest } from "@/lib/guestStorage";
import { Button } from "@/components/ui/button";
import GuestAccountPrompt from "@/components/jobs/GuestAccountPrompt";
import { Home, User, Briefcase, ClipboardList, MoreHorizontal, Shield } from "lucide-react";

const navItems = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/profile", label: "My Profile", icon: User },
  { to: "/jobs", label: "Jobs", icon: Briefcase },
  { to: "/applications", label: "Applications", icon: ClipboardList },
  { to: "/more", label: "More", icon: MoreHorizontal },
];

// Routes where the "Guest mode" banner is shown (profile-building + settings).
const PROFILE_ROUTES = ["/home", "/profile", "/profile/edit", "/more"];

// Routes that require an account. Guests see the account-conversion prompt
// instead of the protected content — whether they land here directly (URL) or
// are routed here by an action.
function isAccountRequiredRoute(pathname) {
  if (pathname === "/applications") return true;
  if (pathname.startsWith("/jobs/") && pathname !== "/jobs") return true;
  if (pathname.startsWith("/workspace/")) return true;
  return false;
}

export default function JobSeekerLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const guest = isGuest();

  // Redirect admins to their dashboard
  if (user?.role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const isProfileRoute = PROFILE_ROUTES.some((r) => location.pathname.startsWith(r));
  const needsAccount = guest && isAccountRequiredRoute(location.pathname);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Guest mode banner — profile-building routes only */}
      {guest && isProfileRoute && !needsAccount && (
        <div className="bg-accent/40 border-b border-primary/15 px-4 py-2.5 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary flex-shrink-0" />
          <p className="text-xs text-foreground flex-1">
            Create your free account to securely save your progress and access Apply Once from any device.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs px-2"
            onClick={() => (window.location.href = "/welcome")}
          >
            Create Free Account
          </Button>
        </div>
      )}

      {needsAccount ? (
        <main className="flex-1 pb-24 max-w-2xl w-full mx-auto px-4">
          <GuestAccountPrompt
            redirectPath={location.pathname}
            onReturn={() => navigate("/jobs")}
            variant="page"
          />
        </main>
      ) : (
        <main className="flex-1 pb-24 max-w-2xl w-full mx-auto px-4">
          <Outlet />
        </main>
      )}

      {/* Bottom Navigation */}
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