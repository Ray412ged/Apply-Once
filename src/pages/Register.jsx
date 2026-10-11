import React, { useEffect, useState, useRef } from "react";
import { Link, Navigate, useNavigate, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/ui/form-error";
import { Mail, Lock, Loader2 } from "lucide-react";
import WelcomeAuthLayout from "@/components/WelcomeAuthLayout";
import { clearPendingAuberleInvite, getPendingAuberleInvite } from "@/lib/auberleInvite";

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const pendingInvite = getPendingAuberleInvite();
  const invited = !!pendingInvite?.token;
  const [email, setEmail] = useState(() => location.state?.email || pendingInvite?.email || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errorField, setErrorField] = useState(null);
  const [inviteChecked, setInviteChecked] = useState(false);
  const [inviteValid, setInviteValid] = useState(false);
  const confirmPasswordRef = useRef(null);
  const privacyRef = useRef(null);
  const termsRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function validateInvite() {
      if (!pendingInvite?.token) {
        setInviteChecked(true);
        return;
      }

      try {
        const result = await base44.functions.invoke("claimOrgReferral", {
          action: "preview",
          token: pendingInvite.token,
        });
        const data = result?.data || result;
        if (data?.error) throw new Error(data.error);
        if (!cancelled) setInviteValid(true);
      } catch {
        clearPendingAuberleInvite();
        if (!cancelled) setInviteValid(false);
      } finally {
        if (!cancelled) setInviteChecked(true);
      }
    }

    validateInvite();
    return () => { cancelled = true; };
  }, [pendingInvite?.token]);

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
      navigate("/verify-email", { state: { email } });
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

  if (!inviteChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
      </div>
    );
  }

  if (!invited || !inviteValid) {
    return <Navigate to="/login" replace />;
  }

  return (
    <WelcomeAuthLayout
      eyebrow="Auberle Employment Institute"
      title="Create your account"
      subtitle="Create your account to continue with Auberle Employment Institute."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" state={{ email }} className="text-primary font-medium hover:underline">
            Log in
          </Link>
        </>
      }
    >
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