import type { createClient } from "@/lib/supabase/server";
import { menuItemsSchema, type MenuItem } from "@/lib/menus/schema";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export interface FooterMenu {
  title: string;
  items: MenuItem[];
}

export interface LoadedMenus {
  headerItems: MenuItem[];
  footerMenus: FooterMenu[];
}

/**
 * Fallback content — identical to the header/footer menus seeded in
 * 00029_site_menus.sql (which themselves mirror the NAV_LINKS/FOOTER_LINKS
 * arrays this feature replaces). Used only on the published (non-preview)
 * path, whenever the `site_menus` fetch fails or no published menu exists
 * yet, so the public site can never break because of a CMS misconfiguration.
 */
const FALLBACK_HEADER_ITEMS: MenuItem[] = [
  { id: "fallback-how-it-works", label: "How It Works", kind: "anchor", href: "#how-it-works", style: "link", newTab: false, children: [] },
  { id: "fallback-pricing", label: "Pricing", kind: "anchor", href: "#pricing", style: "link", newTab: false, children: [] },
  { id: "fallback-testimonials", label: "Testimonials", kind: "anchor", href: "#testimonials", style: "link", newTab: false, children: [] },
  { id: "fallback-login", label: "Log in", kind: "internal", href: "/login", style: "button", newTab: false, children: [] },
];

const FALLBACK_FOOTER_MENUS: FooterMenu[] = [
  {
    title: "Platform",
    items: [
      { id: "fallback-find-therapist", label: "Find a Therapist", kind: "internal", href: "/therapists", style: "link", newTab: false, children: [] },
      { id: "fallback-footer-how-it-works", label: "How It Works", kind: "anchor", href: "#how-it-works", style: "link", newTab: false, children: [] },
      { id: "fallback-footer-pricing", label: "Pricing", kind: "anchor", href: "#pricing", style: "link", newTab: false, children: [] },
      { id: "fallback-footer-login", label: "Log in", kind: "internal", href: "/login", style: "link", newTab: false, children: [] },
    ],
  },
  {
    title: "Support",
    items: [
      { id: "fallback-emergency", label: "Emergency Resources", kind: "internal", href: "/emergency", style: "link", newTab: false, children: [] },
      { id: "fallback-terms", label: "Terms of Service", kind: "internal", href: "/legal/terms", style: "link", newTab: false, children: [] },
      { id: "fallback-privacy", label: "Privacy Policy", kind: "internal", href: "/legal/privacy", style: "link", newTab: false, children: [] },
    ],
  },
];

function parseItems(raw: unknown): MenuItem[] {
  const parsed = menuItemsSchema.safeParse(raw);
  return parsed.success ? parsed.data : [];
}

/**
 * Loads the published header + footer menus for the public site, falling
 * back to the static defaults on any fetch error or if nothing is
 * published yet. Uses the anon-scoped `supabase` client already created by
 * the caller (RLS restricts the read to `is_published = true` rows).
 */
export async function loadPublishedMenus(supabase: SupabaseClient): Promise<LoadedMenus> {
  try {
    const { data } = await supabase
      .from("site_menus")
      .select("slug, title, items, sort_order")
      .eq("is_published", true)
      .order("sort_order");
    const rows = (data ?? []) as { slug: string; title: string; items: unknown }[];

    const headerRow = rows.find((r) => r.slug === "header");
    const headerItems = headerRow ? parseItems(headerRow.items) : [];

    const footerMenus = rows
      .filter((r) => r.slug.startsWith("footer_"))
      .map((r) => ({ title: r.title, items: parseItems(r.items) }))
      .filter((menu) => menu.items.length > 0);

    return {
      headerItems: headerItems.length > 0 ? headerItems : FALLBACK_HEADER_ITEMS,
      footerMenus: footerMenus.length > 0 ? footerMenus : FALLBACK_FOOTER_MENUS,
    };
  } catch {
    return { headerItems: FALLBACK_HEADER_ITEMS, footerMenus: FALLBACK_FOOTER_MENUS };
  }
}

/**
 * Builds the draft-preview equivalent of loadPublishedMenus from already
 * admin-authorized `site_menus` rows (see landing/page.tsx's `?preview=1`
 * branch). No fallback: an empty draft renders empty, same as the existing
 * block-content draft preview — the admin is looking at exactly what they
 * have drafted so far.
 */
export function loadDraftMenus(rows: { slug: string; title: string; draft_items: unknown }[]): LoadedMenus {
  const headerRow = rows.find((r) => r.slug === "header");
  const headerItems = headerRow ? parseItems(headerRow.draft_items) : [];

  const footerMenus = rows
    .filter((r) => r.slug.startsWith("footer_"))
    .map((r) => ({ title: r.title, items: parseItems(r.draft_items) }))
    .filter((menu) => menu.items.length > 0);

  return { headerItems, footerMenus };
}
