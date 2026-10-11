import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Check, Info } from "lucide-react";

const BENEFITS = [
  "Build a reusable professional profile",
  "Apply for local jobs",
  "Understand what may be missing",
  "Prepare stronger job applications",
  "Save your profile to the cloud",
];

export default function GuestIntroduction() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col px-5 py-8 max-w-md mx-auto">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-8">
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
        <p className="text-xs font-semibold uppercase tracking-wider text-primary/70 mb-3">
          Employment Readiness Platform
        </p>
        <h1 className="text-2xl font-bold text-foreground leading-tight mb-2">
          Welcome to Apply Once
        </h1>
        <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
          We&rsquo;ll help you build your professional profile and prepare for your next job opportunity.
        </p>

        {/* Benefits */}
        <ul className="space-y-3 mb-8">
          {BENEFITS.map((benefit) => (
            <li key={benefit} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-4 h-4 text-success" />
              </div>
              <span className="text-sm text-foreground leading-relaxed">{benefit}</span>
            </li>
          ))}
        </ul>

        {/* Guest storage notice */}
        <div className="bg-muted/50 border border-border rounded-xl p-4 flex items-start gap-3 mb-8">
          <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            You&rsquo;re continuing as a guest. Your progress will be saved on this device. Create an account later to sync your profile and use it on other devices.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={() => navigate("/onboarding")}
            className="w-full h-14 text-base font-semibold"
          >
            Continue
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate("/welcome")}
            className="w-full h-12 text-sm font-medium text-muted-foreground"
          >
            Create an account instead
          </Button>
        </div>
      </div>
    </div>
  );
}