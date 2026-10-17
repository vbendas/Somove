import Link from "next/link";

const ROLES = [
  { label: "Client", href: "/dashboard" },
  { label: "Professional", href: "/professional/dashboard" },
  { label: "Admin", href: "/admin" },
];

/** Slim strip shown on the public landing only when DEMO_MODE is on. */
export function DemoEntryBanner() {
  return (
    <div className="border-b border-primary/20 bg-primary/10">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-2 px-4 py-2 text-sm sm:px-6 lg:px-8">
        <span className="font-body text-foreground/80">
          <span className="font-semibold text-foreground">Live demo</span> — explore Somove as a
        </span>
        <div className="flex items-center gap-1.5">
          {ROLES.map((role) => (
            <Link
              key={role.href}
              href={role.href}
              prefetch={false}
              className="rounded-full border border-primary/30 bg-background px-3 py-1 font-body text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              {role.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
