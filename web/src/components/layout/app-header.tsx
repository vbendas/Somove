"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { DemoSwitcher } from "@/components/layout/demo-switcher";
import { isItemActive } from "@/components/layout/bottom-nav";
import { getClientNavItems, CLIENT_HOME_ALIASES } from "@/components/nav/client-nav";
import { getTherapistNavItems } from "@/components/nav/therapist-nav";
import { useUnreadMessageCount } from "@/hooks/use-unread-message-count";
import { signOut } from "@/app/actions/auth";

type Area = "client" | "therapist";

interface AppHeaderProps {
  area: Area;
  userId?: string;
  demoMode?: boolean;
}

const AREA_LABEL: Record<Area, string> = {
  client: "Client",
  therapist: "Professional",
};

const AREA_HOME: Record<Area, string> = {
  client: "/dashboard",
  therapist: "/professional/dashboard",
};

/**
 * Desktop app shell header shown at md: and up (the mobile bottom nav
 * covers navigation below that breakpoint). Mirrors the admin area's top
 * header so the client and therapist areas don't look unfinished on wide
 * viewports.
 */
export function AppHeader({ area, userId, demoMode = false }: AppHeaderProps) {
  const pathname = usePathname();
  const unreadCount = useUnreadMessageCount(userId);
  const items = area === "client" ? getClientNavItems(unreadCount) : getTherapistNavItems(unreadCount);
  const homeAliases = area === "client" ? CLIENT_HOME_ALIASES : [];

  return (
    <>
      <header className="sticky top-0 z-40 hidden border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:block">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-6">
          <div className="flex items-center gap-6">
            <Link
              href={AREA_HOME[area]}
              className="flex items-baseline gap-2 font-heading text-xl font-bold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            >
              Somove
              <span className="font-body text-xs font-normal text-muted-foreground">
                {AREA_LABEL[area]}
              </span>
            </Link>
            <nav aria-label="Primary" className="flex items-center gap-1">
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = isItemActive(pathname, item, homeAliases);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "relative flex items-center gap-2 rounded-button px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" strokeWidth={isActive ? 2.5 : 2} />
                    {item.label}
                    {(item.badge ?? 0) > 0 && (
                      <span
                        role="status"
                        aria-label={`${item.badge} unread messages`}
                        className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-[5px] text-[11px] font-bold text-destructive-foreground"
                      >
                        <span aria-hidden="true">
                          {(item.badge ?? 0) > 99 ? "99+" : item.badge}
                        </span>
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            {demoMode && <DemoSwitcher />}
            <ThemeToggle />
            {!demoMode && (
              <form action={signOut}>
                <Button variant="ghost" size="sm" type="submit">
                  Sign Out
                </Button>
              </form>
            )}
          </div>
        </div>
      </header>

      {demoMode && (
        <div className="fixed right-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-50 md:hidden">
          <DemoSwitcher
            compact
            className="rounded-full border border-border bg-background/95 px-1 py-1 shadow-md backdrop-blur supports-[backdrop-filter]:bg-background/80"
          />
        </div>
      )}
    </>
  );
}
