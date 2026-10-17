import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getPlatformSettings } from "@/lib/platform";
import { BlockRenderer, type Block } from "@/components/blocks/BlockRenderer";
import { keyToAnchorId } from "@/lib/menus/anchors";
import { loadPublishedMenus, loadDraftMenus, type LoadedMenus } from "@/lib/menus/load";
import { isDemoMode } from "@/lib/demo";
import { DemoEntryBanner } from "@/components/marketing/demo-entry-banner";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPlatformSettings();
  const tagline = settings.platform_tagline || "Professional Session Platform";

  return {
    title: `${settings.platform_name} — ${tagline}`,
    description: `Book sessions with certified professionals on ${settings.platform_name}. Video calls, secure messaging, and practice management.`,
  };
}

interface SiteSectionRow {
  key: string;
  content: unknown;
  sort_order: number;
}

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  const sp = await searchParams;
  const isPreview = sp.preview === "1";

  const supabase = await createClient();

  let sections: SiteSectionRow[] | null = null;
  let menus: LoadedMenus | null = null;
  // True only once we've actually loaded admin draft content below — stays
  // false if `isPreview` was requested but the auth/role check failed, so
  // we don't force light mode on the normal published-content fallback.
  let isDraftPreview = false;

  if (isPreview) {
    // Draft preview: only admins may see draft_content/draft_items. Verify
    // server-side before touching any draft data; anyone else silently
    // falls through to the normal published view below (no error, no hint
    // that preview mode exists).
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let isAdmin = false;
    if (user) {
      const { data: userRow } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();
      isAdmin = userRow?.role === "admin";
    }

    if (isAdmin) {
      const { data } = await supabase
        .from("site_sections")
        .select("key, draft_content, sort_order")
        .order("sort_order");
      sections = (data ?? []).map((row) => ({
        key: row.key,
        content: row.draft_content,
        sort_order: row.sort_order,
      }));

      const { data: menuRows } = await supabase.from("site_menus").select("slug, title, draft_items");
      menus = loadDraftMenus(menuRows ?? []);

      isDraftPreview = true;
    }
  }

  if (!sections) {
    const { data } = await supabase
      .from("site_sections")
      .select("key, content, sort_order")
      .eq("is_published", true)
      .order("sort_order");
    sections = data ?? [];
  }

  if (!menus) {
    menus = await loadPublishedMenus(supabase);
  }

  const body = (
    <div className="min-h-screen bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      {isDemoMode() && <DemoEntryBanner />}
      <MarketingHeader items={menus.headerItems} />
      <main id="main-content">
        {sections.map((section) => (
          // No padding/width classes here — each block renderer already
          // provides its own container-wide + section-padding (they're
          // reused as-is on therapist custom pages, which have no such
          // wrapper). Adding them here again would double the vertical
          // spacing between every section.
          <section key={section.key} id={keyToAnchorId(section.key)}>
            <BlockRenderer blocks={(section.content ?? []) as Block[]} />
          </section>
        ))}
      </main>
      <MarketingFooter menus={menus.footerMenus} />
    </div>
  );

  // Draft preview is an admin composing tool (reached from the visual
  // editor), not the public page — force light mode so it matches what
  // visitors will actually see. Same rationale/mechanism as
  // EditorCanvas.tsx's canvas wrapper: the `.light` class in globals.css
  // wins the CSS-variable cascade for --background/--foreground/etc.
  // regardless of the admin's own app-wide theme.
  if (isDraftPreview) {
    return (
      <div className="light" style={{ colorScheme: "light" }}>
        {body}
      </div>
    );
  }

  return body;
}
