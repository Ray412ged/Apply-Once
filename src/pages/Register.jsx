import React, { useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/ui/form-error";
import { Mail, Lock, Loader2 } from "lucide-react";
import WelcomeAuthLayout from "@/components/WelcomeAuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { getPendingEmail } from "@/lib/guestStorage";
import { consumeGuestRedirect } from "@/lib/guestRedirect";

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(() => location.state?.email || getPendingEmail());
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errorField, setErrorField] = useState(null);
  const confirmPasswordRef = useRef(null);
  const privacyRef = useRef(null);
  const termsRef = useRef(null);

  const clearError = () => {
    if (error || errorField) {
      setError("");
      setErrorField(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setErrorField(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setErrorField("confirm");
      confirmPasswordRef.current?.focus();
      return;
    }
    if (!privacyAccepted || !termsAccepted) {
      setError("Please review and accept the Privacy Notice and Terms to continue.");
      setErrorField("terms");
      if (!privacyAccepted) privacyRef.current?.focus();
      else termsRef.current?.focus();
      return;
    }
    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      // Registration triggers a verification email. Transition to the
      // dedicated verification screen — the account is unverified until the
      // six-digit code is confirmed, so we must not attempt to sign in here.
      // returnTo prefers explicit navigation state (e.g. a protected-route
      // redirect), falling back to a guest's saved intended destination
      // (e.g. "return to the resume I was trying to download") when no
      // state was passed — GuestAccountPrompt and similar guest-gate entry
      // points navigate here with no state at all, relying entirely on the
      // storage-based mechanism, so this fallback is required for those
      // paths to actually return the user where they meant to go.
      const returnTo =
        location.state?.from || location.state?.returnTo || consumeGuestRedirect();
      navigate("/verify-email", { state: { email, returnTo } });
    } catch (err) {
      const msg = (err.message || "Registration failed").toLowerCase();
      if (msg.includes("already exists")) {
        setError("An account with this email already exists. Try signing in instead.");
        setErrorField("email");
      } else {
        setError(err.message || "Registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", "/");
  };

  return (
    <WelcomeAuthLayout
      eyebrow="Employment Readiness Platform"
      title="Create your account"
      subtitle="Sign up to save your profile and sync it across devices."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <Button
        variant="outline"
        className="w-full h-14 text-base font-semibold flex items-center justify-start mb-4"
        onClick={handleGoogle}
      >
        <GoogleIcon className="w-5 h-5 mr-3" />
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

      <FormError id="register-error" className="mb-4">{error}</FormError>

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
              onChange={(e) => { setEmail(e.target.value); clearError(); }}
              aria-describedby={error ? "register-error" : undefined}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearError(); }}
              aria-describedby={error ? "register-error" : undefined}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              ref={confirmPasswordRef}
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); clearError(); }}
              aria-invalid={errorField === "confirm"}
              aria-describedby={error ? "register-error" : undefined}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-3 pt-2">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              ref={privacyRef}
              type="checkbox"
              checked={privacyAccepted}
              onChange={(e) => { setPrivacyAccepted(e.target.checked); clearError(); }}
              aria-invalid={errorField === "terms"}
              aria-describedby={error ? "register-error" : undefined}
              className="mt-0.5 w-5 h-5 rounded border-input accent-primary cursor-pointer flex-shrink-0"
            />
            <span className="text-sm text-muted-foreground leading-relaxed">
              I have read the{" "}
              <span className="text-primary font-medium">Privacy Notice</span>. My information stays private and secure.
            </span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              ref={termsRef}
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => { setTermsAccepted(e.target.checked); clearError(); }}
              aria-invalid={errorField === "terms"}
              aria-describedby={error ? "register-error" : undefined}
              className="mt-0.5 w-5 h-5 rounded border-input accent-primary cursor-pointer flex-shrink-0"
            />
            <span className="text-sm text-muted-foreground leading-relaxed">
              I agree to the{" "}
              <span className="text-primary font-medium">Terms of Use</span>.
            </span>
          </label>
        </div>
        <Button
          type="submit"
          className="w-full h-14 text-base font-semibold"
          disabled={loading || !privacyAccepted || !termsAccepted}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>
    </WelcomeAuthLayout>
  );
}