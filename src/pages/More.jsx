import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { isGuest } from "@/lib/guestStorage";
import { useProfileData } from "@/hooks/useProfileData";
import { Button } from "@/components/ui/button";
import {
  Settings,
  HelpCircle,
  Shield,
  Info,
  Trash2,
  ChevronRight,
  LogOut,
  Cloud,
  HardDrive,
  Building2,
  Link2,
} from "lucide-react";
import SettingsSheet from "@/components/more/SettingsSheet";
import HelpSheet from "@/components/more/HelpSheet";
import PrivacySheet from "@/components/more/PrivacySheet";
import AboutSheet from "@/components/more/AboutSheet";
import DeleteProfileSheet from "@/components/more/DeleteProfileSheet";
import DisconnectOrgSheet from "@/components/more/DisconnectOrgSheet";

const MENU_ITEMS = [
  { id: "settings", label: "Settings", icon: Settings, subtitle: "Manage your preferences" },
  { id: "help", label: "Help", icon: HelpCircle, subtitle: "How Apply Once works" },
  { id: "privacy", label: "Privacy", icon: Shield, subtitle: "How your data is stored" },
  { id: "about", label: "About", icon: Info, subtitle: "About this app" },
];

export default function More() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const guest = isGuest();
  const { data: profileData } = useProfileData();
  const [openSheet, setOpenSheet] = useState(null);
  const [deleteMode, setDeleteMode] = useState(null);
  const [orgLink, setOrgLink] = useState(null);
  const [org, setOrg] = useState(null);
  const [orgLoading, setOrgLoading] = useState(!guest);
  const [disconnectOpen, setDisconnectOpen] = useState(false);

  useEffect(() => {
    if (guest || !user?.id) {
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
        const link = links[0] || null;
        setOrgLink(link);
        if (link) {
          try {
            const orgRecord = await base44.entities.Organization.get(link.organization_id);
            setOrg(orgRecord || null);
          } catch (_) {
            setOrg(null);
          }
        } else {
          setOrg(null);
        }
      } catch (_) {
        // ignore — the organization section simply won't render
      } finally {
        if (active) setOrgLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user?.id, guest]);

  const profile = profileData?.profile;
  const displayName =
    profile?.preferred_name || profile?.first_name || (guest ? "Guest" : "User");
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
              {guest ? "Guest Mode" : "Cloud Account"}
            </p>
          </div>
        </div>

        {/* Storage mode explanation */}
        {guest ? (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-accent/40 border border-primary/15">
            <HardDrive className="w-4 h-4 text-accent-foreground flex-shrink-0 mt-0.5" />
            <p className="text-xs text-foreground">
              Your profile is saved on this device only. Create a cloud account
              to access it from any device.
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-success/5">
            <Cloud className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Your profile is saved to your cloud account and accessible from
              any device.
            </p>
          </div>
        )}

        {/* Email distinction */}
        {!guest && accountEmail && (
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

        {guest && contactEmail && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-sm gap-2">
              <span className="text-muted-foreground flex-shrink-0">Contact email</span>
              <span className="font-medium text-foreground truncate">{contactEmail}</span>
            </div>
          </div>
        )}
      </div>

      {/* Guest: Create Cloud Account */}
      {guest && (
        <Button
          onClick={() => (window.location.href = "/welcome")}
          className="w-full h-12 font-semibold"
        >
          <Cloud className="w-5 h-5 mr-2" />
          Create Cloud Account
        </Button>
      )}

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

      {/* Organization connection */}
      {!guest && !orgLoading && (
        <div>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-2 px-1">
            Organization
          </h2>
          <div className="bg-card rounded-2xl border border-border divide-y divide-border">
            {orgLink && org ? (
              <>
                <div className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{org.display_name || org.name}</p>
                    <p className="text-sm text-muted-foreground">Connected</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/organization-consent")}
                  className="w-full flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors text-left"
                >
                  <Link2 className="w-5 h-5 text-muted-foreground" />
                  <p className="font-medium text-foreground flex-1">Change organization</p>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
                <button
                  onClick={() => setDisconnectOpen(true)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-destructive/5 transition-colors text-left"
                >
                  <Trash2 className="w-5 h-5 text-destructive" />
                  <p className="font-medium text-destructive flex-1">Disconnect</p>
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate("/organization-consent")}
                className="w-full flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors text-left"
              >
                <Building2 className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">Connect to an organization</p>
                  <p className="text-sm text-muted-foreground">Share your progress with a supporting organization</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Organization connection */}
      {!guest && !orgLoading && (
        <div>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-2 px-1">
            Organization
          </h2>
          <div className="bg-card rounded-2xl border border-border divide-y divide-border">
            {orgLink && org ? (
              <>
                <div className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{org.display_name || org.name}</p>
                    <p className="text-sm text-muted-foreground">Connected</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/organization-consent")}
                  className="w-full flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors text-left"
                >
                  <Link2 className="w-5 h-5 text-muted-foreground" />
                  <p className="font-medium text-foreground flex-1">Change organization</p>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
                <button
                  onClick={() => setDisconnectOpen(true)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-destructive/5 transition-colors text-left"
                >
                  <Trash2 className="w-5 h-5 text-destructive" />
                  <p className="font-medium text-destructive flex-1">Disconnect</p>
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate("/organization-consent")}
                className="w-full flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors text-left"
              >
                <Building2 className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">Connect to an organization</p>
                  <p className="text-sm text-muted-foreground">Share your progress with a supporting organization</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Account actions */}
      <div>
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-2 px-1">
          {guest ? "Profile" : "Account"}
        </h2>
        <div className="bg-card rounded-2xl border border-border divide-y divide-border">
          {!guest && (
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
          )}
          {guest && (
            <button
              onClick={() => { setDeleteMode("guest"); setOpenSheet("delete"); }}
              className="w-full flex items-center gap-3 p-4 hover:bg-destructive/5 transition-colors text-left"
            >
              <Trash2 className="w-5 h-5 text-destructive" />
              <p className="font-medium text-destructive flex-1">Delete Profile</p>
            </button>
          )}
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
      <DisconnectOrgSheet
        open={disconnectOpen}
        onOpenChange={setDisconnectOpen}
        orgName={org?.display_name || org?.name}
        participantId={user?.id}
        organizationId={orgLink?.organization_id}
        onDisconnected={() => {
          setOrgLink(null);
          setOrg(null);
        }}
      />
    </div>
  );
}