import React from "react";

export default function CompanyLogo({ logoUrl, companyName, size = "md" }) {
  const sizeClasses = {
    sm: "w-9 h-9 text-sm",
    md: "w-12 h-12 text-lg",
    lg: "w-16 h-16 text-2xl",
  };
  const cls = sizeClasses[size] || sizeClasses.md;

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={companyName || "Company"}
        className={`${cls} rounded-xl object-cover bg-accent flex-shrink-0`}
      />
    );
  }

  const initials = (companyName || "?")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className={`${cls} rounded-xl bg-accent flex items-center justify-center flex-shrink-0`}>
      <span className="font-heading font-bold text-muted-foreground">{initials}</span>
    </div>
  );
}