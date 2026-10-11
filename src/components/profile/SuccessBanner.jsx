import React from "react";
import { Check } from "lucide-react";

// Standardized success banner for profile actions.
// Usage: <SuccessBanner message="Employment added to your profile." />
export default function SuccessBanner({ message }) {
  return (
    <div className="bg-success/10 rounded-xl p-3 text-center animate-fade-in">
      <Check className="w-5 h-5 text-success inline mr-1.5 -mt-0.5" />
      <span className="text-sm font-medium text-success">{message}</span>
    </div>
  );
}