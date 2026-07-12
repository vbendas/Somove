import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getPlatformSettings } from "@/lib/platform";
import { BlockRenderer, type Block } from "@/components/blocks/BlockRenderer";

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

/**
 * Turns a `site_sections.key` like "homepage_how_it_works" into a stable
 * anchor slug ("how-it-works") so the marketing header's `#how-it-works`
 * link scrolls to the right section regardless of section ordering.
 */
function keyToAnchorId(key: string): string {
  return key.replace(/^homepage_/, "").replace(/_/g, "-");
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
  // True only once we've actually loaded admin draft content below — stays
  // false if `isPreview` was requested but the auth/role check failed, so
  // we don't force light mode on the normal published-content fallback.
  let isDraftPreview = false;

  if (isPreview) {
    // Draft preview: only admins may see draft_content. Verify server-side
    // before touching any draft data; anyone else silently falls through to
    // the normal published view below (no error, no hint that preview mode
    // exists).
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

  const content = (
    <>
      {sections.map((section) => (
        <section key={section.key} id={keyToAnchorId(section.key)} className="section-padding">
          <div className="container-wide">
            <BlockRenderer blocks={(section.content ?? []) as Block[]} />
          </div>
        </section>
      ))}
    </>
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
        {content}
      </div>
    );
  }

  return content;
}
