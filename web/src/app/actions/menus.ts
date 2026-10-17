"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { DEMO_DISABLED_MESSAGE, isDemoMode } from "@/lib/demo";
import { menuItemsSchema, sanitizeMenuItems, MenuSlugSchema, RESERVED_MENU_SLUG, type MenuItem } from "@/lib/menus/schema";
import { recordRevisionAndPrune, MAX_REVISIONS } from "@/lib/cms/revisions";
import type { SiteMenuRow, PageRevisionRow } from "@/types/cms";

// ============================================================
// Navigation menus: visual navbar/footer editor. Mirrors the draft/publish +
// revisions conventions in src/app/actions/pages.ts (inline admin check,
// {success?, error?} return shape, upsert-free draft writes).
// ============================================================

/** Public + admin: returns all menus (RLS scopes non-admin callers to published-only). */
export async function getSiteMenus(): Promise<SiteMenuRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("site_menus").select("*").order("sort_order");
  return (data as SiteMenuRow[] | null) || [];
}

/**
 * Public: returns published menus (used to render the marketing header and
 * footer). `slugs`, when provided, restricts the result to those slugs —
 * e.g. `["footer_platform", "footer_support"]` for the footer columns.
 */
export async function getPublishedMenus(
  slugs?: string[]
): Promise<Pick<SiteMenuRow, "slug" | "title" | "items" | "sort_order">[]> {
  const supabase = await createClient();
  let query = supabase
    .from("site_menus")
    .select("slug, title, items, sort_order")
    .eq("is_published", true)
    .order("sort_order");

  if (slugs && slugs.length > 0) {
    query = query.in("slug", slugs);
  }

  const { data } = await query;
  return (data as Pick<SiteMenuRow, "slug" | "title" | "items" | "sort_order">[] | null) || [];
}

/**
 * Admin-only: validates + sanitizes a menu's draft item tree and writes it
 * to `draft_items` only — never touches the live `items` column. Updates by
 * slug (not upsert — menus are created explicitly via `createSiteMenu`), so
 * this returns an error if the slug doesn't exist yet.
 */
export async function saveMenuDraft(slug: string, items: unknown[]): Promise<{ success?: true; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: userRow } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (userRow?.role !== "admin") return { error: "Admin only" };

  const slugParsed = MenuSlugSchema.safeParse(slug);
  if (!slugParsed.success) return { error: "Invalid menu slug" };

  const itemsParsed = menuItemsSchema.safeParse(items);
  if (!itemsParsed.success) return { error: "Invalid menu items" };

  const sanitized = sanitizeMenuItems(itemsParsed.data);

  const { data, error } = await supabase
    .from("site_menus")
    .update({
      draft_items: sanitized,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("slug", slugParsed.data)
    .select("id");

  if (error) return { error: "Failed to save draft" };
  if (!data || data.length === 0) return { error: "Menu not found" };

  return { success: true };
}

/**
 * Admin-only: copies a menu's `draft_items` into the live `items` column,
 * marks it published, snapshots a `page_revisions` row, and prunes old
 * revisions beyond the most recent MAX_REVISIONS for this menu.
 */
export async function publishMenuDraft(slug: string): Promise<{ success?: true; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: userRow } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (userRow?.role !== "admin") return { error: "Admin only" };

  const { data: menu, error: fetchError } = await supabase
    .from("site_menus")
    .select("*")
    .eq("slug", slug)
    .single();
  if (fetchError || !menu) return { error: "Menu not found" };

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("site_menus")
    .update({
      items: menu.draft_items,
      is_published: true,
      published_at: now,
      updated_at: now,
      updated_by: user.id,
    })
    .eq("slug", slug);

  if (error) return { error: "Failed to publish menu" };

  await recordRevisionAndPrune(supabase, { menuSlug: slug }, menu.draft_items, { title: menu.title }, user.id);

  revalidatePath("/");
  revalidatePath("/landing");
  return { success: true };
}

/**
 * Admin-only: restores a revision's snapshot into `draft_items` only — never
 * directly into the live `items` column. An explicit publish is still
 * required afterwards to make the restored menu live.
 */
export async function restoreMenuRevision(revisionId: string): Promise<{ success?: true; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: userRow } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (userRow?.role !== "admin") return { error: "Admin only" };

  const { data: revision, error: fetchError } = await supabase
    .from("page_revisions")
    .select("*")
    .eq("id", revisionId)
    .single();
  if (fetchError || !revision || !revision.menu_slug) return { error: "Revision not found" };

  const { error } = await supabase
    .from("site_menus")
    .update({
      draft_items: revision.content,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq("slug", revision.menu_slug);

  if (error) return { error: "Failed to restore revision" };
  return { success: true };
}

/**
 * Admin-only: creates a brand-new menu with an empty item tree, appended
 * after the current highest `sort_order`. The `header` slug is reserved
 * (seeded at install time) and cannot be recreated.
 */
export async function createSiteMenu(slug: string, title: string): Promise<{ success?: true; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: userRow } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (userRow?.role !== "admin") return { error: "Admin only" };

  const slugParsed = MenuSlugSchema.safeParse(slug);
  if (!slugParsed.success) return { error: "Invalid menu slug" };
  if (slugParsed.data === RESERVED_MENU_SLUG) return { error: "This slug is reserved" };

  const titleParsed = z.string().min(1).max(100).safeParse(title);
  if (!titleParsed.success) return { error: "Invalid title" };

  const { count } = await supabase.from("site_menus").select("*", { count: "exact", head: true });

  const { error } = await supabase.from("site_menus").insert({
    slug: slugParsed.data,
    title: titleParsed.data,
    items: [],
    draft_items: [],
    is_published: false,
    sort_order: (count ?? 0) + 1,
    updated_by: user.id,
  });

  if (error) {
    if ((error as { code?: string }).code === "23505") {
      return { error: "A menu with this slug already exists" };
    }
    return { error: "Failed to create menu" };
  }

  revalidatePath("/admin/website/navigation");
  return { success: true };
}

/** Admin-only: deletes a menu. The reserved `header` menu can never be deleted. */
export async function deleteSiteMenu(slug: string): Promise<{ success?: true; error?: string }> {
  if (isDemoMode()) return { error: DEMO_DISABLED_MESSAGE };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: userRow } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (userRow?.role !== "admin") return { error: "Admin only" };

  if (slug === RESERVED_MENU_SLUG) return { error: "The header menu cannot be deleted" };

  const { error } = await supabase.from("site_menus").delete().eq("slug", slug);
  if (error) return { error: "Failed to delete menu" };

  revalidatePath("/admin/website/navigation");
  revalidatePath("/");
  revalidatePath("/landing");
  return { success: true };
}

/**
 * Admin-only: persists a new sort order for site menus (drives footer-column
 * reordering in the admin menu list — no drag-and-drop at the list level).
 */
export async function reorderSiteMenus(
  order: { slug: string; sort_order: number }[]
): Promise<{ success?: true; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: userRow } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (userRow?.role !== "admin") return { error: "Admin only" };

  for (const { slug, sort_order } of order) {
    const { error } = await supabase.from("site_menus").update({ sort_order }).eq("slug", slug);
    if (error) return { error: "Failed to reorder menus" };
  }

  revalidatePath("/admin/website/navigation");
  revalidatePath("/landing");
  return { success: true };
}

/**
 * Lists revisions for a menu, newest first, capped at MAX_REVISIONS
 * (matches the prune limit in recordRevisionAndPrune).
 */
export async function getMenuRevisions(slug: string): Promise<PageRevisionRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("page_revisions")
    .select("*")
    .eq("menu_slug", slug)
    .order("created_at", { ascending: false })
    .limit(MAX_REVISIONS);

  return (data as PageRevisionRow[] | null) || [];
}

export type { MenuItem };
