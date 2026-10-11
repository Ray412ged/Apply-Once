import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { queryClientInstance } from "@/lib/query-client";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import DownloadDataButton from "@/components/DownloadDataButton";

// All profile-related custom entities that must be deleted.
// Used only by the "profile" mode (delete profile, keep account active) —
// full account deletion now runs through the deleteUserAccount backend
// function instead, which has its own complete, verified entity list.
const PROFILE_ENTITIES = [
  "UserProfile",
  "JobPreference",
  "EmploymentRecord",
  "EducationRecord",
  "Skill",
  "Credential",
  "Reference",
  "UserDocument",
  "ReusableAnswer",
  "JobMatch",
  "Application",
];

const MODE_CONFIG = {
  profile: {
    title: "Delete Profile?",
    description:
      "This will permanently delete all your profile data, work history, and documents. Your account will remain active. This cannot be undone.",
    buttonLabel: "Yes, Delete My Profile",
    showDownload: true,
  },
  account: {
    title: "Delete Account?",
    description:
      "This will permanently delete your profile, work history, documents, all application data, and your account. This cannot be undone.",
    buttonLabel: "Yes, Delete Everything",
    showDownload: true,
  },
};

export default function DeleteProfileSheet({ open, onOpenChange, mode }) {
  const { logout } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const effectiveMode = mode || "account";
  const config = MODE_CONFIG[effectiveMode] || MODE_CONFIG.account;

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      if (effectiveMode === "profile") {
        // Delete Profile: wipe all entity records, keep account active.
        await Promise.all(
          PROFILE_ENTITIES.map((entity) =>
            base44.entities[entity].deleteMany({}).catch(() => {})
          )
        );
        queryClientInstance.clear();
        // User stays logged in; Home.jsx will create a fresh empty profile.
        window.location.href = "/home";
      } else {
        // Delete Account: run the full deletion (all associated data +
        // the User record itself) through a service-role backend
        // function — a normal user cannot reliably delete their own
        // built-in User record directly, and this function verifies the
        // deletion actually took effect rather than trusting a
        // non-throwing call. Only proceed to sign the user out if the
        // function reports genuine, confirmed success — otherwise stop
        // here and show a clear error, per the requirement that deletion
        // must never be presented as successful when it wasn't.
        const result = await base44.functions.invoke("deleteUserAccount", {});
        const data = result?.data || result;

        if (!data?.success) {
          setDeleteError(
            data?.error ||
              "Account deletion could not be completed. Your account has not been deleted."
          );
          setDeleting(false);
          return;
        }

        queryClientInstance.clear();
        // Sign out only after confirmed deletion.
        logout(false);
        window.location.href = "/login";
      }
    } catch (err) {
      console.error("Failed to delete:", err);
      setDeleteError(
        "Something went wrong while deleting your account. Please try again, or contact support if this continues."
      );
      setDeleting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            {config.title}
          </SheetTitle>
          <SheetDescription>{config.description}</SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-3">
          {config.showDownload && (
            <div className="bg-accent rounded-xl p-3">
              <p className="text-sm text-accent-foreground mb-1">
                Want to save a copy first?
              </p>
              <DownloadDataButton />
            </div>
          )}

          {deleteError && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 flex gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{deleteError}</p>
            </div>
          )}

          <Button
            variant="destructive"
            className="w-full h-12 font-semibold"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-5 h-5 mr-2" />
                {config.buttonLabel}
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            className="w-full h-12"
            onClick={() => onOpenChange(false)}
            disabled={deleting}
          >
            Cancel
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}