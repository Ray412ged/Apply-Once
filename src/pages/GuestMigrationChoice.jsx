import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import {
  syncGuestToAccount,
  clearAllGuestData,
  setMigrationCompleted,
  hasGuestData,
  hasMigrationCompleted,
} from "@/lib/guestStorage";
import { consumeGuestRedirect, clearGuestRedirect } from "@/lib/guestRedirect";
import { useInvalidateProfileData } from "@/hooks/useProfileData";
import { Button } from "@/components/ui/button";
import { HardDrive, RefreshCw, Loader2 } from "lucide-react";

export default function GuestMigrationChoice() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const invalidateProfileData = useInvalidateProfileData();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Guard: if there's no guest data or migration already happened, go home.
  if (!hasGuestData() || hasMigrationCompleted()) {
    return <Navigate to="/home" replace />;
  }

  const handleKeepGuest = async () => {
    setLoading(true);
    setError("");
    try {
      await syncGuestToAccount();
      setMigrationCompleted();
      invalidateProfileData();
      const redirectPath = consumeGuestRedirect();
      navigate(redirectPath, { replace: true });
    } catch (err) {
      console.error("Failed to migrate guest data:", err);
      setError("Failed to migrate your profile. Please try again.");
      setLoading(false);
    }
  };

  const handleStartFresh = async () => {
    setLoading(true);
    setError("");
    try {
      clearAllGuestData();
      setMigrationCompleted();
      invalidateProfileData();
      clearGuestRedirect();
      // Home.jsx will detect no profile and create a new empty one.
      navigate("/home", { replace: true });
    } catch (err) {
      console.error("Failed to start fresh:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col px-5 py-8 max-w-md mx-auto">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-12">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm">AO</span>
        </div>
        <span className="font-heading font-bold text-foreground text-lg">Apply Once</span>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <h1 className="text-2xl font-bold text-foreground leading-tight mb-3">
          Welcome to your cloud account!
        </h1>
        <p className="text-muted-foreground leading-relaxed mb-8">
          We found a guest profile on this device. Would you like to keep your
          progress or start fresh?
        </p>

        <div className="space-y-3">
          {/* Keep guest progress */}
          <button
            onClick={handleKeepGuest}
            disabled={loading}
            className="w-full text-left bg-primary text-primary-foreground rounded-2xl p-5 hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <div className="flex items-start gap-3">
              <HardDrive className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Keep my guest progress</p>
                <p className="text-sm opacity-90 mt-0.5">
                  Migrate your profile data to your new account.
                </p>
              </div>
            </div>
          </button>

          {/* Start fresh */}
          <button
            onClick={handleStartFresh}
            disabled={loading}
            className="w-full text-left bg-card border border-border rounded-2xl p-5 hover:bg-accent/50 transition-colors disabled:opacity-50"
          >
            <div className="flex items-start gap-3">
              <RefreshCw className="w-5 h-5 flex-shrink-0 mt-0.5 text-muted-foreground" />
              <div>
                <p className="font-semibold text-foreground">
                  Start with a fresh profile
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Delete guest data and begin with a blank profile.
                </p>
              </div>
            </div>
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 mt-6 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Processing...</span>
          </div>
        )}

        {error && (
          <div className="mt-6 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}