import React from "react";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  centered?: boolean;
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  centered = true,
  className = "",
}: SectionHeadingProps) {
  return (
    <div className={`${centered ? "text-center" : ""} mb-10 sm:mb-14 ${className}`}>
      {eyebrow && (
        <span className="pill-badge mb-4 inline-block">{eyebrow}</span>
      )}
      <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-normal text-warm-charcoal text-balance leading-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-warm-gray font-body text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
