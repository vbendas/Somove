import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "white";
  size?: "sm" | "md" | "lg";
  href?: string;
  children: React.ReactNode;
}

const ArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0">
    <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export function Button({
  variant = "primary",
  size = "md",
  href,
  children,
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-body font-medium rounded-full transition-all duration-300 cursor-pointer min-h-[44px] uppercase text-sm tracking-wider";

  const variants = {
    primary:
      "bg-warm-charcoal text-white hover:bg-primary active:scale-[0.98]",
    secondary:
      "bg-primary text-white hover:bg-warm-charcoal active:scale-[0.98]",
    outline:
      "border-2 border-warm-charcoal/15 text-warm-charcoal hover:border-primary hover:bg-primary hover:text-white active:scale-[0.98]",
    ghost:
      "text-primary hover:bg-surface active:scale-[0.98]",
    white:
      "bg-white text-warm-charcoal hover:bg-primary hover:text-white active:scale-[0.98]",
  };

  const sizes = {
    sm: "px-5 py-2.5 text-xs",
    md: "pl-7 pr-2 py-2 text-sm",
    lg: "pl-8 pr-2.5 py-2.5 text-sm",
  };

  const inner = (
    <>
      <span>{children}</span>
      <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 bg-white/20">
        <ArrowIcon />
      </span>
    </>
  );

  const classes = `${base} ${variants[variant]} ${sizes[size]} ${className}`;

  if (href) {
    return <a href={href} className={classes}>{inner}</a>;
  }

  return <button className={classes} {...props}>{inner}</button>;
}
