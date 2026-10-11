import React, { useState } from "react";
import { Copy, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CopyButton({ text, label = "Use", size = "sm", className = "", variant = "ghost", onCopySuccess, onCopyError }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setError(false);
      onCopySuccess?.();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
      setError(true);
      onCopyError?.(err);
      setTimeout(() => setError(false), 3000);
    }
  };

  const activeVariant = copied ? "secondary" : error ? "destructive" : variant;

  return (
    <Button
      variant={activeVariant}
      size={size}
      onClick={handleCopy}
      className={cn("h-8 px-2.5 text-xs", className)}
      aria-live="polite"
      aria-label={copied ? "Copied to clipboard" : error ? "Copy failed" : label}
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-success" />
      ) : error ? (
        <AlertCircle className="w-3.5 h-3.5" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
      <span className="ml-1">{copied ? "Copied" : error ? "Copy failed" : label}</span>
    </Button>
  );
}