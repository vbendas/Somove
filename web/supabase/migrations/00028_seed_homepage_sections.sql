-- Seed homepage site_sections with real launch copy, published and ready
-- to render. draft_content mirrors content so the visual builder opens on
-- the live copy. Safe to re-run: ON CONFLICT (key) DO NOTHING.

INSERT INTO site_sections (key, title, content, draft_content, is_published, sort_order, published_at)
VALUES
(
  'homepage_hero',
  'Hero',
  '[{"id": "hero-main", "type": "hero", "data": {
    "eyebrow": "Somatic Therapy",
    "title": "Heal Through Your Body",
    "subtitle": "Somatic therapy for anxiety, trauma, and emotional resilience. Discover the wisdom your body holds. Online sessions from wherever you feel safe.",
    "primaryCta": {"label": "Book Now", "href": "/therapists"},
    "secondaryCta": {"label": "Learn More", "href": "#how-it-works"},
    "trustBadges": ["Certified Therapist", "Secure & Private", "Online Sessions"]
  }}]'::jsonb,
  '[{"id": "hero-main", "type": "hero", "data": {
    "eyebrow": "Somatic Therapy",
    "title": "Heal Through Your Body",
    "subtitle": "Somatic therapy for anxiety, trauma, and emotional resilience. Discover the wisdom your body holds. Online sessions from wherever you feel safe.",
    "primaryCta": {"label": "Book Now", "href": "/therapists"},
    "secondaryCta": {"label": "Learn More", "href": "#how-it-works"},
    "trustBadges": ["Certified Therapist", "Secure & Private", "Online Sessions"]
  }}]'::jsonb,
  true, 0, NOW()
),
(
  'homepage_what_is',
  'What Is Somatic Therapy',
  '[{"id": "what-is-main", "type": "imageText", "data": {
    "eyebrow": "Our Services",
    "title": "Somatic Therapy Services",
    "html": "<p>Evidence-based body-centered approaches to healing and transformation.</p><p><strong>Body Awareness</strong> — Learn to listen to the signals your body sends. Tension, numbness, restlessness — they all carry meaning.</p><p><strong>Nervous System Regulation</strong> — Move from survival mode to safety using breath, movement, and gentle techniques to calm your nervous system.</p><p><strong>Movement &amp; Expression</strong> — Your body holds what words can''t reach. Through guided movement, process and release stored tension.</p><p><strong>Trauma Release</strong> — Gentle somatic techniques to process and release trauma stored in the body, building resilience from within.</p>",
    "imagePosition": "left"
  }}]'::jsonb,
  '[{"id": "what-is-main", "type": "imageText", "data": {
    "eyebrow": "Our Services",
    "title": "Somatic Therapy Services",
    "html": "<p>Evidence-based body-centered approaches to healing and transformation.</p><p><strong>Body Awareness</strong> — Learn to listen to the signals your body sends. Tension, numbness, restlessness — they all carry meaning.</p><p><strong>Nervous System Regulation</strong> — Move from survival mode to safety using breath, movement, and gentle techniques to calm your nervous system.</p><p><strong>Movement &amp; Expression</strong> — Your body holds what words can''t reach. Through guided movement, process and release stored tension.</p><p><strong>Trauma Release</strong> — Gentle somatic techniques to process and release trauma stored in the body, building resilience from within.</p>",
    "imagePosition": "left"
  }}]'::jsonb,
  true, 1, NOW()
),
(
  'homepage_how_it_works',
  'How It Works',
  '[{"id": "how-it-works-main", "type": "featureGrid", "data": {
    "eyebrow": "Getting Started",
    "title": "Your Healing Journey",
    "subtitle": "",
    "columns": 3,
    "style": "numbered",
    "items": [
      {"number": "01", "title": "Breathe Deeply", "description": "Begin with conscious breathing to ground yourself and create space for healing."},
      {"number": "02", "title": "Invite Energy", "description": "Through gentle somatic techniques, invite awareness and energy into areas of held tension."},
      {"number": "03", "title": "Heal Within", "description": "Allow your body''s natural intelligence to process, release, and integrate what''s been stored."}
    ]
  }}]'::jsonb,
  '[{"id": "how-it-works-main", "type": "featureGrid", "data": {
    "eyebrow": "Getting Started",
    "title": "Your Healing Journey",
    "subtitle": "",
    "columns": 3,
    "style": "numbered",
    "items": [
      {"number": "01", "title": "Breathe Deeply", "description": "Begin with conscious breathing to ground yourself and create space for healing."},
      {"number": "02", "title": "Invite Energy", "description": "Through gentle somatic techniques, invite awareness and energy into areas of held tension."},
      {"number": "03", "title": "Heal Within", "description": "Allow your body''s natural intelligence to process, release, and integrate what''s been stored."}
    ]
  }}]'::jsonb,
  true, 2, NOW()
),
(
  'homepage_stats',
  'Stats',
  '[{"id": "stats-main", "type": "stats", "data": {
    "items": [
      {"value": 500, "suffix": "+", "label": "Happy Client"},
      {"value": 98, "suffix": "%", "label": "Daily Client"},
      {"value": 15, "suffix": "+", "label": "Years of Experience"}
    ]
  }}]'::jsonb,
  '[{"id": "stats-main", "type": "stats", "data": {
    "items": [
      {"value": 500, "suffix": "+", "label": "Happy Client"},
      {"value": 98, "suffix": "%", "label": "Daily Client"},
      {"value": 15, "suffix": "+", "label": "Years of Experience"}
    ]
  }}]'::jsonb,
  true, 3, NOW()
),
(
  'homepage_testimonials',
  'Testimonials',
  '[{"id": "testimonials-main", "type": "testimonials", "data": {
    "eyebrow": "Feedback",
    "title": "Reiki Feedback from Happy Clients",
    "items": [
      {"quote": "I had tried talk therapy for years, but something was always missing. Working with the body changed everything. I''m actually releasing my trauma now.", "author": "Tammy Silva", "role": "Client for 6 months"},
      {"quote": "The full-body video setup made online therapy feel natural. I could move freely and still feel deeply connected to the process.", "author": "Paula Davis", "role": "Client for 3 months"},
      {"quote": "The between-session tools are a game-changer. When I feel overwhelmed at 2am, I open the app and do a grounding exercise.", "author": "Whitney Rain", "role": "Client for 1 year"},
      {"quote": "Somatic therapy helped me understand my body in ways I never imagined. The sessions are transformative and deeply healing.", "author": "Hailey Star", "role": "Client for 8 months"}
    ]
  }}]'::jsonb,
  '[{"id": "testimonials-main", "type": "testimonials", "data": {
    "eyebrow": "Feedback",
    "title": "Reiki Feedback from Happy Clients",
    "items": [
      {"quote": "I had tried talk therapy for years, but something was always missing. Working with the body changed everything. I''m actually releasing my trauma now.", "author": "Tammy Silva", "role": "Client for 6 months"},
      {"quote": "The full-body video setup made online therapy feel natural. I could move freely and still feel deeply connected to the process.", "author": "Paula Davis", "role": "Client for 3 months"},
      {"quote": "The between-session tools are a game-changer. When I feel overwhelmed at 2am, I open the app and do a grounding exercise.", "author": "Whitney Rain", "role": "Client for 1 year"},
      {"quote": "Somatic therapy helped me understand my body in ways I never imagined. The sessions are transformative and deeply healing.", "author": "Hailey Star", "role": "Client for 8 months"}
    ]
  }}]'::jsonb,
  true, 4, NOW()
),
(
  'homepage_pricing',
  'Pricing',
  '[{"id": "pricing-main", "type": "pricing", "data": {
    "eyebrow": "Session Options",
    "title": "Choose Your Path",
    "subtitle": "Transparent pricing. No hidden fees. EU-compliant invoices provided.",
    "tiers": [
      {
        "name": "Single Session",
        "price": "€90",
        "period": "/ session",
        "features": ["50-minute session", "Video or in-person", "Session notes provided", "Invoice provided"],
        "cta": {"label": "Book Now", "href": "/therapists"},
        "highlighted": false
      },
      {
        "name": "5 Session Package",
        "price": "€400",
        "period": "/ 5 sessions",
        "features": ["Everything in Single", "Priority scheduling", "Between-session messaging", "Grounding exercises library", "Save €50 vs individual"],
        "cta": {"label": "Book Now", "href": "/therapists"},
        "highlighted": true
      },
      {
        "name": "Monthly Support",
        "price": "€320",
        "period": "/ month",
        "features": ["4 sessions per month", "24/7 emergency support", "Personalized exercises", "Ongoing therapist support"],
        "cta": {"label": "Book Now", "href": "/therapists"},
        "highlighted": false
      }
    ]
  }}]'::jsonb,
  '[{"id": "pricing-main", "type": "pricing", "data": {
    "eyebrow": "Session Options",
    "title": "Choose Your Path",
    "subtitle": "Transparent pricing. No hidden fees. EU-compliant invoices provided.",
    "tiers": [
      {
        "name": "Single Session",
        "price": "€90",
        "period": "/ session",
        "features": ["50-minute session", "Video or in-person", "Session notes provided", "Invoice provided"],
        "cta": {"label": "Book Now", "href": "/therapists"},
        "highlighted": false
      },
      {
        "name": "5 Session Package",
        "price": "€400",
        "period": "/ 5 sessions",
        "features": ["Everything in Single", "Priority scheduling", "Between-session messaging", "Grounding exercises library", "Save €50 vs individual"],
        "cta": {"label": "Book Now", "href": "/therapists"},
        "highlighted": true
      },
      {
        "name": "Monthly Support",
        "price": "€320",
        "period": "/ month",
        "features": ["4 sessions per month", "24/7 emergency support", "Personalized exercises", "Ongoing therapist support"],
        "cta": {"label": "Book Now", "href": "/therapists"},
        "highlighted": false
      }
    ]
  }}]'::jsonb,
  true, 5, NOW()
),
(
  'homepage_crisis',
  'Crisis Banner',
  '[{"id": "crisis-main", "type": "crisisBanner", "data": {
    "heading": "If you''re in immediate danger or crisis, please reach out for help.",
    "body": "This is not a substitute for emergency services.",
    "linkLabel": "View Crisis Resources",
    "linkHref": "/emergency"
  }}]'::jsonb,
  '[{"id": "crisis-main", "type": "crisisBanner", "data": {
    "heading": "If you''re in immediate danger or crisis, please reach out for help.",
    "body": "This is not a substitute for emergency services.",
    "linkLabel": "View Crisis Resources",
    "linkHref": "/emergency"
  }}]'::jsonb,
  true, 6, NOW()
),
(
  'homepage_final_cta',
  'Final CTA',
  '[{"id": "final-cta-main", "type": "ctaBanner", "data": {
    "style": "dark",
    "title": "Ready to Begin?",
    "subtitle": "Book your first session and start your journey toward embodied healing.",
    "cta": {"label": "Book Now", "href": "/login"}
  }}]'::jsonb,
  '[{"id": "final-cta-main", "type": "ctaBanner", "data": {
    "style": "dark",
    "title": "Ready to Begin?",
    "subtitle": "Book your first session and start your journey toward embodied healing.",
    "cta": {"label": "Book Now", "href": "/login"}
  }}]'::jsonb,
  true, 7, NOW()
)
ON CONFLICT (key) DO NOTHING;
