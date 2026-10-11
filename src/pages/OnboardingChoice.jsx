import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Briefcase, Upload, User, Star, ArrowRight } from "lucide-react";

export default function OnboardingChoice() {
  const navigate = useNavigate();

  const options = [
    {
      id: "upload",
      title: "I have a resume",
      description: "Upload it and we'll use it to start building your profile.",
      icon: Upload,
      recommended: true,
      badge: "Fastest",
      onClick: () => navigate("/onboarding/upload"),
    },
    {
      id: "build",
      title: "Help me describe my experience",
      description: "We'll guide you through where you've worked, what you did, and the skills you gained.",
      icon: Briefcase,
      recommended: false,
      onClick: () => navigate("/onboarding/build"),
    },
    {
      id: "create",
      title: "I'll enter my information myself",
      description: "Start with a blank profile and complete each section at your own pace.",
      icon: User,
      recommended: false,
      onClick: () => navigate("/profile/edit?section=about"),
    },
  ];

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
        onClick={() => navigate("/home")}
        className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft className="w-5 h-5" />
        Back
      </button>

      <div className="flex-1 flex flex-col justify-center">
        <h1 className="text-2xl font-bold text-foreground leading-tight mb-2">
          Choose the easiest way to get started
        </h1>
        <p className="text-muted-foreground text-sm mb-8">
          You can change or add information anytime.
        </p>

        <div className="space-y-3">
          {options.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.id}
              onClick={option.onClick}
              disabled={option.comingSoon}
              className={`w-full rounded-2xl p-5 text-left transition-colors border-2 ${
                option.comingSoon
                  ? "bg-muted/40 border-border opacity-60 cursor-not-allowed"
                  : option.recommended
                    ? "bg-primary/5 border-primary hover:border-primary/60"
                    : "bg-card border-border hover:border-primary/40"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    option.recommended
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-foreground">{option.title}</p>
                    {option.badge && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        <Star className="w-3 h-3 fill-primary" />
                        {option.badge}
                      </span>
                    )}
                    {option.comingSoon && (
                      <span className="inline-flex items-center text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {option.description}
                  </p>
                </div>
                {!option.comingSoon && (
                  <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-3" />
                )}
              </div>
            </button>
          );
          })}
        </div>
      </div>
    </div>
  );
}