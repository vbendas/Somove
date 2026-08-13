import type { createClient } from "@/lib/supabase/server";

export const MAX_REVISIONS = 20;

type RevisionTarget = { sectionKey: string } | { pageId: string } | { menuSlug: string };

/**
 * Inserts a `page_revisions` snapshot for a just-published target (site
 * section, therapist page, or site menu), then prunes older revisions
 * beyond the most recent MAX_REVISIONS for that same target. Exactly one of
 * sectionKey/pageId/menuSlug must be provided (mirrors the DB CHECK
 * constraint on page_revisions, widened to three targets in
 * 00029_site_menus.sql). Shared by src/app/actions/pages.ts and
 * src/app/actions/menus.ts.
 */
export async function recordRevisionAndPrune(
  supabase: Awaited<ReturnType<typeof createClient>>,
  target: RevisionTarget,
  content: unknown[],
  meta: Record<string, unknown>,
  userId: string
): Promise<void> {
  const column = "sectionKey" in target ? "section_key" : "pageId" in target ? "page_id" : "menu_slug";
  const value = "sectionKey" in target ? target.sectionKey : "pageId" in target ? target.pageId : target.menuSlug;

  await supabase.from("page_revisions").insert({
    section_key: "sectionKey" in target ? target.sectionKey : null,
    page_id: "pageId" in target ? target.pageId : null,
    menu_slug: "menuSlug" in target ? target.menuSlug : null,
    content,
    meta,
    created_by: userId,
  });

  const { data: revisions } = await supabase
    .from("page_revisions")
    .select("id")
    .eq(column, value)
    .order("created_at", { ascending: false });

  const staleIds = (revisions || []).slice(MAX_REVISIONS).map((r: { id: string }) => r.id);
  if (staleIds.length > 0) {
    await supabase.from("page_revisions").delete().in("id", staleIds);
  }
}
