"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface DemoLink {
  label: string;
  href: string;
  match: (pathname: string) => boolean;
}

const DEMO_LINKS: DemoLink[] = [
  {
    label: "Client",
    href: "/dashboard",
    match: (p) => !p.startsWith("/professional") && !p.startsWith("/admin"),
  },
  {
    label: "Professional",
    href: "/professional/dashboard",
    match: (p) => p.startsWith("/professional"),
  },
  { label: "Admin", href: "/admin", match: (p) => p.startsWith("/admin") },
];

interface DemoSwitcherProps {
  className?: string;
  /**
   * Compact rendering for tight spaces (e.g. the mobile floating pill):
   * single-letter labels and no separate "Demo" tag.
   */
  compact?: boolean;
}

export function DemoSwitcher({ className, compact = false }: DemoSwitcherProps) {
  const pathname = usePathname();

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {!compact && (
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
          Demo
        </span>
      )}
      <div
        role="group"
        aria-label="Switch demo section"
        className="flex items-center gap-0.5 rounded-button border border-border bg-secondary/50 p-0.5"
      >
        {DEMO_LINKS.map((link) => {
          const active = link.match(pathname);
          return (
            <Link
              prefetch={false}
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              aria-label={compact ? link.label : undefined}
              title={compact ? link.label : undefined}
              className={cn(
                "rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                compact ? "px-2 py-1" : "px-2.5 py-1",
                active
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {compact ? link.label.slice(0, 1) : link.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
