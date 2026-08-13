import { z } from "zod";
import { sanitizeBlockUrl } from "@/lib/sanitize";

/**
 * Menu item validation — deliberately React-free (like src/blocks/types.ts
 * / schemas.ts) so it's importable from "use server" action files.
 *
 * Tree depth is capped at two levels: top-level items may have `children`,
 * but children may not have children of their own. This is enforced by the
 * shape itself (menuChildItemSchema has no `children` field) rather than a
 * recursive schema — simpler to validate and to edit in the UI.
 */

export const menuChildItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(60),
  kind: z.enum(["anchor", "internal", "external"]),
  href: z.string().min(1).max(500),
  style: z.enum(["link", "button"]).default("link"),
  newTab: z.boolean().default(false),
});

export const menuItemSchema = menuChildItemSchema.extend({
  children: z.array(menuChildItemSchema).max(12).default([]),
});

export const menuItemsSchema = z.array(menuItemSchema).max(20);

export type MenuChildItem = z.infer<typeof menuChildItemSchema>;
export type MenuItem = z.infer<typeof menuItemSchema>;

/** Mirrors SectionKeySchema in src/app/actions/pages.ts. */
export const MenuSlugSchema = z
  .string()
  .min(1)
  .max(60)
  .regex(/^[a-z0-9_]+$/, "Slug must be lowercase letters, numbers, and underscores only");

/** The header menu is seeded and required — it can never be deleted or recreated under this slug. */
export const RESERVED_MENU_SLUG = "header";

/**
 * Runs every item (and child item) href through sanitizeBlockUrl, which
 * rejects javascript:/data:/other unsafe schemes and allows only http(s)
 * URLs, site-relative paths, and #anchor fragments. Items whose href is
 * rejected are dropped entirely (rather than persisted with an empty href).
 */
export function sanitizeMenuItems(items: MenuItem[]): MenuItem[] {
  return items
    .map((item) => {
      const href = sanitizeBlockUrl(item.href);
      if (!href) return null;
      const children = item.children
        .map((child) => {
          const childHref = sanitizeBlockUrl(child.href);
          if (!childHref) return null;
          return { ...child, href: childHref };
        })
        .filter((child): child is MenuChildItem => child !== null);
      return { ...item, href, children };
    })
    .filter((item): item is MenuItem => item !== null);
}
