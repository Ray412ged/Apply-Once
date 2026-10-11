import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/ui/form-error";
import { Mail, Lock, Loader2, UserRound } from "lucide-react";
import WelcomeAuthLayout from "@/components/WelcomeAuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { setGuestMode, saveGuestSingle, setGuestIntroSeen, hasGuestIntroSeen } from "@/lib/guestStorage";
import { consumeGuestRedirect } from "@/lib/guestRedirect";

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGuest = () => {
    setGuestMode(true);
    saveGuestSingle("UserProfile", {
      onboarding_status: "in_progress",
      privacy_acknowledged: true,
      terms_acknowledged: true,
      consent_to_ai_processing: false,
      profile_completion_percentage: 0,
    });
    if (!hasGuestIntroSeen()) {
      setGuestIntroSeen();
      navigate("/guest-intro");
    } else {
      navigate("/onboarding");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = "/";
    } catch (err) {
      const msg = (err.message || "").toLowerCase();
      // Unverified account — route to the verification screen (with the code
      // entry field) instead of leaving the user on a dead-end error.
      if (
        msg.includes("verify") ||
        msg.includes("verification") ||
        msg.includes("otp") ||
        msg.includes("not verified") ||
        msg.includes("before logging")
      ) {
        // Same fallback as Register.jsx: prefer explicit navigation state,
        // otherwise fall back to a guest's saved intended destination so an
        // unverified guest routed here from a guest-gate still lands back
        // where they meant to go after verifying.
        const returnTo = location.state?.from || location.state?.returnTo || consumeGuestRedirect();
        navigate("/verify-email", { state: { email, returnTo } });
        return;
      }
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    // Google's OAuth flow is a full-page redirect round-trip, so React
    // Router state can't survive it — this is exactly why saveGuestRedirect
    // uses sessionStorage. Pass the guest's saved destination (or the safe
    // "/home" default) directly as the post-auth redirect target instead of
    // always hardcoding "/".
    base44.auth.loginWithProvider("google", consumeGuestRedirect());
  };

  return (
    <WelcomeAuthLayout
      eyebrow="Employment Readiness Platform"
      title="Welcome back"
      subtitle="Log in to continue building your profile and applications."
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/register" className="text-primary font-medium hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <Button
        variant="outline"
        className="w-full h-14 text-base font-semibold flex items-center justify-start mb-4"
        onClick={handleGoogle}
      >
        <GoogleIcon className="w-5 h-5 mr-2" />
        Continue with Google
      </Button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-3 text-muted-foreground">or</span>
        </div>
      </div>

      <FormError id="login-error" className="mb-4">{error}</FormError>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
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
              aria-describedby={error ? "login-error" : undefined}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (error) setError(""); }}
              aria-describedby={error ? "login-error" : undefined}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-14 text-base font-semibold" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Logging in...
            </>
          ) : (
            "Log in"
          )}
        </Button>
      </form>

      <Button
        variant="ghost"
        onClick={handleGuest}
        className="w-full h-12 text-sm font-medium text-muted-foreground mt-3"
      >
        <UserRound className="w-4 h-4 mr-2" />
        Try without an account
      </Button>
    </WelcomeAuthLayout>
  );
}