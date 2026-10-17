-- Neutral branding: update already-deployed databases to the new
-- "online session platform" copy. Idempotent: rows are only overwritten while
-- they still contain the originally seeded text, so admin edits are kept.

ALTER TABLE platform_settings ALTER COLUMN platform_tagline SET DEFAULT 'Online Session Platform';
UPDATE platform_settings SET platform_tagline = 'Online Session Platform'
  WHERE platform_tagline = 'Somatic Therapy Platform';

UPDATE session_types SET description = 'A one-on-one online session'
  WHERE description = 'A one-on-one somatic therapy session';

UPDATE site_sections SET
  title = CASE WHEN content::text ~* 'somatic|heal through your body' THEN 'Hero' ELSE title END,
  content = CASE WHEN content::text ~* 'somatic|heal through your body' THEN
'[
  {
    "id": "hero-main",
    "type": "hero",
    "data": {
      "eyebrow": "Online Session Platform",
      "title": "Your practice, online",
      "subtitle": "Booking, payments, video sessions, messaging and private client notes in one place. Built for therapists, coaches, teachers and consultants who meet clients one-to-one or in small groups.",
      "primaryCta": {
        "label": "Book Now",
        "href": "/therapists"
      },
      "secondaryCta": {
        "label": "Learn More",
        "href": "#how-it-works"
      },
      "trustBadges": [
        "Secure payments with Stripe",
        "Video sessions",
        "Private client notes"
      ]
    }
  }
]'::jsonb ELSE content END,
  draft_content = CASE WHEN draft_content::text ~* 'somatic|heal through your body' THEN
'[
  {
    "id": "hero-main",
    "type": "hero",
    "data": {
      "eyebrow": "Online Session Platform",
      "title": "Your practice, online",
      "subtitle": "Booking, payments, video sessions, messaging and private client notes in one place. Built for therapists, coaches, teachers and consultants who meet clients one-to-one or in small groups.",
      "primaryCta": {
        "label": "Book Now",
        "href": "/therapists"
      },
      "secondaryCta": {
        "label": "Learn More",
        "href": "#how-it-works"
      },
      "trustBadges": [
        "Secure payments with Stripe",
        "Video sessions",
        "Private client notes"
      ]
    }
  }
]'::jsonb ELSE draft_content END
WHERE key = 'homepage_hero'
  AND (content::text ~* 'somatic|heal through your body' OR draft_content::text ~* 'somatic|heal through your body');

UPDATE site_sections SET
  title = CASE WHEN content::text ~* 'somatic|body-centered' THEN 'Services' ELSE title END,
  content = CASE WHEN content::text ~* 'somatic|body-centered' THEN
'[
  {
    "id": "what-is-main",
    "type": "imageText",
    "data": {
      "eyebrow": "What You Get",
      "title": "Everything for your sessions",
      "html": "<p>One platform for the full session workflow, from first visit to follow-up.</p><p><strong>Profile &amp; landing page</strong> — Present your work, your services and your availability on a page you control.</p><p><strong>Booking &amp; payments</strong> — Clients pick a time and pay online. Payouts go through Stripe Connect.</p><p><strong>Video sessions</strong> — Meet clients one-to-one or in small groups without extra software.</p><p><strong>Messaging &amp; private notes</strong> — Stay in touch between sessions and keep your client notes private.</p>",
      "imagePosition": "left"
    }
  }
]'::jsonb ELSE content END,
  draft_content = CASE WHEN draft_content::text ~* 'somatic|body-centered' THEN
'[
  {
    "id": "what-is-main",
    "type": "imageText",
    "data": {
      "eyebrow": "What You Get",
      "title": "Everything for your sessions",
      "html": "<p>One platform for the full session workflow, from first visit to follow-up.</p><p><strong>Profile &amp; landing page</strong> — Present your work, your services and your availability on a page you control.</p><p><strong>Booking &amp; payments</strong> — Clients pick a time and pay online. Payouts go through Stripe Connect.</p><p><strong>Video sessions</strong> — Meet clients one-to-one or in small groups without extra software.</p><p><strong>Messaging &amp; private notes</strong> — Stay in touch between sessions and keep your client notes private.</p>",
      "imagePosition": "left"
    }
  }
]'::jsonb ELSE draft_content END
WHERE key = 'homepage_what_is'
  AND (content::text ~* 'somatic|body-centered' OR draft_content::text ~* 'somatic|body-centered');

UPDATE site_sections SET
  title = CASE WHEN content::text ~* 'healing journey|breathe deeply' THEN 'How It Works' ELSE title END,
  content = CASE WHEN content::text ~* 'healing journey|breathe deeply' THEN
'[
  {
    "id": "how-it-works-main",
    "type": "featureGrid",
    "data": {
      "eyebrow": "Getting Started",
      "title": "How it works",
      "subtitle": "",
      "columns": 3,
      "style": "numbered",
      "items": [
        {
          "number": "01",
          "title": "Find a professional",
          "description": "Browse profiles and pick the person who fits what you need."
        },
        {
          "number": "02",
          "title": "Book and pay",
          "description": "Choose a time that works and pay securely online."
        },
        {
          "number": "03",
          "title": "Meet online",
          "description": "Join the video session, then keep in touch by message."
        }
      ]
    }
  }
]'::jsonb ELSE content END,
  draft_content = CASE WHEN draft_content::text ~* 'healing journey|breathe deeply' THEN
'[
  {
    "id": "how-it-works-main",
    "type": "featureGrid",
    "data": {
      "eyebrow": "Getting Started",
      "title": "How it works",
      "subtitle": "",
      "columns": 3,
      "style": "numbered",
      "items": [
        {
          "number": "01",
          "title": "Find a professional",
          "description": "Browse profiles and pick the person who fits what you need."
        },
        {
          "number": "02",
          "title": "Book and pay",
          "description": "Choose a time that works and pay securely online."
        },
        {
          "number": "03",
          "title": "Meet online",
          "description": "Join the video session, then keep in touch by message."
        }
      ]
    }
  }
]'::jsonb ELSE draft_content END
WHERE key = 'homepage_how_it_works'
  AND (content::text ~* 'healing journey|breathe deeply' OR draft_content::text ~* 'healing journey|breathe deeply');

UPDATE site_sections SET
  title = CASE WHEN content::text ~* 'Happy Client' THEN 'Stats' ELSE title END,
  content = CASE WHEN content::text ~* 'Happy Client' THEN
'[
  {
    "id": "stats-main",
    "type": "stats",
    "data": {
      "items": [
        {
          "value": 4,
          "label": "Core tools: booking, payments, video, notes"
        },
        {
          "value": 1,
          "label": "Platform for the whole session workflow"
        },
        {
          "value": 24,
          "suffix": "/7",
          "label": "Online booking"
        }
      ]
    }
  }
]'::jsonb ELSE content END,
  draft_content = CASE WHEN draft_content::text ~* 'Happy Client' THEN
'[
  {
    "id": "stats-main",
    "type": "stats",
    "data": {
      "items": [
        {
          "value": 4,
          "label": "Core tools: booking, payments, video, notes"
        },
        {
          "value": 1,
          "label": "Platform for the whole session workflow"
        },
        {
          "value": 24,
          "suffix": "/7",
          "label": "Online booking"
        }
      ]
    }
  }
]'::jsonb ELSE draft_content END
WHERE key = 'homepage_stats'
  AND (content::text ~* 'Happy Client' OR draft_content::text ~* 'Happy Client');

UPDATE site_sections SET
  title = CASE WHEN content::text ~* 'Reiki|somatic|grounding' THEN 'Testimonials' ELSE title END,
  content = CASE WHEN content::text ~* 'Reiki|somatic|grounding' THEN
'[
  {
    "id": "testimonials-main",
    "type": "testimonials",
    "data": {
      "eyebrow": "Feedback",
      "title": "What clients say",
      "items": [
        {
          "quote": "Booking and paying took a minute, and the video session worked first time.",
          "author": "A. R.",
          "role": "Client"
        },
        {
          "quote": "I like being able to message my coach between sessions without switching apps.",
          "author": "J. M.",
          "role": "Coaching client"
        },
        {
          "quote": "Having lessons, payments and messages in one place makes scheduling much simpler.",
          "author": "S. K.",
          "role": "Student"
        },
        {
          "quote": "Clear invoices and easy rescheduling. Exactly what I needed for working with a consultant remotely.",
          "author": "T. L.",
          "role": "Consulting client"
        }
      ]
    }
  }
]'::jsonb ELSE content END,
  draft_content = CASE WHEN draft_content::text ~* 'Reiki|somatic|grounding' THEN
'[
  {
    "id": "testimonials-main",
    "type": "testimonials",
    "data": {
      "eyebrow": "Feedback",
      "title": "What clients say",
      "items": [
        {
          "quote": "Booking and paying took a minute, and the video session worked first time.",
          "author": "A. R.",
          "role": "Client"
        },
        {
          "quote": "I like being able to message my coach between sessions without switching apps.",
          "author": "J. M.",
          "role": "Coaching client"
        },
        {
          "quote": "Having lessons, payments and messages in one place makes scheduling much simpler.",
          "author": "S. K.",
          "role": "Student"
        },
        {
          "quote": "Clear invoices and easy rescheduling. Exactly what I needed for working with a consultant remotely.",
          "author": "T. L.",
          "role": "Consulting client"
        }
      ]
    }
  }
]'::jsonb ELSE draft_content END
WHERE key = 'homepage_testimonials'
  AND (content::text ~* 'Reiki|somatic|grounding' OR draft_content::text ~* 'Reiki|somatic|grounding');

UPDATE site_sections SET
  title = CASE WHEN content::text ~* 'Grounding exercises|24/7 emergency' THEN 'Pricing' ELSE title END,
  content = CASE WHEN content::text ~* 'Grounding exercises|24/7 emergency' THEN
'[
  {
    "id": "pricing-main",
    "type": "pricing",
    "data": {
      "eyebrow": "Session Options",
      "title": "Simple pricing",
      "subtitle": "Transparent pricing. No hidden fees. EU-compliant invoices provided.",
      "tiers": [
        {
          "name": "Single Session",
          "price": "€90",
          "period": "/ session",
          "features": [
            "Online video session",
            "Secure payment via Stripe",
            "Invoice provided"
          ],
          "cta": {
            "label": "Book Now",
            "href": "/therapists"
          },
          "highlighted": false
        },
        {
          "name": "5 Session Package",
          "price": "€400",
          "period": "/ 5 sessions",
          "features": [
            "Everything in Single",
            "Priority scheduling",
            "Messaging between sessions",
            "Shared resources library",
            "Save €50 vs individual"
          ],
          "cta": {
            "label": "Book Now",
            "href": "/therapists"
          },
          "highlighted": true
        },
        {
          "name": "Monthly Support",
          "price": "€320",
          "period": "/ month",
          "features": [
            "4 sessions per month",
            "Messaging between sessions",
            "Shared resources library",
            "Ongoing support from your professional"
          ],
          "cta": {
            "label": "Book Now",
            "href": "/therapists"
          },
          "highlighted": false
        }
      ]
    }
  }
]'::jsonb ELSE content END,
  draft_content = CASE WHEN draft_content::text ~* 'Grounding exercises|24/7 emergency' THEN
'[
  {
    "id": "pricing-main",
    "type": "pricing",
    "data": {
      "eyebrow": "Session Options",
      "title": "Simple pricing",
      "subtitle": "Transparent pricing. No hidden fees. EU-compliant invoices provided.",
      "tiers": [
        {
          "name": "Single Session",
          "price": "€90",
          "period": "/ session",
          "features": [
            "Online video session",
            "Secure payment via Stripe",
            "Invoice provided"
          ],
          "cta": {
            "label": "Book Now",
            "href": "/therapists"
          },
          "highlighted": false
        },
        {
          "name": "5 Session Package",
          "price": "€400",
          "period": "/ 5 sessions",
          "features": [
            "Everything in Single",
            "Priority scheduling",
            "Messaging between sessions",
            "Shared resources library",
            "Save €50 vs individual"
          ],
          "cta": {
            "label": "Book Now",
            "href": "/therapists"
          },
          "highlighted": true
        },
        {
          "name": "Monthly Support",
          "price": "€320",
          "period": "/ month",
          "features": [
            "4 sessions per month",
            "Messaging between sessions",
            "Shared resources library",
            "Ongoing support from your professional"
          ],
          "cta": {
            "label": "Book Now",
            "href": "/therapists"
          },
          "highlighted": false
        }
      ]
    }
  }
]'::jsonb ELSE draft_content END
WHERE key = 'homepage_pricing'
  AND (content::text ~* 'Grounding exercises|24/7 emergency' OR draft_content::text ~* 'Grounding exercises|24/7 emergency');

UPDATE site_sections SET
  title = CASE WHEN content::text ~* 'embodied' THEN 'Final CTA' ELSE title END,
  content = CASE WHEN content::text ~* 'embodied' THEN
'[
  {
    "id": "final-cta-main",
    "type": "ctaBanner",
    "data": {
      "style": "dark",
      "title": "Ready to Begin?",
      "subtitle": "Book your first session online.",
      "cta": {
        "label": "Book Now",
        "href": "/login"
      }
    }
  }
]'::jsonb ELSE content END,
  draft_content = CASE WHEN draft_content::text ~* 'embodied' THEN
'[
  {
    "id": "final-cta-main",
    "type": "ctaBanner",
    "data": {
      "style": "dark",
      "title": "Ready to Begin?",
      "subtitle": "Book your first session online.",
      "cta": {
        "label": "Book Now",
        "href": "/login"
      }
    }
  }
]'::jsonb ELSE draft_content END
WHERE key = 'homepage_final_cta'
  AND (content::text ~* 'embodied' OR draft_content::text ~* 'embodied');
