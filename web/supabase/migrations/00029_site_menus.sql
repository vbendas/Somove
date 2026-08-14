-- Site navigation menus: visually managed navbar + footer menus with
-- draft/publish workflow and revision history, mirroring the site_sections
-- pattern introduced in 00025_add_visual_pages.sql / 00027_cms_v2.sql.
--
-- Menu items are stored as a JSONB tree with a hard-coded max depth of two
-- (top-level items + one level of children) — enforced in application code
-- (src/lib/menus/schema.ts), not in SQL.

-- ============================================================
-- 1. site_menus table.
-- ============================================================
CREATE TABLE IF NOT EXISTS site_menus (
  -- gen_random_uuid() is a pg_catalog builtin (PG13+), unlike
  -- uuid_generate_v4() which comes from uuid-ossp and lives in the
  -- `extensions` schema -- not on the search_path the CLI uses to apply
  -- migrations, so an unqualified call fails with 42883.
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE, -- 'header', 'footer_platform', 'footer_support', ...
  title TEXT NOT NULL, -- display name in the admin menu list
  items JSONB NOT NULL DEFAULT '[]', -- published tree
  draft_items JSONB NOT NULL DEFAULT '[]', -- working copy edited in the menu editor
  is_published BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0, -- footer column order; irrelevant for 'header'
  published_at TIMESTAMPTZ,
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_menus_slug ON site_menus(slug);
CREATE INDEX IF NOT EXISTS idx_site_menus_sort_order ON site_menus(sort_order);

ALTER TABLE site_menus ENABLE ROW LEVEL SECURITY;

-- Admins manage all menus (mirrors "Admins manage site sections", 00025).
CREATE POLICY "Admins manage site menus" ON site_menus
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Public read published menus only (mirrors "Public read published site
-- sections", 00025). anon already has table-level SELECT granted via
-- init.sql's project-wide `GRANT SELECT ON ALL TABLES IN SCHEMA public TO
-- anon;` — no additional GRANT needed, same as documented in 00027.
CREATE POLICY "Public read published site menus" ON site_menus
  FOR SELECT USING (is_published = true);

CREATE TRIGGER update_site_menus_updated_at
BEFORE UPDATE ON site_menus
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE site_menus IS 'Navbar/footer navigation menus managed via the visual menu editor. items is the published tree; draft_items is the working copy.';
COMMENT ON COLUMN site_menus.items IS 'Published tree: MenuItem[] (see src/lib/menus/schema.ts), max depth 2.';
COMMENT ON COLUMN site_menus.draft_items IS 'Working copy edited in the menu editor; copied to items on publish.';

-- ============================================================
-- 2. Extend page_revisions to also snapshot menu publishes.
-- The original CHECK from 00027_cms_v2.sql enforces exactly one of
-- section_key/page_id being set; find its auto-generated name dynamically
-- (it was declared inline, so Postgres assigned the name) rather than
-- guessing it, then replace it with a three-way version.
-- ============================================================
ALTER TABLE page_revisions
  ADD COLUMN IF NOT EXISTS menu_slug TEXT REFERENCES site_menus(slug) ON DELETE CASCADE;

DO $$
DECLARE
  con_name text;
BEGIN
  SELECT conname INTO con_name
  FROM pg_constraint
  WHERE conrelid = 'page_revisions'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%section_key%page_id%'
    AND pg_get_constraintdef(oid) NOT LIKE '%menu_slug%';
  IF con_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE page_revisions DROP CONSTRAINT %I', con_name);
  END IF;
END $$;

ALTER TABLE page_revisions DROP CONSTRAINT IF EXISTS page_revisions_one_target;
ALTER TABLE page_revisions ADD CONSTRAINT page_revisions_one_target CHECK (
  (section_key IS NOT NULL)::int + (page_id IS NOT NULL)::int + (menu_slug IS NOT NULL)::int = 1
);

CREATE INDEX IF NOT EXISTS idx_page_revisions_menu ON page_revisions(menu_slug, created_at DESC);

-- Admins manage revisions of site menus (mirrors the section-revisions
-- policy from 00027_cms_v2.sql).
CREATE POLICY "Admins manage menu revisions" ON page_revisions
  FOR ALL USING (
    menu_slug IS NOT NULL
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

COMMENT ON COLUMN page_revisions.menu_slug IS 'Set when this revision snapshots a site_menus publish; section_key/page_id are NULL in that case.';

-- ============================================================
-- 3. Seed the header menu and two footer menus with the current
-- hardcoded links (marketing-header.tsx NAV_LINKS, marketing-footer.tsx
-- FOOTER_LINKS) so shipping this feature is a visual no-op. Published and
-- draft trees start identical, same convention as 00028_seed_homepage_sections.sql.
-- Safe to re-run: ON CONFLICT (slug) DO NOTHING.
-- ============================================================
INSERT INTO site_menus (slug, title, items, draft_items, is_published, sort_order, published_at)
VALUES
(
  'header',
  'Header',
  '[
    {"id": "00000000-0000-4000-a000-000000000001", "label": "How It Works", "kind": "anchor", "href": "#how-it-works", "style": "link", "newTab": false, "children": []},
    {"id": "00000000-0000-4000-a000-000000000002", "label": "Pricing", "kind": "anchor", "href": "#pricing", "style": "link", "newTab": false, "children": []},
    {"id": "00000000-0000-4000-a000-000000000003", "label": "Testimonials", "kind": "anchor", "href": "#testimonials", "style": "link", "newTab": false, "children": []},
    {"id": "00000000-0000-4000-a000-000000000004", "label": "Log in", "kind": "internal", "href": "/login", "style": "button", "newTab": false, "children": []}
  ]'::jsonb,
  '[
    {"id": "00000000-0000-4000-a000-000000000001", "label": "How It Works", "kind": "anchor", "href": "#how-it-works", "style": "link", "newTab": false, "children": []},
    {"id": "00000000-0000-4000-a000-000000000002", "label": "Pricing", "kind": "anchor", "href": "#pricing", "style": "link", "newTab": false, "children": []},
    {"id": "00000000-0000-4000-a000-000000000003", "label": "Testimonials", "kind": "anchor", "href": "#testimonials", "style": "link", "newTab": false, "children": []},
    {"id": "00000000-0000-4000-a000-000000000004", "label": "Log in", "kind": "internal", "href": "/login", "style": "button", "newTab": false, "children": []}
  ]'::jsonb,
  true, 0, NOW()
),
(
  'footer_platform',
  'Platform',
  '[
    {"id": "00000000-0000-4000-a000-000000000011", "label": "Find a Therapist", "kind": "internal", "href": "/therapists", "style": "link", "newTab": false, "children": []},
    {"id": "00000000-0000-4000-a000-000000000012", "label": "How It Works", "kind": "anchor", "href": "#how-it-works", "style": "link", "newTab": false, "children": []},
    {"id": "00000000-0000-4000-a000-000000000013", "label": "Pricing", "kind": "anchor", "href": "#pricing", "style": "link", "newTab": false, "children": []},
    {"id": "00000000-0000-4000-a000-000000000014", "label": "Log in", "kind": "internal", "href": "/login", "style": "link", "newTab": false, "children": []}
  ]'::jsonb,
  '[
    {"id": "00000000-0000-4000-a000-000000000011", "label": "Find a Therapist", "kind": "internal", "href": "/therapists", "style": "link", "newTab": false, "children": []},
    {"id": "00000000-0000-4000-a000-000000000012", "label": "How It Works", "kind": "anchor", "href": "#how-it-works", "style": "link", "newTab": false, "children": []},
    {"id": "00000000-0000-4000-a000-000000000013", "label": "Pricing", "kind": "anchor", "href": "#pricing", "style": "link", "newTab": false, "children": []},
    {"id": "00000000-0000-4000-a000-000000000014", "label": "Log in", "kind": "internal", "href": "/login", "style": "link", "newTab": false, "children": []}
  ]'::jsonb,
  true, 0, NOW()
),
(
  'footer_support',
  'Support',
  '[
    {"id": "00000000-0000-4000-a000-000000000021", "label": "Emergency Resources", "kind": "internal", "href": "/emergency", "style": "link", "newTab": false, "children": []},
    {"id": "00000000-0000-4000-a000-000000000022", "label": "Terms of Service", "kind": "internal", "href": "/legal/terms", "style": "link", "newTab": false, "children": []},
    {"id": "00000000-0000-4000-a000-000000000023", "label": "Privacy Policy", "kind": "internal", "href": "/legal/privacy", "style": "link", "newTab": false, "children": []}
  ]'::jsonb,
  '[
    {"id": "00000000-0000-4000-a000-000000000021", "label": "Emergency Resources", "kind": "internal", "href": "/emergency", "style": "link", "newTab": false, "children": []},
    {"id": "00000000-0000-4000-a000-000000000022", "label": "Terms of Service", "kind": "internal", "href": "/legal/terms", "style": "link", "newTab": false, "children": []},
    {"id": "00000000-0000-4000-a000-000000000023", "label": "Privacy Policy", "kind": "internal", "href": "/legal/privacy", "style": "link", "newTab": false, "children": []}
  ]'::jsonb,
  true, 1, NOW()
)
ON CONFLICT (slug) DO NOTHING;
