import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useOrgStaffDestination } from "@/hooks/useOrgStaffDestination";
import UserNotRegisteredError from "@/components/UserNotRegisteredError";

export default function ParticipantRouteGuard() {
  const { user } = useAuth();
  const shouldCheckStaff = !!user && user.role !== "admin";
  const {
    loading: staffLoading,
    destination: staffDestination,
    error: staffError,
  } = useOrgStaffDestination(shouldCheckStaff);
  const [participantLoading, setParticipantLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (!user || user.role === "admin" || staffLoading || staffDestination || staffError) {
      return;
    }

    let cancelled = false;

    async function checkParticipantAccess() {
      setParticipantLoading(true);
      try {
        const links = await base44.entities.ParticipantOrgLink.filter(
          { participant_id: user.id, status: "active" },
          "-linked_at",
          1
        );
        if (!cancelled) setHasAccess(links.length === 1);
      } catch {
        if (!cancelled) setHasAccess(false);
      } finally {
        if (!cancelled) setParticipantLoading(false);
      }
    }

    checkParticipantAccess();
    return () => { cancelled = true; };
  }, [user, staffLoading, staffDestination, staffError]);

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

  if (participantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAccess) {
    return <UserNotRegisteredError />;
  }

  return <Outlet />;
}