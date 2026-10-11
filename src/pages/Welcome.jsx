import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { setGuestMode, saveGuestSingle, setGuestIntroSeen, hasGuestIntroSeen } from "@/lib/guestStorage";
import { Button } from "@/components/ui/button";
import GoogleIcon from "@/components/GoogleIcon";
import { ArrowRight, Shield, Mail, UserPlus, Info, Check } from "lucide-react";

export default function Welcome() {
  const navigate = useNavigate();
  const [consent, setConsent] = useState(false);

  const handleStartWithoutEmail = () => {
    setGuestMode(true);
    saveGuestSingle("UserProfile", {
      onboarding_status: "in_progress",
      privacy_acknowledged: true,
      terms_acknowledged: true,
      consent_to_ai_processing: consent,
      consent_timestamp: consent ? new Date().toISOString() : undefined,
      profile_completion_percentage: 0,
    });
    if (!hasGuestIntroSeen()) {
      setGuestIntroSeen();
      navigate("/guest-intro");
    } else {
      navigate("/onboarding");
    }
  };

  // "Get started" jumps straight into onboarding. Establish a guest identity
  // first so the builder can persist records locally (addGuestRecord) instead
  // of hitting an unauthenticated 401 on create — which silently aborted the
  // "Save & Finish" action.
  const handleGetStarted = () => {
    setGuestMode(true);
    saveGuestSingle("UserProfile", {
      onboarding_status: "in_progress",
      privacy_acknowledged: true,
      terms_acknowledged: true,
      consent_to_ai_processing: consent,
      consent_timestamp: consent ? new Date().toISOString() : undefined,
      profile_completion_percentage: 0,
    });
    navigate("/onboarding");
  };

  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", "/");
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
        <p className="text-xs font-semibold uppercase tracking-wider text-primary/70 mb-3">
          Employment Readiness Platform
        </p>
        <h1 className="text-3xl font-bold text-foreground leading-tight mb-3">
          Get ready for your next opportunity.
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed mb-8">
          Build your professional profile, prepare stronger applications, and find jobs that match your experience.
        </p>

        {/* Three options */}
        <div className="space-y-3 mb-6">
          <Button
            onClick={handleGetStarted}
            className="w-full h-14 text-base font-semibold flex items-center justify-start"
          >
            <ArrowRight className="w-5 h-5 mr-3" />
            Get started
          </Button>

          <Button
            variant="outline"
            onClick={handleGoogle}
            className="w-full h-14 text-base font-semibold flex items-center justify-start"
          >
            <GoogleIcon className="w-5 h-5 mr-3" />
            Continue with Google
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate("/register")}
            className="w-full h-14 text-base font-semibold flex items-center justify-start"
          >
            <Mail className="w-5 h-5 mr-3" />
            Continue with email
          </Button>

          <Button
            variant="ghost"
            onClick={handleStartWithoutEmail}
            className="w-full h-12 text-sm font-medium flex items-center justify-center text-muted-foreground"
          >
            Try without an account
          </Button>
        </div>

        {/* AI consent */}
        <label className="flex items-start gap-3 cursor-pointer mb-6">
          <button
            type="button"
            onClick={() => setConsent(!consent)}
            className={`mt-0.5 w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
              consent ? "bg-primary border-primary" : "border-input bg-card"
            }`}
          >
            {consent && <Check className="w-4 h-4 text-primary-foreground" />}
          </button>
          <span className="text-sm text-muted-foreground leading-relaxed">
            Allow Apply Once to use my saved information to personalize job readiness guidance and help me prepare applications. I can change this anytime.
          </span>
        </label>

        {/* Guest mode warning */}
        <div className="bg-muted/50 border border-border rounded-xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            Try Apply Once without creating an account. Your progress will be saved on this device. Create an account later to sync your profile and access it from other devices.
          </p>
        </div>

        {/* Privacy reassurance */}
        <div className="flex items-start gap-3 mt-4">
          <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your information is private and secure. We never share it without your permission.
          </p>
        </div>
      </div>

      <button
        onClick={() => navigate("/login")}
        className="text-center text-sm text-muted-foreground hover:text-foreground mt-6"
      >
        Already have an account? <span className="text-primary font-medium">Sign in</span>
      </button>
    </div>
  );
}