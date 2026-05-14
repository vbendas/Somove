# Cleolenzea Landing Page v1 — Plan

Reference UI: https://online-therapy.cmsmasters.studio/main/

## Design System

| Element | Value |
|---------|-------|
| Background | `#FFFDF5` |
| Surface | `#FFF5E1` |
| Primary | `#D4A574` |
| Accent | `#8BA888` |
| Text | `#2D2A26` |
| Soft rose | `#E8C4B8` |
| Muted sky | `#B5C7D3` |
| Light moss | `#C5D5C5` |
| Warm gray | `#9A9590` |
| Headings font | Lora (Google Fonts) |
| Body font | DM Sans (Google Fonts) |
| Border radius | 12-16px |
| Animations | Slow, gentle (200-300ms) |

## CTAs

- **Book Now** → `/app/client/book` (primary conversion)
- **Download App** → triggers PWA install prompt

## Sections

1. Header (sticky, transparent → cream on scroll)
2. Hero (two-column: text + organic visual)
3. What is Somatic Therapy (3 cards)
4. How It Works (3 steps)
5. About the Therapist (photo + bio + stats)
6. Why Somatic Therapy (4 features + download banner)
7. Testimonials (3 quote cards)
8. Pricing (3 tiers)
9. Crisis Banner (subtle, warm)
10. Final CTA (amber background, dual CTAs)
11. Footer (4-column)

## Component Architecture

```
components/
├── landing/
│   ├── Header.tsx
│   ├── Hero.tsx
│   ├── WhatIsSomatic.tsx
│   ├── HowItWorks.tsx
│   ├── AboutTherapist.tsx
│   ├── WhySomatic.tsx
│   ├── Testimonials.tsx
│   ├── Pricing.tsx
│   ├── CrisisBanner.tsx
│   ├── FinalCTA.tsx
│   └── Footer.tsx
└── ui/
    ├── Button.tsx
    ├── Card.tsx
    ├── Badge.tsx
    ├── SectionHeading.tsx
    └── Icon.tsx
```
