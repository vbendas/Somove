import { MenuLink } from "@/components/marketing/menu-link";
import { getPlatformSettings } from "@/lib/platform";
import type { FooterMenu } from "@/lib/menus/load";

export interface MarketingFooterProps {
  menus: FooterMenu[];
}

export async function MarketingFooter({ menus }: MarketingFooterProps) {
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

          {menus.map((menu) => (
            <div key={menu.title}>
              <h4 className="mb-4 font-heading text-sm font-semibold text-foreground">{menu.title}</h4>
              <ul className="space-y-2.5">
                {menu.items.map((item) => (
                  <li key={item.id}>
                    <MenuLink
                      item={item}
                      className="font-body text-sm text-warm-gray transition-colors hover:text-foreground"
                    />
                    {item.children.length > 0 && (
                      <ul className="mt-2 space-y-2 pl-3">
                        {item.children.map((child) => (
                          <li key={child.id}>
                            <MenuLink
                              item={child}
                              className="font-body text-xs text-warm-gray transition-colors hover:text-foreground"
                            />
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

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
