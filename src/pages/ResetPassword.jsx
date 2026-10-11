import React, { useState, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/ui/form-error";
import { Lock, Loader2 } from "lucide-react";
import WelcomeAuthLayout from "@/components/WelcomeAuthLayout";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [errorField, setErrorField] = useState(null);
  const [loading, setLoading] = useState(false);
  const confirmPasswordRef = useRef(null);

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
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setErrorField("confirm");
      confirmPasswordRef.current?.focus();
      return;
    }
    setLoading(true);
    try {
      await base44.auth.resetPassword({ resetToken, newPassword });
      window.location.href = "/login";
    } catch (err) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (!resetToken) {
    return (
      <WelcomeAuthLayout
        eyebrow="Employment Readiness Platform"
        title="Invalid reset link"
        subtitle="This password reset link is missing or invalid."
        footer={
          <Link to="/forgot-password" className="text-primary font-medium hover:underline">
            Request a new link
          </Link>
        }
      >
        <p className="text-sm text-foreground">
          The link you used appears to be incomplete. Please request a new password reset email.
        </p>
      </WelcomeAuthLayout>
    );
  }

  return (
    <WelcomeAuthLayout
      eyebrow="Employment Readiness Platform"
      title="New password"
      subtitle="Enter your new password below."
    >
      <FormError id="reset-error" className="mb-4">{error}</FormError>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              autoFocus
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); clearError(); }}
              aria-describedby={error ? "reset-error" : undefined}
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
              aria-describedby={error ? "reset-error" : undefined}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-14 text-base font-semibold" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Resetting...
            </>
          ) : (
            "Reset password"
          )}
        </Button>
      </form>
    </WelcomeAuthLayout>
  );
}