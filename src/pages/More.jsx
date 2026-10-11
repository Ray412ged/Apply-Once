import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useProfileData } from "@/hooks/useProfileData";
import {
  Settings,
  HelpCircle,
  Shield,
  Info,
  Trash2,
  ChevronRight,
  LogOut,
  Cloud,
  Building2,
} from "lucide-react";
import SettingsSheet from "@/components/more/SettingsSheet";
import HelpSheet from "@/components/more/HelpSheet";
import PrivacySheet from "@/components/more/PrivacySheet";
import AboutSheet from "@/components/more/AboutSheet";
import DeleteProfileSheet from "@/components/more/DeleteProfileSheet";

const MENU_ITEMS = [
  { id: "settings", label: "Settings", icon: Settings, subtitle: "Manage your preferences" },
  { id: "help", label: "Help", icon: HelpCircle, subtitle: "How Apply Once works" },
  { id: "privacy", label: "Privacy", icon: Shield, subtitle: "How your data is stored" },
  { id: "about", label: "About", icon: Info, subtitle: "About this app" },
];

export default function More() {
  const { user, logout } = useAuth();
  const { data: profileData } = useProfileData();
  const [openSheet, setOpenSheet] = useState(null);
  const [deleteMode, setDeleteMode] = useState(null);
  const [orgLink, setOrgLink] = useState(null);
  const [orgLoading, setOrgLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setOrgLoading(false);
      return;
    }
    let active = true;
    (async () => {
      try {
        const links = await base44.entities.ParticipantOrgLink.filter(
          { participant_id: user.id, status: "active" },
          "-linked_at",
          5
        );
        if (!active) return;
        setOrgLink(links[0] || null);
      } catch {
        // ignore — the employment support section simply won't render
      } finally {
        if (active) setOrgLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user?.id]);

  const profile = profileData?.profile;
  const displayName = profile?.preferred_name || profile?.first_name || "User";
  const contactEmail = profile?.email;
  const accountEmail = user?.email;

  const closeSheet = () => setOpenSheet(null);

  return (
    <div className="py-6 space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">More</h1>
      </div>

      {/* Account info card */}
      <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
            {displayName[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">{displayName}</p>
            <p className="text-sm text-muted-foreground">
              Cloud Account
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 rounded-xl bg-success/5">
          <Cloud className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Your profile is saved to your account and accessible from any device.
          </p>
        </div>

        {/* Email distinction */}
        {accountEmail && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-sm gap-2">
              <span className="text-muted-foreground flex-shrink-0">Account login</span>
              <span className="font-medium text-foreground truncate">{accountEmail}</span>
            </div>
            <div className="flex items-center justify-between text-sm gap-2">
              <span className="text-muted-foreground flex-shrink-0">Contact email</span>
              <span className="font-medium text-foreground truncate">
                {contactEmail || "Not provided"}
              </span>
            </div>
          </div>
        )}

      </div>

      {/* Menu items */}
      <div className="bg-card rounded-2xl border border-border divide-y divide-border">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setOpenSheet(item.id)}
              className="w-full flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors text-left"
            >
              <Icon className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium text-foreground">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.subtitle}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          );
        })}
      </div>

      {/* Auberle Employment Institute support */}
      {!orgLoading && orgLink && (
        <div>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-2 px-1">
            Employment Support
          </h2>
          <div className="bg-card rounded-2xl border border-border">
            <div className="flex items-center gap-3 p-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Auberle Employment Institute</p>
                <p className="text-sm text-muted-foreground">Your employment support team</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Account actions */}
      <div>
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-2 px-1">
          Account
        </h2>
        <div className="bg-card rounded-2xl border border-border divide-y divide-border">
          <>
              <button
                onClick={() => logout()}
                className="w-full flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors text-left"
              >
                <LogOut className="w-5 h-5 text-muted-foreground" />
                <p className="font-medium text-foreground flex-1">Sign Out</p>
              </button>
              <button
                onClick={() => { setDeleteMode("profile"); setOpenSheet("delete"); }}
                className="w-full flex items-center gap-3 p-4 hover:bg-destructive/5 transition-colors text-left"
              >
                <Trash2 className="w-5 h-5 text-destructive" />
                <p className="font-medium text-destructive flex-1">Delete Profile</p>
              </button>
              <button
                onClick={() => { setDeleteMode("account"); setOpenSheet("delete"); }}
                className="w-full flex items-center gap-3 p-4 hover:bg-destructive/5 transition-colors text-left"
              >
                <Trash2 className="w-5 h-5 text-destructive" />
                <p className="font-medium text-destructive flex-1">Delete Account</p>
              </button>
          </>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center pb-4">
        Apply Once v0.1 · Your supportive employment assistant
      </p>

      {/* Bottom sheets */}
      <SettingsSheet open={openSheet === "settings"} onOpenChange={(v) => !v && closeSheet()} />
      <HelpSheet open={openSheet === "help"} onOpenChange={(v) => !v && closeSheet()} />
      <PrivacySheet open={openSheet === "privacy"} onOpenChange={(v) => !v && closeSheet()} />
      <AboutSheet open={openSheet === "about"} onOpenChange={(v) => !v && closeSheet()} />
      <DeleteProfileSheet open={openSheet === "delete"} onOpenChange={(v) => !v && closeSheet()} mode={deleteMode} />
    </div>
  );
}