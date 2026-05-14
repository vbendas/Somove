import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "accent" | "primary" | "rose" | "outline";
  className?: string;
}

export function Badge({
  children,
  variant = "accent",
  className = "",
}: BadgeProps) {
  const variants = {
    accent: "bg-accent/15 text-accent-dark",
    primary: "bg-primary/15 text-primary-dark",
    rose: "bg-soft-rose/40 text-warm-charcoal",
    outline: "border border-primary/30 text-primary",
  };

  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-sm font-body font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
