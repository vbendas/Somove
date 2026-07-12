"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard/settings/profile", label: "Profile" },
  { href: "/dashboard/settings/pricing", label: "Pricing" },
  { href: "/dashboard/settings/session-types", label: "Session types" },
  { href: "/dashboard/settings/terms", label: "Terms" },
  { href: "/dashboard/settings/availability", label: "Availability" },
  { href: "/dashboard/settings/integrations", label: "Integrations" },
  { href: "/dashboard/settings/notifications", label: "Notifications" },
  { href: "/dashboard/pages", label: "Pages" },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 overflow-x-auto rounded-card bg-surface p-1">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex-shrink-0 rounded-button px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-warm-gray hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
