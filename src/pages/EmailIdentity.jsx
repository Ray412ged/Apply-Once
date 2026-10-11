import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { setPendingEmail, saveGuestSingle } from "@/lib/guestStorage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/ui/form-error";
import GoogleIcon from "@/components/GoogleIcon";
import {
  ChevronLeft,
  Mail,
  Loader2,
  ArrowRight,
  Shield,
  Check,
  UserCheck,
} from "lucide-react";

export default function EmailIdentity() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  // idle | checking | exists | error
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const handleContinue = async () => {
    setError("");
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Please enter your email address.");
      return;
    }
    setStatus("checking");
    try {
      const res = await base44.functions.invoke("checkEmailExists", { email: trimmed });
      if (res?.data?.exists) {
        setStatus("exists");
        return;
      }
      // New email — this becomes the user's identity for onboarding.
      // NOT a guest: no guest flag, no migration prompt later.
      setPendingEmail(trimmed.toLowerCase());
      saveGuestSingle("UserProfile", {
        email: trimmed,
        onboarding_status: "in_progress",
        privacy_acknowledged: true,
        terms_acknowledged: true,
        consent_to_ai_processing: consent,
        consent_timestamp: consent ? new Date().toISOString() : undefined,
        profile_completion_percentage: 0,
      });
      navigate("/onboarding");
    } catch (err) {
      console.error("Email check failed:", err);
      setError("We couldn't check that email. Please try again.");
      setStatus("error");
    }
  };

  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", "/");
  };

  // === Existing account screen ===
  if (status === "exists") {
    return (
      <div className="min-h-screen flex flex-col px-5 py-8 max-w-md mx-auto">
        <div className="flex items-center gap-2.5 mb-12">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">AO</span>
          </div>
          <span className="font-heading font-bold text-foreground text-lg">Apply Once</span>
        </div>

        <button
          onClick={() => { setStatus("idle"); setError(""); }}
          className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground mb-6"
        >
          <ChevronLeft className="w-5 h-5" />
          Use a different email
        </button>

        <div className="flex-1 flex flex-col justify-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <UserCheck className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground text-center leading-tight mb-3">
            Welcome back!
          </h1>
          <p className="text-muted-foreground text-center leading-relaxed mb-1">
            We found an existing account with this email.
          </p>
          <p className="text-muted-foreground text-center leading-relaxed mb-8">
            Please sign in to continue working on your profile.
          </p>

          <Button
            onClick={() => navigate("/login", { state: { email } })}
            className="w-full h-14 text-base font-semibold"
          >
            Sign In
            <ArrowRight className="w-5 h-5 ml-1" />
          </Button>

          <div className="flex items-center justify-center mt-4">
            <Link to="/forgot-password" className="text-sm text-primary font-medium hover:underline">
              Forgot Password
            </Link>
          </div>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground">or</span>
            </div>
          </div>

          <Button variant="outline" onClick={handleGoogle} className="w-full h-14 text-base font-semibold">
            <GoogleIcon className="w-5 h-5 mr-2" />
            Continue with Google
          </Button>
        </div>
      </div>
    );
  }

  // === Email entry screen ===
  return (
    <div className="min-h-screen flex flex-col px-5 py-8 max-w-md mx-auto">
      <div className="flex items-center gap-2.5 mb-12">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm">AO</span>
        </div>
        <span className="font-heading font-bold text-foreground text-lg">Apply Once</span>
      </div>

      <button
        onClick={() => navigate("/welcome")}
        className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft className="w-5 h-5" />
        Back
      </button>

      <div className="flex-1 flex flex-col justify-center">
        <h1 className="text-3xl font-bold text-foreground leading-tight mb-3">
          Let's build your profile.
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed mb-8">
          Enter your email to get started. We'll use it to save your work.
        </p>

        <FormError className="mb-4">{error}</FormError>

        <div className="space-y-2 mb-4">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (status !== "checking") handleContinue();
                }
              }}
              disabled={status === "checking"}
              className="pl-10 h-14 text-base"
              required
            />
          </div>
        </div>

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
            Allow Apply Once to help me prepare applications using my saved information. I can change this anytime.
          </span>
        </label>

        <Button
          onClick={handleContinue}
          disabled={status === "checking"}
          className="w-full h-14 text-base font-semibold"
        >
          {status === "checking" ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="w-5 h-5 ml-1" />
            </>
          )}
        </Button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-3 text-muted-foreground">or</span>
          </div>
        </div>

        <Button variant="outline" onClick={handleGoogle} className="w-full h-14 text-base font-semibold">
          <GoogleIcon className="w-5 h-5 mr-2" />
          Continue with Google
        </Button>

        <div className="flex items-start gap-3 mt-6">
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