import React from "react";

// Shared layout that mirrors the Welcome page: full-screen, top logo,
// eyebrow + heading + subtitle, centered content, bottom footer link.
export default function WelcomeAuthLayout({ eyebrow, title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen flex flex-col px-5 py-8 max-w-md mx-auto">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-12">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm">AO</span>
        </div>
        <span className="font-heading font-bold text-foreground text-lg">Apply Once</span>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-wider text-primary/70 mb-3">
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl font-bold text-foreground leading-tight mb-3">{title}</h1>
        {subtitle && (
          <p className="text-base text-muted-foreground leading-relaxed mb-8">{subtitle}</p>
        )}

        <div className={subtitle ? "" : "mt-6"}>{children}</div>
      </div>

      {footer && (
        <div className="text-center text-sm text-muted-foreground mt-6">{footer}</div>
      )}
    </div>
  );
}