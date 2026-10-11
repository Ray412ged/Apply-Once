import React from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";

export default function NextStepCard({ step, onClick }) {
  if (!step) return null;

  return (
    <div className="bg-card rounded-2xl border-2 border-primary/30 p-5">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <p className="text-sm font-semibold text-primary">Next Best Step</p>
      </div>
      <p className="text-lg font-bold text-foreground">{step.title}</p>
      <p className="text-sm text-muted-foreground mt-1">{step.reason}</p>
      {step.estimatedTime && (
        <p className="text-xs text-muted-foreground mt-2">
          Estimated time: {step.estimatedTime}
        </p>
      )}
      <Button onClick={onClick} className="w-full h-12 mt-4 font-semibold">
        Get Started
        <ArrowRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
}