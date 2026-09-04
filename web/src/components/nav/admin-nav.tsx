"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { DemoSwitcher } from "@/components/layout/demo-switcher";
import { signOut } from "@/app/actions/auth";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/therapists", label: "Professionals" },
  { href: "/admin/invites", label: "Invites" },
  { href: "/admin/website", label: "Website" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminNav({ demoMode = false }: { demoMode?: boolean }) {
  const pathname = usePathname();

  return (
    <>
      {/* Admin Top Nav */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/admin/dashboard" className="font-heading text-xl font-bold">
              Somove <span className="text-xs text-muted-foreground">Admin</span>
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            {demoMode && <DemoSwitcher className="hidden md:flex" />}
            <Link href="/" prefetch={false} className="text-sm text-muted-foreground hover:text-foreground">
              View Site
            </Link>
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={() => signOut()}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Nav */}
      <nav className="flex border-b px-4 py-2 md:hidden">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 rounded-lg px-3 py-2 text-center text-xs font-medium transition-colors ${
              pathname === item.href
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

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
