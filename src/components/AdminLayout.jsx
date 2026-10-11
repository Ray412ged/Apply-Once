import React, { useState } from "react";
import { Outlet, NavLink, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import {
  LayoutDashboard,
  FileText,
  Building2,
  Plus,
  Users,
  Upload,
  Search,
  Settings,
  MessageSquare,
  BookOpen,
  Menu,
  X,
  LogOut,
} from "lucide-react";

const navItems = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/jobs", label: "Job Postings", icon: FileText },
  { to: "/admin/import", label: "Import Jobs", icon: Upload },
  { to: "/admin/employer-sources", label: "Employer Sources", icon: Building2 },
  { to: "/admin/local-jobs/add", label: "Add Local Job", icon: Plus },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/search-runs", label: "Search Runs", icon: Search },
  { to: "/admin/reusable-answers", label: "Reusable Answers", icon: MessageSquare },
  { to: "/admin/knowledge-base", label: "Knowledge Base", icon: BookOpen },
  { to: "/admin/participant-lookup", label: "Participant Lookup", icon: Search },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redirect non-admins to home
  if (user && user.role !== "admin") {
    return <Navigate to="/home" replace />;
  }

  const handleLogout = () => {
    logout();
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-6 py-6 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">AO</span>
          </div>
          <div>
            <p className="font-heading font-bold text-foreground leading-tight">Apply Once</p>
            <p className="text-xs text-muted-foreground">Customer Deployment Admin</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              }`
            }
          >
            <Icon className="w-5 h-5" aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors w-full"
        >
          <LogOut className="w-5 h-5" aria-hidden="true" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-sidebar border-r border-sidebar-border fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-64 bg-sidebar shadow-xl animate-slide-up">
            <button
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-6 h-6" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-20 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-accent"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6 text-foreground" />
          </button>
          <span className="font-heading font-bold text-foreground">Deployment Admin</span>
          <div className="w-10" />
        </header>

        <main className="p-4 lg:p-8 max-w-6xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}