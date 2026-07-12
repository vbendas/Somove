"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Block } from "@/components/blocks/BlockRenderer";
import { sanitizeBlocks } from "@/lib/sanitize";
import { contentSchema, sanitizeBlockContent } from "@/blocks";
import type { PageRevisionRow } from "@/types/cms";

const PageSchema = z.object({
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(100),
  description: z.string().max(200).optional(),
  content: z.array(z.any()).default([]),
  status: z.enum(["draft", "published"]).default("draft"),
  seo_title: z.string().max(60).optional(),
  seo_description: z.string().max(160).optional(),
});

export type TherapistPageInput = z.infer<typeof PageSchema>;

export async function getTherapistPages(): Promise<any[]> { // eslint-disable-line @typescript-eslint/no-explicit-any

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("therapist_pages")
    .select("*")
    .eq("therapist_id", user.id)
    .order("created_at", { ascending: false });

  return data || [];
}

export async function getTherapistPage(slug: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("therapist_pages")
    .select("*")
    .eq("therapist_id", user.id)
    .eq("slug", slug)
    .single();

  return data;
}

export async function createOrUpdateTherapistPage(input: TherapistPageInput & { id?: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const parsed = PageSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid input" };
  }

  const payload = {
    ...parsed.data,
    content: sanitizeBlocks(parsed.data.content as Block[]),
    therapist_id: user.id,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { error } = await supabase
      .from("therapist_pages")
      .update(payload)
      .eq("id", input.id)
      .eq("therapist_id", user.id);

    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("therapist_pages")
      .insert(payload);

    if (error) return { error: error.message };
  }

  revalidatePath("/dashboard/pages");
  revalidatePath("/dashboard/settings");
  return { success: true };
}

const NewPageSchema = z.object({
  title: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
});

/**
 * Creates a blank draft page (empty content, `status: "draft"`) and returns
 * its id so the caller can redirect straight into the `[id]` editor route.
 * Split out from `createOrUpdateTherapistPage` (which doesn't return the new
 * row's id) specifically for that redirect — all further editing after
 * creation goes through `saveTherapistPageDraft` / `publishTherapistPageDraft`.
 */
export async function createTherapistPage(input: {
  title: string;
  slug: string;
}): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const parsed = NewPageSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const { data, error } = await supabase
    .from("therapist_pages")
    .insert({
      therapist_id: user.id,
      slug: parsed.data.slug,
      title: parsed.data.title,
      status: "draft",
      content: [],
      draft_content: [],
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return { error: "A page with this slug already exists" };
    return { error: "Failed to create page" };
  }

  revalidatePath("/dashboard/pages");
  return { id: data.id };
}

export async function deleteTherapistPage(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("therapist_pages")
    .delete()
    .eq("id", id)
    .eq("therapist_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/pages");
  return { success: true };
}

export async function publishTherapistPage(id: string, publish: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("therapist_pages")
    .update({
      status: publish ? "published" : "draft",
      published_at: publish ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .eq("therapist_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/pages");
  return { success: true };
}

// Global site sections (for admin / website editor)
export async function getSiteSections() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_sections")
    .select("*")
    .order("key");

  return data || [];
}

export async function updateSiteSection(key: string, content: Block[], isPublished: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: userRow } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (userRow?.role !== "admin") return { error: "Admin only" };

  const { error } = await supabase
    .from("site_sections")
    .upsert({
      key,
      content: sanitizeBlocks(content),
      is_published: isPublished,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: "key" });

  if (error) return { error: error.message };

  revalidatePath("/");
  return { success: true };
}

// ============================================================
// CMS v2: draft/publish workflow, revision history (Phase 2 Task 2.4).
// These are ADDITIVE — the actions above stay untouched so existing
// dashboard/admin pages keep working until a later phase migrates them.
// ============================================================

const SectionKeySchema = z
  .string()
  .min(1)
  .max(60)
  .regex(/^[a-z0-9_]+$/, "Key must be lowercase letters, numbers, and underscores only");

const DraftMetaSchema = z
  .object({
    title: z.string().min(1).max(100).optional(),
    description: z.string().max(200).optional(),
    seo_title: z.string().max(60).optional(),
    seo_description: z.string().max(160).optional(),
  })
  .optional();

const MAX_REVISIONS = 20;

/**
 * Validates + sanitizes a therapist's own draft block content and writes it
 * to `draft_content` only — never touches the live `content` column. An
 * explicit `publishTherapistPageDraft` call is required to make it live.
 */
export async function saveTherapistPageDraft(
  id: string,
  blocks: unknown[],
  meta?: { title?: string; description?: string; seo_title?: string; seo_description?: string }
): Promise<{ success?: true; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const parsedBlocks = contentSchema.safeParse(blocks);
  if (!parsedBlocks.success) return { error: "Invalid block content" };

  const metaParsed = DraftMetaSchema.safeParse(meta);
  if (!metaParsed.success) return { error: "Invalid page details" };

  const sanitized = sanitizeBlockContent(parsedBlocks.data);

  const payload: Record<string, unknown> = {
    draft_content: sanitized,
    updated_at: new Date().toISOString(),
  };
  if (metaParsed.data?.title !== undefined) payload.title = metaParsed.data.title;
  if (metaParsed.data?.description !== undefined) payload.description = metaParsed.data.description;
  if (metaParsed.data?.seo_title !== undefined) payload.seo_title = metaParsed.data.seo_title;
  if (metaParsed.data?.seo_description !== undefined) payload.seo_description = metaParsed.data.seo_description;

  const { error } = await supabase
    .from("therapist_pages")
    .update(payload)
    .eq("id", id)
    .eq("therapist_id", user.id);

  if (error) return { error: "Failed to save draft" };

  revalidatePath("/dashboard/pages");
  return { success: true };
}

/**
 * Admin-only: validates + sanitizes a site section's draft block content
 * and writes it to `draft_content` only. Upserts by `key`, so admins can
 * create a brand-new section key this way (supports a "new section" UI in
 * a later phase) — `key` is restricted to a safe identifier shape.
 */
export async function saveSectionDraft(key: string, blocks: unknown[]): Promise<{ success?: true; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: userRow } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (userRow?.role !== "admin") return { error: "Admin only" };

  const keyParsed = SectionKeySchema.safeParse(key);
  if (!keyParsed.success) return { error: "Invalid section key" };

  const parsedBlocks = contentSchema.safeParse(blocks);
  if (!parsedBlocks.success) return { error: "Invalid block content" };

  const sanitized = sanitizeBlockContent(parsedBlocks.data);

  const { error } = await supabase
    .from("site_sections")
    .upsert(
      {
        key: keyParsed.data,
        draft_content: sanitized,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );

  if (error) return { error: "Failed to save draft" };

  return { success: true };
}

/**
 * Inserts a `page_revisions` snapshot for a just-published target, then
 * prunes older revisions beyond the most recent `MAX_REVISIONS` for that
 * same target. `sectionKey` XOR `pageId` must be provided (mirrors the DB
 * CHECK constraint on page_revisions).
 */
async function recordRevisionAndPrune(
  supabase: Awaited<ReturnType<typeof createClient>>,
  target: { sectionKey: string } | { pageId: string },
  content: unknown[],
  meta: Record<string, unknown>,
  userId: string
): Promise<void> {
  const column = "sectionKey" in target ? "section_key" : "page_id";
  const value = "sectionKey" in target ? target.sectionKey : target.pageId;

  await supabase.from("page_revisions").insert({
    section_key: "sectionKey" in target ? target.sectionKey : null,
    page_id: "pageId" in target ? target.pageId : null,
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

/**
 * Copies a therapist page's `draft_content` into the live `content` column,
 * marks it published, snapshots a `page_revisions` row, and prunes old
 * revisions beyond the most recent 20 for this page.
 */
export async function publishTherapistPageDraft(id: string): Promise<{ success?: true; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: page, error: fetchError } = await supabase
    .from("therapist_pages")
    .select("*")
    .eq("id", id)
    .eq("therapist_id", user.id)
    .single();
  if (fetchError || !page) return { error: "Page not found" };

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("therapist_pages")
    .update({
      content: page.draft_content,
      status: "published",
      published_at: now,
      updated_at: now,
    })
    .eq("id", id)
    .eq("therapist_id", user.id);

  if (error) return { error: "Failed to publish page" };

  await recordRevisionAndPrune(
    supabase,
    { pageId: id },
    page.draft_content,
    {
      title: page.title,
      description: page.description,
      seo_title: page.seo_title,
      seo_description: page.seo_description,
    },
    user.id
  );

  revalidatePath("/dashboard/pages");
  revalidatePath(`/therapists/${page.therapist_id}/${page.slug}`);
  return { success: true };
}

/**
 * Admin-only: copies a site section's `draft_content` into the live
 * `content` column, marks it published, snapshots a `page_revisions` row,
 * and prunes old revisions beyond the most recent 20 for this section.
 */
export async function publishSectionDraft(key: string): Promise<{ success?: true; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: userRow } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (userRow?.role !== "admin") return { error: "Admin only" };

  const { data: section, error: fetchError } = await supabase
    .from("site_sections")
    .select("*")
    .eq("key", key)
    .single();
  if (fetchError || !section) return { error: "Section not found" };

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("site_sections")
    .update({
      content: section.draft_content,
      is_published: true,
      published_at: now,
      updated_at: now,
      updated_by: user.id,
    })
    .eq("key", key);

  if (error) return { error: "Failed to publish section" };

  await recordRevisionAndPrune(
    supabase,
    { sectionKey: key },
    section.draft_content,
    { title: section.title },
    user.id
  );

  // The public homepage renders sections at "/"; "/landing" is created by a
  // later task's marketing-site rewrite but revalidating it speculatively is
  // harmless — Next.js does not error on revalidating a path that doesn't
  // exist yet.
  revalidatePath("/");
  revalidatePath("/landing");
  return { success: true };
}

/**
 * Lists revisions for a therapist page or site section, newest first,
 * capped at MAX_REVISIONS (matches the prune limit in
 * recordRevisionAndPrune). RLS already scopes rows to the caller's own
 * pages / admin role; this additionally requires an authenticated caller.
 */
export async function getPageRevisions(
  target: { pageId: string } | { sectionKey: string }
): Promise<PageRevisionRow[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from("page_revisions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(MAX_REVISIONS);

  query = "pageId" in target ? query.eq("page_id", target.pageId) : query.eq("section_key", target.sectionKey);

  const { data } = await query;
  return (data as PageRevisionRow[] | null) || [];
}

/**
 * Admin-only: persists a new sort order for site sections (drives simple
 * up/down reordering in the admin section list — no drag-and-drop). Applies
 * one `.update()` per row rather than a batch RPC, which is fine at the
 * scale of a handful of site sections.
 */
export async function reorderSiteSections(
  order: { key: string; sort_order: number }[]
): Promise<{ success?: true; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: userRow } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (userRow?.role !== "admin") return { error: "Admin only" };

  for (const { key, sort_order } of order) {
    const { error } = await supabase
      .from("site_sections")
      .update({ sort_order })
      .eq("key", key);
    if (error) return { error: "Failed to reorder sections" };
  }

  revalidatePath("/admin/website");
  revalidatePath("/landing");
  return { success: true };
}

/**
 * Admin-only: creates a brand-new site section with empty content, appended
 * after the current highest `sort_order`. The editor page then lets the
 * admin build it out via `saveSectionDraft` / `publishSectionDraft`.
 */
export async function createSiteSection(key: string, title: string): Promise<{ success?: true; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: userRow } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (userRow?.role !== "admin") return { error: "Admin only" };

  const keyParsed = SectionKeySchema.safeParse(key);
  if (!keyParsed.success) return { error: "Invalid section key" };

  const titleParsed = z.string().min(1).max(100).safeParse(title);
  if (!titleParsed.success) return { error: "Invalid title" };

  const { count } = await supabase
    .from("site_sections")
    .select("*", { count: "exact", head: true });

  const { error } = await supabase.from("site_sections").insert({
    key: keyParsed.data,
    title: titleParsed.data,
    content: [],
    draft_content: [],
    is_published: false,
    sort_order: (count ?? 0) + 1,
    updated_by: user.id,
  });

  if (error) {
    if ((error as { code?: string }).code === "23505") {
      return { error: "A section with this key already exists" };
    }
    return { error: "Failed to create section" };
  }

  revalidatePath("/admin/website");
  return { success: true };
}

/**
 * Restores a revision's snapshot into `draft_content` only — never
 * directly into the live `content` column. An explicit publish is still
 * required afterwards to make the restored content live.
 */
export async function restorePageRevision(revisionId: string): Promise<{ success?: true; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: revision, error: fetchError } = await supabase
    .from("page_revisions")
    .select("*")
    .eq("id", revisionId)
    .single();
  if (fetchError || !revision) return { error: "Revision not found" };

  if (revision.page_id) {
    const { error } = await supabase
      .from("therapist_pages")
      .update({ draft_content: revision.content, updated_at: new Date().toISOString() })
      .eq("id", revision.page_id)
      .eq("therapist_id", user.id);

    if (error) return { error: "Failed to restore revision" };
    revalidatePath("/dashboard/pages");
    return { success: true };
  }

  if (revision.section_key) {
    const { data: userRow } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();
    if (userRow?.role !== "admin") return { error: "Admin only" };

    const { error } = await supabase
      .from("site_sections")
      .update({
        draft_content: revision.content,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq("key", revision.section_key);

    if (error) return { error: "Failed to restore revision" };
    return { success: true };
  }

  return { error: "Invalid revision" };
}
