import React from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { saveGuestRedirect } from "@/lib/guestRedirect";
import { Button } from "@/components/ui/button";
import GoogleIcon from "@/components/GoogleIcon";
import { Mail, ArrowLeft, Shield, Sparkles } from "lucide-react";

/**
 * Account-conversion prompt shown to guests when they attempt an
 * account-dependent action (viewing a job, saving, applying, etc.).
 *
 * Preserves the intended destination via saveGuestRedirect() so that after
 * authentication + guest migration the user returns to the job they selected
 * instead of being sent back to the start of onboarding.
 *
 * variant:
 *   "page"  — full-screen block (used when a guest lands directly on a
 *             protected route like /jobs/:id)
 *   "modal" — bottom sheet overlay (used when a guest taps a job card on
 *             the /jobs dashboard)
 */
export default function GuestAccountPrompt({ redirectPath = "/jobs", onReturn, variant = "page" }) {
  const navigate = useNavigate();

  const handleGoogle = () => {
    saveGuestRedirect(redirectPath);
    base44.auth.loginWithProvider("google", "/");
  };

  const handleEmail = () => {
    saveGuestRedirect(redirectPath);
    navigate("/register");
  };

  const handleReturn = () => {
    if (onReturn) onReturn();
    else navigate("/jobs");
  };

  const content = (
    <div className="max-w-md mx-auto w-full text-center space-y-5">
      <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto">
        <Sparkles className="w-8 h-8 text-primary" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-foreground">Create your free account to continue</h2>
        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
          Save your profile, view complete job details, prepare applications, and track your progress.
        </p>
      </div>
      <div className="space-y-3">
        <div className="relative">
          <Button
            onClick={handleGoogle}
            className="w-full h-14 text-base font-semibold flex items-center justify-center"
          >
            <GoogleIcon className="w-5 h-5 mr-2.5" />
            Continue with Google
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wide bg-primary-foreground/20 text-primary-foreground px-1.5 py-0.5 rounded">
              Fastest
            </span>
          </Button>
        </div>
        <Button
          variant="outline"
          onClick={handleEmail}
          className="w-full h-14 text-base font-semibold flex items-center justify-center"
        >
          <Mail className="w-5 h-5 mr-2.5" />
          Continue with Email
        </Button>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Email registration may require a verification code to confirm your address.
        </p>
      </div>
      <Button
        variant="ghost"
        onClick={handleReturn}
        className="w-full h-11 text-sm font-medium text-muted-foreground"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" />
        Return to Job Matches
      </Button>
      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-accent rounded-xl p-3 text-left">
        <Shield className="w-4 h-4 flex-shrink-0 mt-0.5 text-primary" />
        <p>Your profile stays private. We never share it without your permission.</p>
      </div>
    </div>
  );

  if (variant === "modal") {
    return (
      <div
        className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-foreground/40 backdrop-blur-sm p-4"
        onClick={handleReturn}
      >
        <div
          className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-md p-6 animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center min-h-[80vh] px-4 py-10">
      {content}
    </div>
  );
}