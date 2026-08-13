import * as React from "react";
import Link from "next/link";
import type { MenuChildItem, MenuItem } from "@/lib/menus/schema";

export interface MenuLinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  item: MenuItem | MenuChildItem;
}

/**
 * Renders the correct anchor for a menu item's `kind`: `next/link` for
 * internal routes (client-side navigation), a plain `<a>` for in-page
 * anchors (`#pricing`) and external URLs. External/internal `newTab` links
 * honor `rel="noopener noreferrer"`, the same convention used elsewhere in
 * the CMS (see src/lib/sanitize.ts's sanitizeRichHtml). Forwards ref and
 * arbitrary anchor props (`onClick`, etc.) so it composes with
 * `<Button asChild>` and other prop-injecting wrappers.
 */
export const MenuLink = React.forwardRef<HTMLAnchorElement, MenuLinkProps>(function MenuLink(
  { item, children, target, rel, ...rest },
  ref
) {
  const label = children ?? item.label;
  const resolvedTarget = target ?? (item.newTab ? "_blank" : undefined);
  const resolvedRel = rel ?? (item.newTab ? "noopener noreferrer" : undefined);

  if (item.kind === "internal") {
    return (
      <Link href={item.href} ref={ref} target={resolvedTarget} rel={resolvedRel} {...rest}>
        {label}
      </Link>
    );
  }

  return (
    <a href={item.href} ref={ref} target={resolvedTarget} rel={resolvedRel} {...rest}>
      {label}
    </a>
  );
});
