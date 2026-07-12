-- CMS v2: draft/publish workflow, revision history, and page image storage.
-- Builds on the visual editor tables introduced in 00025_add_visual_pages.sql.

-- ============================================================
-- 1. Drop the unused normalized blocks table.
-- page_blocks was never wired up in application code (content JSONB on
-- site_sections/therapist_pages is the actual source of truth) — verified
-- zero references anywhere in web/src.
-- ============================================================
DROP POLICY IF EXISTS "Therapists manage own page blocks" ON page_blocks;
DROP POLICY IF EXISTS "Public read blocks for published pages" ON page_blocks;
DROP TABLE IF EXISTS page_blocks;

-- ============================================================
-- 2. Draft/publish split for site_sections and therapist_pages.
-- content stays the live/published snapshot; draft_content is the
-- working copy edited in the visual builder until explicitly published.
-- ============================================================
ALTER TABLE site_sections
  ADD COLUMN IF NOT EXISTS draft_content JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

ALTER TABLE therapist_pages
  ADD COLUMN IF NOT EXISTS draft_content JSONB NOT NULL DEFAULT '[]';

-- Backfill existing rows so their working draft matches live content.
UPDATE site_sections SET draft_content = content WHERE draft_content = '[]'::jsonb;
UPDATE therapist_pages SET draft_content = content WHERE draft_content = '[]'::jsonb;

-- ============================================================
-- 3. Revision history for both global sections and therapist pages.
-- ============================================================
CREATE TABLE IF NOT EXISTS page_revisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_key TEXT REFERENCES site_sections(key) ON DELETE CASCADE,
  page_id UUID REFERENCES therapist_pages(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  meta JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((section_key IS NULL) <> (page_id IS NULL))
);

CREATE INDEX IF NOT EXISTS idx_page_revisions_section ON page_revisions(section_key, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_revisions_page ON page_revisions(page_id, created_at DESC);

ALTER TABLE page_revisions ENABLE ROW LEVEL SECURITY;

-- Admins manage revisions of global site sections.
CREATE POLICY "Admins manage site section revisions" ON page_revisions
  FOR ALL USING (
    section_key IS NOT NULL
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Therapists manage revisions of their own pages.
CREATE POLICY "Therapists manage own page revisions" ON page_revisions
  FOR ALL USING (
    page_id IN (SELECT id FROM therapist_pages WHERE therapist_id = auth.uid())
  );

-- ============================================================
-- 4. Storage bucket for images used in visual pages/sections.
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'page-images',
  'page-images',
  TRUE,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Uploads restricted to the uploader's own folder (first path segment = auth.uid()).
CREATE POLICY "Users can upload own page images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'page-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Bucket is public; anyone can read page images.
CREATE POLICY "Public read page images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'page-images');

-- Owner or admin can delete.
CREATE POLICY "Users or admins can delete own page images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'page-images'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- ============================================================
-- 5. anon read access to site_sections.
-- NOTE: init.sql (supabase/volumes/db/init.sql) already runs
-- `GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;` for this project,
-- so the anon role already has table-level SELECT and is restricted further
-- by the "Public read published site sections" RLS policy from 00025. No
-- additional GRANT is required here; this comment documents that finding.
-- ============================================================

COMMENT ON TABLE page_revisions IS 'Snapshot history of published content for site_sections and therapist_pages, written on each publish.';
COMMENT ON COLUMN site_sections.draft_content IS 'Working copy edited in the visual builder; copy to content to publish.';
COMMENT ON COLUMN therapist_pages.draft_content IS 'Working copy edited in the visual builder; copy to content to publish.';
