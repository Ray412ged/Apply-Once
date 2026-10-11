import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/ui/form-error";
import { Mail, Lock, Loader2 } from "lucide-react";
import WelcomeAuthLayout from "@/components/WelcomeAuthLayout";
import { completePendingAuberleInvite, getPendingAuberleInvite } from "@/lib/auberleInvite";

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const pendingInvite = getPendingAuberleInvite();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (pendingInvite?.email && email.trim().toLowerCase() !== pendingInvite.email) {
      setError("Use the email address from your Auberle Employment Institute invitation.");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      const inviteResult = await completePendingAuberleInvite();
      window.location.href = inviteResult.completed ? "/onboarding" : "/";
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
        navigate("/verify-email", { state: { email } });
        return;
      }
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <WelcomeAuthLayout
      eyebrow="Auberle Employment Institute"
      title="Welcome back"
      subtitle="Log in to continue building your profile and applications."
      footer={<>Apply Once access is provided through Auberle Employment Institute.</>}
    >

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

    </WelcomeAuthLayout>
  );
}