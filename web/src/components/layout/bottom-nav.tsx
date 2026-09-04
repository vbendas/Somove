"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  /**
   * When true, this item is only considered active on an exact pathname
   * match (no prefix matching). Use for "root" items like a therapist's
   * "Today" tab at /professional/dashboard, which would otherwise also
   * match its own nested routes (e.g. /professional/dashboard/schedule).
   */
  exact?: boolean;
}

interface BottomNavProps {
  items: NavItem[];
  className?: string;
  /**
   * Extra pathnames that should be treated as equivalent to a given item's
   * href for active-state purposes, e.g. the client "Home" tab links to
   * /dashboard but should also read as active on "/".
   */
  homeAliases?: string[];
}

export function isItemActive(pathname: string, item: NavItem, homeAliases: string[] = []): boolean {
  if (pathname === item.href) return true;
  if (homeAliases.includes(item.href) && homeAliases.includes(pathname)) return true;
  if (item.exact) return false;
  return pathname.startsWith(`${item.href}/`);
}

export function BottomNav({ items, className, homeAliases = [] }: BottomNavProps) {
  const pathname = usePathname();

  // Publish the nav's height as a CSS variable so other fixed-position UI
  // (e.g. the cookie consent banner) can offset itself above the nav
  // instead of being covered by it. Cleared on unmount so areas without a
  // bottom nav (e.g. admin) don't inherit a stale offset.
  useEffect(() => {
    document.documentElement.style.setProperty("--bottom-nav-h", "4rem");
    return () => {
      document.documentElement.style.removeProperty("--bottom-nav-h");
    };
  }, []);

  return (
    <nav
      aria-label="Primary"
      data-bottom-nav=""
      className={cn(
        // z-[60]: sits above the cookie-consent banner (z-50, also fixed to
        // the bottom of the viewport) so primary navigation is never
        // covered by the one-time consent prompt.
        "fixed bottom-0 left-0 right-0 z-[60] border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden",
        "pb-[env(safe-area-inset-bottom)]",
        className
      )}
    >
      <div className="mx-auto flex h-16 max-w-md items-center justify-around px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = isItemActive(pathname, item, homeAliases);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex min-w-[44px] flex-col items-center justify-center gap-1 rounded-button px-3 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? "text-primary"
                  : "text-warm-gray hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                {(item.badge ?? 0) > 0 && (
                  <span
                    role="status"
                    aria-label={`${item.badge} unread messages`}
                    className="absolute -right-2 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-[5px] text-[11px] font-bold text-destructive-foreground ring-2 ring-background"
                  >
                    <span aria-hidden="true">
                      {(item.badge ?? 0) > 99 ? "99+" : item.badge}
                    </span>
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
