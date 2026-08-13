-- Add support for per-therapist custom pages and global visual website editor
-- Tables for block-based visual editing

-- Global site content for website editor (homepage sections, etc.)
CREATE TABLE IF NOT EXISTS site_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE, -- e.g. 'homepage_hero', 'homepage_features'
  title TEXT,
  content JSONB NOT NULL DEFAULT '[]', -- array of blocks
  is_published BOOLEAN NOT NULL DEFAULT false,
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Per-therapist custom pages
CREATE TABLE IF NOT EXISTS therapist_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content JSONB NOT NULL DEFAULT '[]', -- array of {type, data, order}
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  seo_title TEXT,
  seo_description TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (therapist_id, slug)
);

-- Optional normalized blocks table (for advanced querying later; content JSONB is primary for v1)
CREATE TABLE IF NOT EXISTS page_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID REFERENCES therapist_pages(id) ON DELETE CASCADE,
  section_key TEXT, -- for global site_sections
  block_type TEXT NOT NULL, -- 'hero', 'text', 'image', 'cta', etc.
  block_data JSONB NOT NULL DEFAULT '{}',
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_therapist_pages_therapist ON therapist_pages(therapist_id);
CREATE INDEX IF NOT EXISTS idx_therapist_pages_slug ON therapist_pages(therapist_id, slug);
CREATE INDEX IF NOT EXISTS idx_therapist_pages_status ON therapist_pages(status);
CREATE INDEX IF NOT EXISTS idx_site_sections_key ON site_sections(key);
CREATE INDEX IF NOT EXISTS idx_page_blocks_page ON page_blocks(page_id);

-- RLS Policies
ALTER TABLE therapist_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_sections ENABLE ROW LEVEL SECURITY;

-- Therapists can manage their own pages
CREATE POLICY "Therapists manage own pages" ON therapist_pages
  FOR ALL USING (therapist_id = auth.uid());

-- Public can read published therapist pages
CREATE POLICY "Public read published therapist pages" ON therapist_pages
  FOR SELECT USING (status = 'published');

-- Blocks follow page ownership (simplified via page policy for now)
CREATE POLICY "Therapists manage own page blocks" ON page_blocks
  FOR ALL USING (
    page_id IN (SELECT id FROM therapist_pages WHERE therapist_id = auth.uid())
  );

-- Public read blocks for published pages
CREATE POLICY "Public read blocks for published pages" ON page_blocks
  FOR SELECT USING (
    page_id IN (SELECT id FROM therapist_pages WHERE status = 'published')
  );

-- Admin/owner manage site sections (using existing admin role check pattern)
CREATE POLICY "Admins manage site sections" ON site_sections
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Public read published site sections
CREATE POLICY "Public read published site sections" ON site_sections
  FOR SELECT USING (is_published = true);

-- Trigger for updated_at on therapist_pages
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_therapist_pages_updated_at
BEFORE UPDATE ON therapist_pages
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_sections_updated_at
BEFORE UPDATE ON site_sections
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE therapist_pages IS 'Custom pages created by therapists using the visual builder';
COMMENT ON TABLE site_sections IS 'Global website content blocks managed via visual editor (for homepage, etc.)';
COMMENT ON COLUMN therapist_pages.content IS 'JSON array of block objects: [{ "type": "hero" | "text" | "image" | "cta" | ..., "data": {...}, "order": 0 }]';