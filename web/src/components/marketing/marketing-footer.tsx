import Link from "next/link";
import { getPlatformSettings } from "@/lib/platform";

const FOOTER_LINKS = {
  platform: [
    { label: "Find a Therapist", href: "/therapists" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "Log in", href: "/login" },
  ],
  support: [
    { label: "Emergency Resources", href: "/emergency" },
    { label: "Terms of Service", href: "/legal/terms" },
    { label: "Privacy Policy", href: "/legal/privacy" },
  ],
};

export async function MarketingFooter() {
  const settings = await getPlatformSettings();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface/50">
      <div className="container-wide section-padding py-12 sm:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <span className="block font-heading text-lg font-semibold text-foreground">
              {settings.platform_name}
            </span>
            {settings.platform_tagline && (
              <p className="mt-3 max-w-xs font-body text-sm leading-relaxed text-warm-gray">
                {settings.platform_tagline}
              </p>
            )}
          </div>

          <div>
            <h4 className="mb-4 font-heading text-sm font-semibold text-foreground">Platform</h4>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.platform.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="font-body text-sm text-warm-gray transition-colors hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-heading text-sm font-semibold text-foreground">Support</h4>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.support.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="font-body text-sm text-warm-gray transition-colors hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-heading text-sm font-semibold text-foreground">Contact</h4>
            <a
              href={`mailto:${settings.support_email}`}
              className="font-body text-sm text-warm-gray transition-colors hover:text-foreground"
            >
              {settings.support_email}
            </a>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="font-body text-xs text-warm-gray">
            &copy; {year} {settings.platform_name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
