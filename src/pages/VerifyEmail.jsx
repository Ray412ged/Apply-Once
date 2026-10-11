import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/ui/form-error";
import { Loader2, RefreshCw, MailCheck } from "lucide-react";
import WelcomeAuthLayout from "@/components/WelcomeAuthLayout";
import { completePendingAuberleInvite, getPendingAuberleInvite } from "@/lib/auberleInvite";

// Cooldown (seconds) between Resend Code taps to prevent rapid repeated
// requests.
const RESEND_COOLDOWN = 30;

// Maps the raw API error to the plain-language message the user sees. The
// verification screen never returns the user to the registration form on an
// error, so these messages are shown inline and the entered email/state is
// preserved.
function mapVerifyError(err) {
  const msg = (err?.message || "").toLowerCase();
  if (msg.includes("expire")) {
    return "This code has expired. Request a new code and try again.";
  }
  if (msg.includes("too many") || msg.includes("rate") || msg.includes("attempts")) {
    return "Too many attempts. Please wait before trying again.";
  }
  if (msg.includes("already verified") || msg.includes("already been verified")) {
    return "Your email is already verified. Try signing in.";
  }
  return "That code was not accepted. Check the email and try again.";
}

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const pendingInvite = getPendingAuberleInvite();
  const email = location.state?.email || pendingInvite?.email || "";

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const inputRef = useRef(null);
  const cooldownTimer = useRef(null);

  // If we somehow land here without an email, return to sign in.
  useEffect(() => {
    if (!email) {
      navigate("/login", { replace: true });
      return;
    }
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => {
      clearTimeout(t);
      clearInterval(cooldownTimer.current);
    };
  }, [email]);

  const startCooldown = useCallback(() => {
    setCooldown(RESEND_COOLDOWN);
    clearInterval(cooldownTimer.current);
    cooldownTimer.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(cooldownTimer.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }, []);

  const clearFeedback = () => {
    if (error) setError("");
    if (resendMsg) setResendMsg("");
  };

  const handleCodeChange = (e) => {
    const digits = (e.target.value || "").replace(/\D/g, "").slice(0, 6);
    setCode(digits);
    clearFeedback();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData?.getData("text") || "";
    const digits = pasted.replace(/\D/g, "").slice(0, 6);
    if (!digits) return;
    e.preventDefault();
    setCode(digits);
    clearFeedback();
  };

  const handleVerify = async (e) => {
    e?.preventDefault();
    if (loading) return;
    clearFeedback();
    if (code.length !== 6) {
      setError("Enter the six-digit code from your email.");
      return;
    }
    setLoading(true);
    try {
      const { access_token } = await base44.auth.verifyOtp({
        email,
        otpCode: code,
      });
      if (!access_token) {
        throw new Error("Verification did not return a session. Please try again.");
      }
      // Verification succeeded — authenticate the account now.
      base44.auth.setToken(access_token);

      try {
        const inviteResult = await completePendingAuberleInvite();

        // Auberle invitation + verified email is the complete participant entry flow.
        // Existing already-enrolled users without a pending invitation return normally.
        window.location.href = inviteResult.completed ? "/onboarding" : "/";
      } catch (inviteErr) {
        setError(
          inviteErr?.response?.data?.error ||
          inviteErr?.message ||
          "Your email is verified, but we could not complete your Auberle Employment Institute access. Please contact Auberle EI."
        );
        setLoading(false);
      }
    } catch (err) {
      setError(mapVerifyError(err));
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resending || cooldown > 0) return;
    setResending(true);
    clearFeedback();
    try {
      await base44.auth.resendOtp(email);
      setResendMsg(`A new verification code was sent to ${email}.`);
      startCooldown();
    } catch {
      setResendMsg("");
      setError("We could not send another code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const handleChangeEmail = () => {
    navigate("/register", { state: { email } });
  };

  return (
    <WelcomeAuthLayout
      eyebrow="Auberle Employment Institute"
      title="Verify your email"
      subtitle={`We sent a six-digit verification code to ${email}.`}
      footer={
        <>
          Already verified?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <FormError className="mb-4">{error}</FormError>

      {resendMsg && (
        <div className="mb-4 rounded-lg border border-success/20 bg-success/10 px-4 py-2.5 text-sm text-success flex items-start gap-2">
          <MailCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{resendMsg}</span>
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="otp-code">Verification code</Label>
          <input
            ref={inputRef}
            id="otp-code"
            name="otp-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={6}
            value={code}
            onChange={handleCodeChange}
            onPaste={handlePaste}
            placeholder="••••••"
            aria-label="Six-digit verification code"
            disabled={loading}
            className="w-full h-16 text-center text-3xl tracking-[0.5em] font-semibold rounded-xl border border-input bg-card shadow-sm placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
        </div>

        <Button
          type="submit"
          className="w-full h-14 text-base font-semibold"
          disabled={loading || code.length !== 6}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify Email"
          )}
        </Button>
      </form>

      <div className="mt-5 space-y-3">
        <Button
          type="button"
          variant="outline"
          className="w-full h-12"
          onClick={handleResend}
          disabled={resending || cooldown > 0}
        >
          {resending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending code...
            </>
          ) : cooldown > 0 ? (
            `Resend Code (${cooldown}s)`
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Resend Code
            </>
          )}
        </Button>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="ghost"
            className="flex-1 h-11 text-sm"
            onClick={handleChangeEmail}
          >
            Change Email
          </Button>
          <Button asChild variant="ghost" className="flex-1 h-11 text-sm">
            <Link to="/login">Return to Sign In</Link>
          </Button>
        </div>
      </div>
    </WelcomeAuthLayout>
  );
}