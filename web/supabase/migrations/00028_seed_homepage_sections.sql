-- Seed homepage site_sections with real launch copy, published and ready
-- to render. draft_content mirrors content so the visual builder opens on
-- the live copy. Safe to re-run: ON CONFLICT (key) DO NOTHING.

INSERT INTO site_sections (key, title, content, draft_content, is_published, sort_order, published_at)
VALUES
(
  'homepage_hero',
  'Hero',
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
]'::jsonb,
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
]'::jsonb,
  true, 0, NOW()
),
(
  'homepage_what_is',
  'Services',
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
]'::jsonb,
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
]'::jsonb,
  true, 1, NOW()
),
(
  'homepage_how_it_works',
  'How It Works',
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
]'::jsonb,
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
]'::jsonb,
  true, 2, NOW()
),
(
  'homepage_stats',
  'Stats',
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
]'::jsonb,
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
]'::jsonb,
  true, 3, NOW()
),
(
  'homepage_testimonials',
  'Testimonials',
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
]'::jsonb,
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
]'::jsonb,
  true, 4, NOW()
),
(
  'homepage_pricing',
  'Pricing',
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
]'::jsonb,
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
]'::jsonb,
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
]'::jsonb,
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
]'::jsonb,
  true, 7, NOW()
)
ON CONFLICT (key) DO NOTHING;
