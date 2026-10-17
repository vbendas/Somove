import { cn } from "@/lib/utils";

/** Shared section container: consistent max width, 16px mobile gutters, vertical rhythm. */
export const sectionContainer = "mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 md:py-28 lg:px-8";

interface SectionHeaderProps {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  className?: string;
}

/** Eyebrow label + serif heading + muted lead, shared by all marketing blocks. */
export function SectionHeader({ eyebrow, title, subtitle, className }: SectionHeaderProps) {
  if (!eyebrow && !title && !subtitle) return null;
  return (
    <div className={cn("mx-auto mb-12 max-w-2xl text-center md:mb-16", className)}>
      {eyebrow && (
        <p className="mb-3 font-body text-xs font-semibold uppercase tracking-wider text-primary">{eyebrow}</p>
      )}
      {title && (
        <h2 className="font-heading text-3xl font-normal text-balance text-foreground sm:text-4xl">{title}</h2>
      )}
      {subtitle && (
        <p className="mt-4 font-body text-base leading-relaxed text-muted-foreground sm:text-lg">{subtitle}</p>
      )}
    </div>
  );
}
