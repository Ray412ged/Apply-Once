import React from "react";
import { useNavigate } from "react-router-dom";
import { User, CheckCircle2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import CopyButton from "./CopyButton";

function ContactField({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-border last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground truncate">{value || "Not provided"}</p>
      </div>
      {value ? (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <CheckCircle2 className="w-4 h-4 text-success" />
          <CopyButton text={value} className="h-10 px-4 text-sm" />
        </div>
      ) : (
        <span className="text-xs text-muted-foreground flex-shrink-0">Add in profile</span>
      )}
    </div>
  );
}

export default function ContactInfoStep({ profile, completed, onComplete }) {
  const navigate = useNavigate();

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="p-4 pb-2">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Start with Contact Information</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          These are the fields most employer applications ask for first.
        </p>
      </div>

      <div className="px-4 pb-2">
        {profile ? (
          <>
            <ContactField label="First Name" value={profile.first_name} />
            <ContactField label="Last Name" value={profile.last_name} />
            <ContactField label="Email" value={profile.email} />
            <ContactField label="Phone" value={profile.phone} />
            <ContactField label="City" value={profile.city} />
            <ContactField label="State" value={profile.state} />
            <ContactField label="ZIP Code" value={profile.postal_code} />
          </>
        ) : (
          <div className="py-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              No profile information saved yet.
            </p>
            <button
              onClick={() => navigate("/profile")}
              className="text-primary hover:underline text-sm font-medium"
            >
              Add your information
            </button>
          </div>
        )}
      </div>

      {profile && (
        <div className="px-4 pb-4 pt-1">
          <label
            className={`w-full flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
              completed
                ? "bg-success/5 border-success/20"
                : "bg-accent/50 border-border hover:bg-accent"
            }`}
          >
            <Checkbox checked={completed} onCheckedChange={onComplete} />
            <span className="text-sm font-medium text-foreground">
              {completed
                ? "Contact information entered"
                : "I entered my contact information"}
            </span>
          </label>
        </div>
      )}
    </div>
  );
}