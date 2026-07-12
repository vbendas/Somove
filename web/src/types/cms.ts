// Lightweight row types for the CMS v2 tables added in migrations
// 00027_cms_v2.sql and 00028_seed_homepage_sections.sql.
//
// These are plain interfaces, not part of the generated `Database` type in
// `./database.ts` — regenerating that file requires live DB access, which
// isn't available in this environment. `database.ts` already has
// `SiteSection` / `TherapistPage` / `PageBlock` interfaces from an earlier
// pass, but they predate the draft/publish split (no `draft_content`,
// `sort_order`, `published_at` on `SiteSection`) and `PageBlock` now refers
// to a table that migration 00027 drops. Prefer the *Row types below for
// new code; the block registry/Zod schemas that validate `content` /
// `draft_content` land in a parallel task.

export interface SiteSectionRow {
  id: string;
  key: string;
  title: string | null;
  content: unknown[]; // Block[] — published/live content
  draft_content: unknown[]; // Block[] — working copy edited in the builder
  is_published: boolean;
  sort_order: number;
  published_at: string | null;
  updated_by: string | null;
  updated_at: string;
  created_at: string;
}

export interface TherapistPageRow {
  id: string;
  therapist_id: string;
  slug: string;
  title: string;
  description: string | null;
  content: unknown[]; // Block[] — published/live content
  draft_content: unknown[]; // Block[] — working copy edited in the builder
  status: "draft" | "published";
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PageRevisionRow {
  id: string;
  section_key: string | null;
  page_id: string | null;
  content: unknown[]; // Block[] snapshot at time of publish
  meta: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
}
