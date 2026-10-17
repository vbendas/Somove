import Link from "next/link";
import { MarketingHeaderShell } from "@/components/marketing/marketing-header-shell";
import { MarketingNavPreview } from "@/components/marketing/marketing-nav-preview";
import { MarketingMobileNav } from "@/components/marketing/marketing-mobile-nav";
import { getPlatformSettings } from "@/lib/platform";
import type { MenuItem } from "@/lib/menus/schema";

export interface MarketingHeaderProps {
  items: MenuItem[];
}

export async function MarketingHeader({ items }: MarketingHeaderProps) {
  const settings = await getPlatformSettings();

  return (
    <MarketingHeaderShell>
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-heading text-lg font-semibold text-foreground">
          {settings.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.logo_url} alt={settings.platform_name} className="h-8 w-auto" />
          ) : null}
          <span>{settings.platform_name}</span>
        </Link>

        <div className="hidden md:flex">
          <MarketingNavPreview items={items} />
        </div>

        <MarketingMobileNav items={items} />
      </div>
    </MarketingHeaderShell>
  );
}
