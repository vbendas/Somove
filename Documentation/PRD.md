# Somove — Product Requirements Document (Lean MVP)

## 1. Overview

**Project:** Somove — A Somatic Therapy Operating System
**Platform brand:** Somove
**Domain:** somove.app
**MVP scope:** Single-therapist deployment (therapist-branded landing page on Somove infrastructure)
**Compliance:** GDPR, EU data residency
**Primary currency:** EUR
**Primary region:** Europe
**Long-term vision:** Multi-practitioner marketplace where each therapist gets their own branded experience on shared infrastructure, potentially governed by a DAO

Somove is a platform purpose-built for body-based mental health practice. The lean MVP serves a single somatic therapist with a mix of local and international English-speaking clients. The platform handles scheduling, video calls with contactless gesture controls (the key differentiator), payments, messaging, and client notes — the minimum viable loop to validate the product with real users.

**Lean MVP principle:** Ship the core loop (book → pay → video call with gestures → chat → notes) as fast as possible. Everything else is deferred to the production version. The database schema and route structure are designed to support the full marketplace, but the MVP only activates what's needed for one therapist.

**Source of truth:** This PRD defines lean MVP scope. The `plan/` folder contains detailed roadmaps for the full marketplace build. Section 14 lists everything stripped from the lean MVP with rationale and when to add it back.

**Open-source distribution:** The lean MVP is the open-source version. Therapists can self-deploy their own instance via a one-click "Deploy to Vercel" button with a guided setup wizard. The production version (bundles, invoices, custom booking UI, marketplace features) remains proprietary / hosted by Somove. See Section 18 for the full open-source distribution plan.

---

## 2. Tech Stack

### Lean MVP

| Layer | Choice | Region / Notes |
|-------|--------|----------------|
| Frontend | Next.js 14 (App Router, TypeScript) + shadcn/ui + Tailwind | — |
| PWA | Serwist (next-pwa successor) | Install prompt only |
| Backend/DB/Auth | Supabase | eu-west-1 (Frankfurt) |
| Video | Daily.co | EU data centers, GDPR DPA |
| Gesture Detection | MediaPipe Hands (P1 only) | Browser-side, no server dependency |
| Scheduling | Cal.com embed | Managed Cal.com, iframe/embed — not custom API |
| Payments | Stripe Checkout | Single therapist, single sessions only |
| Messaging | Supabase Realtime | eu-west-1, text only |
| Email | Resend | EU-friendly, booking confirmations + message notifications |
| Hosting | Vercel | EU edge |
| Domain | somove.app | — |

### Future Migration Path

| Layer | MVP | Future | When |
|-------|-----|--------|------|
| Scheduling | Cal.com embed | Cal.com API (custom UI) | After booking flow validated |
| Payments | Stripe Checkout, single sessions | Stripe Connect + bundles + invoices | Marketplace launch |
| Video | Daily.co | LiveKit (self-hosted) | Multi-practitioner scale |
| Support | Email only | Chatwoot + Typebot + Mistral Small 4 | Multi-practitioner |
| Auth | Magic link only | + Google OAuth, Apple Sign In | Polish phase |
| Gestures | P1 (zoom, mute, camera) | P2 (volume, framing presets) + calibration | After P1 validated |
| Notifications | Email only | Web Push notifications | After email proven insufficient |

---

## 3. Branding — Somove Design System

### Color Palette: "Warm Light"

| Role | Color | Hex |
|------|-------|-----|
| Background | Warm light | `#FFFDF5` |
| Surface | Soft honey | `#FFF5E1` |
| Primary | Warm amber | `#D4A574` |
| Accent | Sage green | `#8BA888` |
| Text | Warm charcoal | `#2D2A26` |

### Secondary Accents

| Role | Hex | Use |
|------|-----|-----|
| Soft rose | `#E8C4B8` | Emergency/urgent elements |
| Muted sky | `#B5C7D3` | Informational |
| Light moss | `#C5D5C5` | Success, confirmed states |
| Warm gray | `#9A9590` | Secondary text |

### Typography

| Element | Font | Weight |
|---------|------|--------|
| Headings | Lora (Google Fonts) | Regular, Medium |
| Body | DM Sans (Google Fonts) | Regular, Medium |
| Accents/Buttons | DM Sans Medium | 500 |

### UI Principles

- Rounded corners (12–16px) on cards and buttons
- Subtle shadows instead of hard borders
- Generous whitespace
- Slow, gentle animations (200–300ms ease)
- Organic illustration style (abstract body outlines, flowing lines, nature motifs) — no stock photos
- Mobile-first responsive design
- Touch targets minimum 44x44px
- Bottom sheet pattern for secondary actions (no hover-only interactions)
- Skeleton screens instead of spinners
- Optimistic UI on messages and note saves

---

## 4. Architecture

### Route Structure

```
somove.app/
├── /                              → Landing page (Somove branded, therapist intro, book now CTA)
│
├── (client app)
│   ├── /login                     → Magic link auth
│   ├── /therapists/:id            → Therapist profile + Cal.com embed booking
│   ├── /my-sessions               → Upcoming + past sessions
│   ├── /inbox                     → Messages with therapist
│   ├── /session/:id               → Pre-call (camera/mic check) → Video call
│   ├── /emergency                 → Crisis numbers + "Contact therapist" button
│   └── /settings                  → Profile, notification preferences
│
├── (therapist app)
│   ├── /dashboard                 → Today's schedule, revenue, unread messages
│   ├── /dashboard/schedule        → Calendar view (weekly/daily)
│   ├── /dashboard/clients         → Client list with search
│   ├── /dashboard/clients/:id     → Client profile + private notes (plain text)
│   ├── /dashboard/inbox           → All client conversations
│   ├── /dashboard/session/:id     → Pre-call → Video call + notes
│   ├── /dashboard/earnings        → Revenue overview
│   └── /dashboard/settings        → Availability, session types, pricing, profile
│
└── /api
    ├── /webhooks/stripe           → Payment confirmations
    ├── /webhooks/cal              → Cal.com booking events
    ├── /webhooks/daily            → Session events
    └── /sessions/:id/token        → Daily.co token generation
```

### Infrastructure Diagram

```
┌──────────────────────────────────────────────────────┐
│                  Client PWA (Next.js)                  │
│  ┌──────────┐  ┌──────────────────┐  ┌────────────┐  │
│  │ Booking   │  │  Video Call      │  │ Messaging  │  │
│  │(Cal embed)│  │  Daily.co +      │  │(Supabase   │  │
│  │           │  │  MediaPipe Hands │  │ Realtime)  │  │
│  └────┬──────┘  └────┬─────────────┘  └─────┬──────┘  │
│       │              │                       │         │
│  ┌────┴──────────────┴───────────────────────┴──────┐  │
│  │              Supabase API                        │  │
│  │     (Auth, DB, Realtime, Storage)                │  │
│  └──┬──────────┬──────────────┬─────────────────────┘  │
└─────┼──────────┼──────────────┼────────────────────────┘
      │          │              │
  ┌───┴────┐ ┌──┴─────┐  ┌────┴──────┐
  │Stripe  │ │Daily.co│  │Cal.com    │
  │Checkout│ │(Video) │  │(Embed)    │
  └────────┘ └────────┘  └───────────┘

┌──────────────────────────────────────────────────────┐
│            Therapist Dashboard (Next.js)               │
│  Calendar │ Clients │ Notes │ Earnings │ Inbox        │
└──────────────────────────────────────────────────────┘
```

### Mobile Navigation

**Client — Bottom Nav:**
```
┌─────────────────────────────────────────┐
│              (screen content)           │
├─────────────────────────────────────────┤
│  Home  │  Sessions  │  Inbox  │  Help  │
└─────────────────────────────────────────┘
```

**Therapist — Bottom Nav:**
```
┌─────────────────────────────────────────┐
│              (screen content)           │
├─────────────────────────────────────────┤
│  Today  │  Schedule  │  Clients  │  Earnings  │
└─────────────────────────────────────────┘
```

---

## 5. Database Schema (Lean MVP)

Designed for single-therapist but extensible. All tables that reference a therapist use `therapist_id` from day one. Tables marked **(future)** exist in the schema design but are not built for lean MVP.

### users

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Supabase auth UID |
| email | text | Unique |
| name | text | |
| role | text | `client`, `therapist`, `admin` |
| country | text | For crisis resource routing |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### therapist_profile

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | uuid (FK → users) | |
| bio | text | |
| credentials | text[] | e.g., ["SEP", "BC-DMT"] |
| modalities | text[] | e.g., ["Somatic Experiencing", "DMT"] |
| session_price_cents | int | Single session price in EUR cents |
| free_first_session | boolean | Default false |
| default_session_duration | int | Minutes |
| availability_rules | jsonb | Recurring weekly slots (synced to Cal.com) |
| mute_hours | jsonb | When unavailable for messages |
| profile_image_url | text | |
| cal_user_id | text | Cal.com user ID |
| status | text | `active` (MVP) |
| created_at | timestamptz | |

### session_types

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| therapist_id | uuid (FK → users) | |
| name | text | e.g., "Individual Somatic Session" |
| description | text | |
| duration_min | int | |
| price_cents | int | EUR cents |
| currency | text | `EUR` |
| is_active | boolean | |
| created_at | timestamptz | |

### sessions

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| client_id | uuid (FK → users) | |
| therapist_id | uuid (FK → users) | |
| session_type_id | uuid (FK → session_types) | |
| cal_booking_uid | text | Cal.com booking reference |
| scheduled_at | timestamptz | |
| duration_min | int | |
| status | text | `pending_payment`, `confirmed`, `active`, `completed`, `cancelled`, `no_show` |
| payment_status | text | `pending`, `paid`, `failed`, `refunded`, `free_first_session` |
| daily_room_url | text | Daily.co room URL |
| stripe_checkout_id | text | Nullable |
| stripe_payment_intent_id | text | Nullable |
| amount_paid_cents | int | Nullable |
| currency | text | Default `eur` |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### payments

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| client_id | uuid (FK → users) | |
| therapist_id | uuid (FK → users) | |
| session_id | uuid (FK → sessions) | |
| amount_cents | int | |
| currency | text | `EUR` |
| method | text | `stripe`, `free_first_session` |
| status | text | `pending`, `confirmed`, `refunded` |
| stripe_payment_intent_id | text | Nullable |
| created_at | timestamptz | |

### client_profiles

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | uuid (FK → users) | |
| therapist_id | uuid (FK → users) | |
| intake_data | jsonb | Encrypted, GDPR Art. 9 |
| timezone | text | |
| created_at | timestamptz | |

### client_notes

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| therapist_id | uuid (FK → users) | |
| client_id | uuid (FK → users) | |
| session_id | uuid (FK → sessions) | Nullable — null = general note |
| body | text | Plain text (markdown future) |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### conversations

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| therapist_id | uuid (FK → users) | |
| client_id | uuid (FK → users) | |
| last_message_at | timestamptz | Nullable |
| created_at | timestamptz | |

### messages

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| conversation_id | uuid (FK → conversations) | |
| sender_id | uuid (FK → users) | |
| content | text | Encrypted |
| is_emergency_flag | boolean | Default false |
| sent_at | timestamptz | |
| read_at | timestamptz | Nullable |

### Future Tables (not built for lean MVP, schema ready)

| Table | Purpose | When to Build |
|-------|---------|---------------|
| `session_credits` | Bundle tracking (3, 5, 10 session packages) | Production version |
| `invoices` | EU-compliant invoice PDF generation | Production version |
| `notifications` | Push notification records | With Web Push implementation |
| `telegram_groups` | Community group management | Post-marketplace |
| `telegram_group_members` | Community group membership | Post-marketplace |

---

## 6. Lean MVP Features

### 6.1 Client-Facing

#### Landing Page (`/`)

- Somove branded with therapist profile section (name, photo, bio, credentials, modalities)
- Somatic therapy explainer (what it is, who it's for, what to expect)
- Clear CTA: "Book a Session" or "Free Consultation"
- Mobile-optimized, fast-loading
- Already built — needs integration with app routes only

#### Authentication (`/login`)

- Magic link via email (no password friction)
- Roles: `client`, `therapist`, `admin`
- Role-based redirect on auth
- First-time client: magic link → 2-step intake → enter dashboard
- Intake step 1: "What brings you to Somove?" (checkboxes)
- Intake step 2: "Have you worked with a somatic therapist before?" (yes / no / not sure)
- Skippable

#### Therapist Profile (`/therapists/:id`)

- Photo, name, bio, approach, specialties, credentials
- Single session price
- Free first session badge (if eligible)
- Cal.com embed widget for booking (not custom UI)
- "Message [name]" CTA (creates conversation if none exists)

#### Booking Flow (Cal.com Embed)

- Cal.com inline embed on therapist profile page
- Client selects date/time within Cal.com embed
- On booking confirmed via Cal.com webhook: redirect to Stripe Checkout for payment
- Free first session: skip Stripe, confirm directly
- `/booking/confirmed` page with session details + calendar add links (Google, Apple, .ics)
- Email confirmation via Resend

#### Client Sessions (`/my-sessions`)

- Tabbed: Upcoming / Past
- Session card: therapist photo + name, date/time (local tz), duration, status badge
- "Join Session" button — active 10 min before start only
- Past session: "Book again" link
- Cancel session → refund flow

#### Video Sessions (`/session/:id`)

- Full-screen layout, no navigation, no support widgets
- Pre-call room: camera/mic check, connection quality test
- Daily.co video call with custom layout
- Remote video full screen, self-view draggable corner tile
- Controls bar (auto-hides, reappears on tap):
  - Mute mic · Toggle camera · Gesture toggle (hand icon) · End call
- **Contactless gesture controls (P1 only, both sides):**
  - Opt-in toggle, default off, persisted in `localStorage`
  - Capability detection hides toggle on unsupported devices
  - No calibration screen — tooltip: "Stand 4–8 feet from camera, face the camera"
  - P1 gestures only:
    - Thumbs up → zoom in (local preview CSS transform — remote sees raw feed for MVP)
    - Open palm → zoom out
    - Wave (3+ side-to-side) → toggle mute/unmute
    - Fist (1.5s hold) → toggle camera on/off
  - 1.5s hold-to-confirm with visual progress ring
  - On-screen gesture indicator + confirmation toast
  - Auto-disables if device performance drops (fps < 15 for 5+ seconds)
- **Full-body video guidance:**
  - Landscape prompt for body view
  - Camera placement tips overlay (chest height, 6ft distance)
- Connection quality indicator
- "Waiting for [name]..." holding state
- Audio-only fallback if bandwidth insufficient
- WakeLock API to prevent screen lock
- On end call: client → `/my-sessions`

#### Messaging (`/inbox`)

- Real-time chat with therapist via Supabase Realtime
- Simple thread view: message bubbles, date separators
- Text only
- Unread badge on Inbox tab in bottom nav
- "Message [therapist name]" CTA on therapist profile creates conversation if none exists
- Email notification when therapist is offline (debounced 15 min per conversation)

#### Emergency Support (`/emergency`)

- Static page with:
  - Crisis numbers by country (auto-detect from profile or browser):
    - Portugal: SNS 24 (808 200 204), Voz de Apoio (21 354 45 45), SOS Voz Amiga
    - EU: 116 123
    - US: 988
    - UK: NHS 111
    - International: Befrienders Worldwide
  - One-tap call links
  - "Contact therapist" button → sends emergency-flagged message
- Quick access from client bottom nav (Help tab) and dashboard

#### Profile & Settings (`/settings`)

- View/edit personal information
- Complete/update intake form
- Notification preferences (email only for MVP)
- Manual data export/deletion via email request (GDPR-compliant, not automated)

### 6.2 Therapist-Facing

#### Dashboard (`/dashboard`)

- Today's sessions chronologically
- Revenue summary (week/month)
- Unread messages count

#### Calendar (`/dashboard/schedule`)

- Weekly/daily view via FullCalendar
- Session blocks with client name, time, status colour
- Click session block → session detail bottom sheet
- Set recurring availability (weekly slots, synced to Cal.com)

#### Client Management (`/dashboard/clients`)

- Client list with search
- Client detail view (`/dashboard/clients/:id`):
  - Intake form data (encrypted)
  - Session history
  - Payment history
  - Notes tab with plain text textarea (auto-saves on blur)
  - "Send message" button → opens inbox conversation

#### Session Management (`/dashboard/session/:id`)

- View appointment details
- Start Daily.co video call (one-click)
- Same P1 gesture controls as client side
- Notes during call: bottom sheet with plain text textarea, auto-save (debounced 2s)
- Mark session as completed

#### Earnings (`/dashboard/earnings`)

- This month / all time toggle
- Per-session breakdown (date, client, gross amount)
- Stripe receipts link (no custom invoice generation for MVP)

#### Messaging (`/dashboard/inbox`)

- All client conversations in one view
- Split layout (desktop: list + thread; mobile: list → thread)
- Conversation list: client name, last message preview, timestamp, unread indicator
- Message thread with date separators
- Emergency flags highlighted
- Text input + send
- Mark conversation as read on open
- Unread count badge on inbox nav item

#### Settings (`/dashboard/settings`)

- Availability rules (recurring weekly schedule, synced to Cal.com)
- Session types (name, duration, price)
- Free first session toggle
- Profile editing (bio, credentials, photo)
- Mute hours configuration

---

## 7. Payment Strategy (Lean MVP)

### MVP Methods

| Method | Flow | Confirmation |
|--------|------|-------------|
| **Stripe (card)** | Client pays at booking → Stripe Checkout → webhook confirms | Automatic |
| **Free first session** | No payment step, booking confirmed directly | Automatic |

### Refund Policy (configurable)

- Cancelled >24h before session: full refund
- Cancelled <24h before session: no refund
- Therapist cancels: always full refund regardless of timing

### Currency

- EUR only

---

## 8. Video Call System

### Problem

All existing telehealth platforms are architected for face-centric conversation. Somatic therapy and Dance/Movement Therapy require full-body observation. Both therapist and client are physically distant from their device during movement-based sessions — the phone sits on a tripod across the room.

### Lean MVP Solution: Daily.co + P1 Gesture Controls

#### Base Video Call

- Daily.co for WebRTC video (GDPR-ready, EU data centers)
- Pre-call room: camera/mic check, permissions handling
- Full-screen layout, remote video main, self-view draggable corner tile
- Controls bar: mute mic, toggle camera, gesture toggle, end call
- Landscape prompt, camera placement overlay
- Connection quality indicator, audio-only fallback
- WakeLock API, no recording (permanently out of scope)

#### P1 Gesture Controls (MediaPipe Hands)

**Both sides** (therapist and client). Each controls their own device independently.

**Toggle:** Hand icon in controls bar. Default: **off**. Persisted in `localStorage`. Capability detection hides toggle on unsupported devices.

**No calibration screen.** Tooltip instead: "Stand 4–8 feet from camera, face the camera."

**Gesture set (P1 only):**

| Gesture | Action | Confirmation |
|---------|--------|-------------|
| Thumbs up | Zoom in (local preview CSS transform) | 1.5s hold, progress ring |
| Open palm | Zoom out | 1.5s hold, progress ring |
| Wave (3+ side-to-side) | Toggle mute/unmute | Continuous wave = trigger |
| Closed fist | Toggle camera on/off | 1.5s hold, progress ring |

**Technical:**
- MediaPipe Hands model (~3MB, 30+ fps on mobile)
- Custom gesture classifier on hand landmark output (no extra ML model)
- 1.5s hold-to-confirm prevents false triggers
- Zoom: CSS transform on local preview only (remote sees raw feed — full canvas pipeline deferred)
- Mute/camera: Daily.co `setLocalAudio` / `setLocalVideo`

**Performance safeguard:** fps < 15 for 5+ seconds → auto-disable gesture detection, show notification.

**Visual feedback:** On-screen gesture name + progress ring + confirmation toast. Subtle, does not obscure video.

---

## 9. Emergency Support (Lean MVP)

Static emergency page — no interactive animations for MVP.

- `/emergency` with crisis numbers by country (auto-detect from profile or browser)
- One-tap call links
- "Contact therapist" button → sends emergency-flagged message
- Quick access from client bottom nav Help tab

---

## 10. GDPR Compliance (Lean MVP)

| Requirement | Implementation |
|-------------|---------------|
| Lawful basis for health data (Art. 9) | Explicit consent at intake, consent logging |
| Data minimization | Only collect data necessary for therapy |
| Right to access | Client settings page shows stored data |
| Right to erasure | Manual via email request, processed within 30 days |
| Right to portability | Manual via email request |
| EU data residency | Supabase eu-west-1, Daily.co EU, Cal.com EU, Vercel EU edge |
| Encryption at rest | Column-level encryption on `intake_data`, `client_notes.body`, `messages.content` |
| Cookie consent | Cookie banner with opt-in |
| Privacy policy | Privacy policy page (EN + PT) |
| Terms of service | Platform default terms page |
| Data processing agreements | DPAs with Supabase, Daily.co, Stripe, Cal.com, Resend |

---

## 11. Roadmap Decisions Log

| # | Decision | Lean MVP Status |
|---|----------|----------------|
| 1 | Clients can book any available therapist | **MVP** — single therapist, route structure ready |
| 2 | Therapists manually approved by admin | **Deferred** |
| 3 | Therapists may offer free first session | **MVP** — toggle |
| 4 | Platform fee: 10% | **Deferred** |
| 5 | Therapists set own pricing + bundles | **Partial** — single session pricing only, bundles deferred |
| 6 | EUR primary, Europe only | **MVP** |
| 7 | Frictionless auth | **Partial** — magic link only |
| 8 | Stripe Tax | **Deferred** |
| 9 | Scheduling within Somove | **MVP** — Cal.com embed (not custom UI) |
| 10 | Therapist custom ToS | **Deferred** — platform default terms |
| 11 | All data EU-hosted | **MVP** |
| 12 | HIPAA not in scope | **MVP** |
| 13 | Session chat deleted on session end | **MVP** |
| 14 | Structured inbox with tags | **Deferred** — simple 1:1 chat |
| 15 | File attachments | **Deferred** |
| 16 | Support chatbot | **Deferred** |
| 17 | Session recording | **Never** |

---

## 12. Development Timeline (Lean MVP)

### Phase 0 — Foundation

**Goal:** Project skeleton, design system, auth, navigation shell.
**Estimated effort:** 25–30 hours

- [ ] 0.1 Initialise Next.js 14 with App Router and TypeScript
- [ ] 0.2 Configure Tailwind CSS with Somove design tokens
- [ ] 0.3 Install and configure Serwist (PWA support, install prompt only)
- [ ] 0.4 Create `manifest.json`
- [ ] 0.5 Set up Supabase project on EU region (Frankfurt)
- [ ] 0.6 Configure environment variables with validation on startup (clear error messages + links to get each key)
- [ ] 0.7 ESLint, Prettier, TypeScript strict mode
- [ ] 0.8 Base UI components: `Button`, `Input`, `Textarea`, `Select`, `Toggle`, `Card`, `Avatar`, `Badge`
- [ ] 0.9 Layout components: `BottomNav`, `TopBar`, `BottomSheet`, `PageContainer`
- [ ] 0.10 Feedback: `Toast`, `Skeleton`, `EmptyState`
- [ ] 0.11 Auto-seed script: `supabase/seed.sql` creates schema + therapist user on first deploy
- [ ] 0.12 Configure Supabase Auth (magic link)
- [ ] 0.13 Sign in / sign up page
- [ ] 0.14 On first sign-in: prompt for display name
- [ ] 0.15 User roles: `client`, `therapist`, `admin`
- [ ] 0.16 Role-based redirect on auth
- [ ] 0.17 Auth middleware
- [ ] 0.18 `ClientLayout`, `TherapistLayout`, `VideoCallLayout`

### Phase 1 — Client Onboarding, Therapist Profile & Setup Wizard

**Goal:** Client signs up, views therapist profile. First-visit setup wizard for self-deployed instances.
**Estimated effort:** 20–25 hours

- [ ] 1.1 First-visit setup wizard (runs if no `therapist_profile` exists, resumable):
  - Step 1: Create therapist account (name, email, password)
  - Step 2: Profile (photo, bio, credentials, modalities)
  - Step 3: Pricing (session price, duration, free first session toggle)
  - Step 4: Availability (weekly schedule)
  - Step 5: "Your practice is live" — show booking link + shareable URL
- [ ] 1.2 After first client sign-in: 2-step intake (skippable)
- [ ] 1.3 Store intake on `client_profiles`
- [ ] 1.4 Therapist profile page `/therapists/:id` — photo, name, bio, specialties, pricing, CTA
- [ ] 1.5 Free first session badge if eligible
- [ ] 1.5 "Message [name]" CTA

### Phase 2 — Booking Flow (Cal.com Embed)

**Goal:** Client books a session via Cal.com embed, pays via Stripe.
**Estimated effort:** 8–12 hours

- [ ] 2.1 Embed Cal.com inline booking widget on therapist profile page
- [ ] 2.2 Style Cal.com embed to match Somove palette
- [ ] 2.3 Listen for `bookingSuccessful` embed event
- [ ] 2.4 On booking: redirect to Stripe Checkout for payment (or skip if free first session)
- [ ] 2.5 Cal.com webhook handler: `BOOKING_CREATED` → create session record
- [ ] 2.6 `/booking/confirmed` page with session details + calendar add links
- [ ] 2.7 Email confirmation via Resend
- [ ] 2.8 Free first session: skip Stripe, confirm directly

### Phase 3 — Payments

**Goal:** Stripe Checkout for single sessions. Refund on cancellation.
**Estimated effort:** 15–20 hours

- [ ] 3.1 Stripe account setup (single therapist, not Connect)
- [ ] 3.2 `lib/stripe.ts` — server-side Stripe client singleton
- [ ] 3.3 `POST /api/payments/create-checkout` — Stripe Checkout session creation
- [ ] 3.4 `POST /api/webhooks/stripe` — webhook handler with signature verification
- [ ] 3.5 Handle `checkout.session.completed` → update session status, trigger emails
- [ ] 3.6 Handle `checkout.session.expired` → cancel session, notify client
- [ ] 3.7 Refund flow: `POST /api/payments/refund` based on cancellation policy
- [ ] 3.8 Handle `charge.refunded` webhook
- [ ] 3.9 Payment state on session: `pending` → `paid` → `refunded` / `free_first_session`
- [ ] 3.10 "Join Session" only active if `payment_status === 'paid'` or `free_first_session`
- [ ] 3.11 Therapist earnings overview (this month / all time, per-session breakdown)

### Phase 4 — Session Management

**Goal:** Client and therapist view upcoming/past sessions with join access.
**Estimated effort:** 15–20 hours

- [ ] 4.1 Client `/my-sessions` — tabbed: Upcoming / Past
- [ ] 4.2 `SessionCard`: therapist photo, date/time, duration, status badge
- [ ] 4.3 "Join Session" button — active 10 min before start only
- [ ] 4.4 Past session: "Book again" link
- [ ] 4.5 Cancel session → refund flow
- [ ] 4.6 Therapist `/dashboard` — today's sessions + unread inbox count
- [ ] 4.7 Therapist `/dashboard/schedule` — FullCalendar week view
- [ ] 4.8 Session detail bottom sheet: client name, join button
- [ ] 4.9 Therapist cancel session → refund + Cal.com cancellation

### Phase 5 — Video Calls + P1 Gesture Controls

**Goal:** Working video call with contactless P1 gesture controls for both sides.
**Estimated effort:** 50–65 hours

- [ ] 5.1 Daily.co integration: create room on booking, store room URL
- [ ] 5.2 `GET /api/sessions/:id/token` — generate Daily.co participant token
- [ ] 5.3 `/session/:id` — full-screen `VideoCallLayout`
- [ ] 5.4 Pre-call room: camera/mic check, permissions handling
- [ ] 5.5 Remote video full screen, self-view draggable corner tile
- [ ] 5.6 Controls bar: mute mic, toggle camera, gesture toggle, end call
- [ ] 5.7 Landscape prompt, camera placement overlay
- [ ] 5.8 Connection quality indicator
- [ ] 5.9 "Waiting for [name]..." holding state
- [ ] 5.10 Audio-only fallback
- [ ] 5.11 Connection state overlays
- [ ] 5.12 WakeLock API
- [ ] 5.13 On end call: update session → `completed`
- [ ] 5.14 Therapist notes during call: bottom sheet, plain textarea, auto-save (debounced 2s)
- [ ] 5.15 Mobile Safari (iOS 16+) testing on real hardware
- [ ] 5.16 Validate `getUserMedia` with PWA `display: standalone`
- [ ] 5.17 MediaPipe Hands setup: install, configure for browser-side detection
- [ ] 5.18 Gesture toggle: hand icon, default off, `localStorage` persist, capability detection
- [ ] 5.19 Gesture classifier: custom logic mapping hand landmarks to thumbs up, open palm, wave, fist
- [ ] 5.20 Hold-to-confirm (1.5s): progress ring overlay, cancels if hand drops
- [ ] 5.21 Zoom gestures: thumbs up → CSS transform scale up (local preview), open palm → scale down
- [ ] 5.22 Mute gesture: wave (3+ side-to-side) → `setLocalAudio` toggle
- [ ] 5.23 Camera gesture: fist (1.5s hold) → `setLocalVideo` toggle
- [ ] 5.24 Visual feedback: gesture name indicator + progress ring + confirmation toast
- [ ] 5.25 Performance safeguard: fps < 15 for 5s → auto-disable + notification
- [ ] 5.26 Both sides: identical P1 gesture set, each controls own device
- [ ] 5.27 Real hardware testing: tripod + 6ft distance, varied lighting, mid-range phone

### Phase 6 — Messaging

**Goal:** Simple 1:1 real-time chat. Text only.
**Estimated effort:** 20–25 hours

- [ ] 6.1 Enable Supabase Realtime on `messages` table
- [ ] 6.2 RLS policies: therapist own conversations, client own conversations
- [ ] 6.3 `conversations` model — one per therapist-client pair, auto-created on booking or message
- [ ] 6.4 Therapist `/dashboard/inbox` — split layout
- [ ] 6.5 Conversation list: client name, last message preview, timestamp, unread indicator
- [ ] 6.6 Message thread with date separators, optimistic updates
- [ ] 6.7 Emergency flags highlighted
- [ ] 6.8 Client `/inbox` — single thread with therapist
- [ ] 6.9 Text input + send
- [ ] 6.10 Mark conversation as read on open
- [ ] 6.11 Unread count badge on Inbox nav (both roles)
- [ ] 6.12 Email notification on new message when offline (debounced 15 min)

### Phase 7 — Emergency Support (Static)

**Goal:** Crisis resources + contact therapist button.
**Estimated effort:** 3–5 hours

- [ ] 7.1 `/emergency` static page
- [ ] 7.2 Crisis resource cards by country (auto-detect from profile/browser)
- [ ] 7.3 One-tap call links
- [ ] 7.4 "Contact therapist" button → sends emergency-flagged message
- [ ] 7.5 Quick access from client bottom nav Help tab

### Phase 8 — Therapist Notes (Plain Text)

**Goal:** Private per-client notes. Plain textarea, auto-save.
**Estimated effort:** 10–12 hours

- [ ] 8.1 `client_notes` model: general (null session_id) + session-linked
- [ ] 8.2 RLS policy: therapist reads/writes own notes only, client zero access
- [ ] 8.3 PII warning in notes UI
- [ ] 8.4 `/dashboard/clients/:id` — notes tab with plain textarea, auto-saves on blur
- [ ] 8.5 Client list: last note preview (60 chars)

### Phase 9 — GDPR (Minimal)

**Goal:** Cookie consent, privacy policy, terms of service.
**Estimated effort:** 3–5 hours

- [ ] 9.1 Cookie consent banner
- [ ] 9.2 Privacy policy page (EN + PT)
- [ ] 9.3 Terms of service page (platform default)
- [ ] 9.4 Consent logging on intake
- [ ] 9.5 Verify column-level encryption on sensitive fields
- [ ] 9.6 Manual data export/deletion via email request (GDPR-compliant)

### Phase 10 — PWA (Install Only) + Deploy

**Goal:** PWA install prompt, landing page integration, deploy.
**Estimated effort:** 8–10 hours

- [ ] 10.1 PWA install banner after 3rd visit
- [ ] 10.2 iOS: manual install instructions in settings
- [ ] 10.3 "Book Now" on landing → therapist profile
- [ ] 10.4 Verify all landing page links
- [ ] 10.5 Deploy to production (somove.app)
- [ ] 10.6 Configure domain, SSL, environment variables
- [ ] 10.7 Security review: auth, RLS policies, input validation

---

## 13. Effort Summary (Lean MVP)

| Phase | Description | Hours |
|-------|-------------|-------|
| 0 | Foundation (auth, design system, nav shell, env validation, seed script) | 28–35h |
| 1 | Client onboarding + therapist profile + setup wizard | 20–25h |
| 2 | Booking flow (Cal.com embed) | 8–12h |
| 3 | Payments (Stripe Checkout, single sessions) | 15–20h |
| 4 | Session management | 15–20h |
| 5 | Video calls + P1 gesture controls (Daily.co + MediaPipe Hands) | 50–65h |
| 6 | Messaging (Supabase Realtime, 1:1 text chat) | 20–25h |
| 7 | Emergency support (static page) | 3–5h |
| 8 | Therapist notes (plain text, auto-save) | 10–12h |
| 9 | GDPR compliance (minimal) | 3–5h |
| 10 | PWA install + deploy + Deploy button + README | 10–12h |
| **Total** | | **182–236h** |

### Timeline

| Team | Duration |
|------|----------|
| 2 devs (frontend + backend) | **5–6 weeks** |
| 1 senior dev full-time | **9–12 weeks** |

---

## 14. Stripped from Lean MVP → Production Version

Everything below was in the full MVP plan but stripped for speed. Each item includes rationale and when to add it back.

### Scheduling

| Stripped Feature | Hours | Rationale | When to Add Back |
|-----------------|-------|-----------|-----------------|
| Cal.com API custom booking UI | ~15–20h | Embed ships in hours; custom UI can wait | After validating booking flow works with embed |
| Custom date/time picker | ~8–12h | Part of custom UI above | Same |
| Session type selection screen (multiple types) | ~5–8h | Single session type for lean MVP | When therapist offers multiple session formats |

### Payments

| Stripped Feature | Hours | Rationale | When to Add Back |
|-----------------|-------|-----------|-----------------|
| Bundle system (3, 5, 10 session credits) | ~8–12h | Pricing optimization, not core loop | When therapist has repeat clients requesting packages |
| EU-compliant invoice PDF generation | ~5–8h | Stripe receipts sufficient for MVP | When therapist needs it for tax compliance |
| `session_credits` table + credit deduction flow | ~5–8h | Part of bundle system | Same |
| `invoices` table + PDF storage | ~3–5h | Part of invoice system | Same |

### Video Calls & Gestures

| Stripped Feature | Hours | Rationale | When to Add Back |
|-----------------|-------|-----------|-----------------|
| P2 gestures (volume up/down, framing presets) | ~8–12h | P1 covers 90% of use cases | After P1 validated with real users |
| Gesture calibration screen | ~3–5h | Tooltip sufficient; calibration doesn't change model | When accuracy issues arise in testing |
| Canvas zoom pipeline (remote sees zoom) | ~5–8h | CSS transform on local preview is enough for MVP | With LiveKit migration |
| `VideoTrackSource` abstraction for future auto-framing | ~1–2h | No auto-framing in MVP | With LiveKit migration |

### Emergency Support

| Stripped Feature | Hours | Rationale | When to Add Back |
|-----------------|-------|-----------|-----------------|
| 4-7-8 breathing animation | ~3–4h | Beautiful but not core to booking/video/chat loop | Post-launch content update |
| Interactive body scan prompt | ~2–3h | Same | Same |
| 5-4-3-2-1 sensory grounding checklist | ~2–3h | Same | Same |
| Somatic check-in (tension slider) | ~1–2h | Same | Same |
| Therapist mute hours + SLA display | ~3–5h | "Contact therapist" button sufficient for MVP | Post-launch polish |
| Therapist response SLA in UI | ~2–3h | Part of mute hours system | Same |

### Notes System

| Stripped Feature | Hours | Rationale | When to Add Back |
|-----------------|-------|-----------|-----------------|
| Markdown rendering | ~3–5h | Plain text is sufficient | When therapist requests richer formatting |
| Collapsible session note sections | ~2–3h | Simple chronological list is enough | Post-launch polish |
| Swipe-to-delete with undo toast | ~2–3h | Basic delete is enough | Same |
| "Add note" FAB + bottom sheet | ~1–2h | Inline textarea sufficient | Same |

### GDPR

| Stripped Feature | Hours | Rationale | When to Add Back |
|-----------------|-------|-----------|-----------------|
| Automated data export (JSON/PDF) | ~3–5h | Manual via email at this scale (~20 clients) | When client count justifies automation |
| Automated account deletion pipeline | ~3–5h | Manual via email, GDPR-compliant | Same |
| Breach notification + CNPD registration | ~2–3h | Therapist responsibility, document in privacy policy | Pre-marketplace |
| `notifications` table | ~3–5h | Email-only notifications for MVP | With Web Push implementation |

### PWA & Notifications

| Stripped Feature | Hours | Rationale | When to Add Back |
|-----------------|-------|-----------|-----------------|
| Web Push notifications | ~8–10h | Email notifications sufficient for MVP | After email notifications proven insufficient |
| Service worker offline caching | ~5–8h | PWA install is enough | Polish phase |
| Offline banner + queued messages | ~3–5h | Part of offline support | Same |
| Deep-link on notification tap | ~2–3h | Part of push notifications | Same |
| Per-type notification preferences | ~2–3h | Email all or nothing for MVP | Same |
| Lighthouse PWA optimization pass | ~3–5h | Functional is enough, optimize later | Same |

### Other

| Stripped Feature | Hours | Rationale | When to Add Back |
|-----------------|-------|-----------|-----------------|
| Bulk email invite for existing clients | ~2–3h | Manual invite at this scale | When therapist has many clients to migrate |
| Therapist calendar drag-to-reschedule | ~3–5h | Cancel + rebook is sufficient | Post-launch |
| Revenue charts + appointment stats | ~3–5h | Simple list is enough | Post-launch polish |

---

## 15. Future Phases (Full Marketplace)

The lean MVP ships the core loop. Below is the full build path from production version to marketplace.

### Production Version (adds back stripped MVP items)

| Feature | Source |
|---------|--------|
| Cal.com API custom booking UI | Section 14 above |
| Bundle credits system (3, 5, 10) | Section 14 above |
| EU-compliant invoice generation | Section 14 above |
| P2 gesture controls (volume, framing presets) | Section 14 above |
| Gesture calibration screen | Section 14 above |
| Emergency grounding animations | Section 14 above |
| Therapist mute hours + SLA | Section 14 above |
| Markdown notes + polish | Section 14 above |
| Automated GDPR export/deletion | Section 14 above |
| Web Push notifications | Section 14 above |
| Offline support | Section 14 above |

### Marketplace & Scale

| Phase | Description | Source Roadmap |
|-------|-------------|----------------|
| Multi-practitioner marketplace | Therapist discovery, application/approval, admin panel | `plan/MASTER_PLATFORM_ROADMAP.md` Phase 2 |
| Stripe Connect + 10% platform fee | Marketplace payment splitting | `plan/PAYMENT_SYSTEM_ROADMAP.md` |
| LiveKit migration | Self-hosted video, replaces Daily.co | `plan/VIDEO_CALL_ROADMAP.md` Phase 1 |
| Auto-framing (MoveNet Pose) | Automatic full-body tracking (independent from gesture controls) | `plan/VIDEO_CALL_ROADMAP.md` Phase 2 |
| Structured inbox | Tagged conversations, file attachments | `plan/CHAT_AND_SUPPORT_ROADMAP.md` Phase 1 |
| Support system | Chatwoot + Typebot + Mistral Small 4 | `plan/CHAT_AND_SUPPORT_ROADMAP.md` Phase 2–3 |
| Therapist custom ToS | Per-therapist terms, version-stamped | `plan/MASTER_PLATFORM_ROADMAP.md` Phase 3 |
| Google/Apple OAuth | Frictionless sign-in expansion | `plan/MASTER_PLATFORM_ROADMAP.md` Phase 0 |
| Google Calendar sync | Two-way sync | `plan/SCHEDULING_SYSTEM_ROADMAP.md` Phase 3.4 |
| Self-hosted Cal.com | Infrastructure independence | `plan/SCHEDULING_SYSTEM_ROADMAP.md` Phase 0 |
| Stripe Tax | Automated EU VAT | `plan/PAYMENT_SYSTEM_ROADMAP.md` |
| Canvas zoom pipeline | Remote participant sees zoomed/framed view | With LiveKit migration |

### Community & DAO

| Phase | Description | Source |
|-------|-------------|--------|
| Telegram bot | Therapist notifications + community groups | Future |
| Content library | Exercises, education, homework | Future |
| AI session notes | LLM-assisted (heavy compliance) | Future |
| Wearable integration | Apple Watch, Oura, HealthKit | Future |
| Multi-currency | USD, GBP | Future |
| DAO governance | Community-governed protocol | Future |

---

## 16. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Gesture false triggers during movement | Medium | Medium | 1.5s hold-to-confirm, opt-in toggle, easy disable |
| Battery drain (MediaPipe + WebRTC) | Medium | Medium | Performance monitoring, auto-disable, easy toggle off |
| MediaPipe accuracy at 6+ ft distance | Medium | Low | Tooltip guidance, fallback to manual controls |
| GDPR compliance burden | Low | High | EU data residency from day 1, encrypted sensitive fields |
| Full-body video quality on mobile | Medium | Medium | Daily.co bandwidth adaptation, audio-only fallback |
| Cal.com embed limitations | Low | Medium | Embed covers most needs; custom UI available when needed |
| Timeline pressure | Low | Medium | Lean scope is intentionally minimal — 4–6 weeks is achievable |
| Scope creep | Medium | High | Section 14 explicitly lists every stripped item with "when to add back" criteria |

---

## 17. Market Context

- **Global somatic therapy market:** $4.01–4.72B (2025), growing at 16.8–17.7% CAGR
- **Practitioner pain point #1:** Client acquisition (marketing is the defining challenge)
- **Practitioner pain point #2:** €400–600/mo spent on fragmented tech tools
- **85–88% of somatic therapists** operate out-of-network
- **No existing platform** combines directory + booking + telehealth + practice management for body-based therapy
- **"Body-blind telehealth"** is the critical technology gap — no platform supports full-body video
- **Gen Z driving demand:** 42% in therapy, fluent in nervous system vocabulary, prefer digital/mobile tools
- **Headway valuation:** $2.3B from solving insurance billing for talk therapy — somatic therapy is a faster-growing, unserved segment

---

## 18. Open-Source Distribution Plan

### What's Open-Source

The lean MVP (this PRD) is the open-source version. It includes everything a solo somatic therapist needs to run their practice:

- Scheduling (Cal.com embed)
- Video calls with P1 gesture controls (Daily.co + MediaPipe Hands)
- Single session payments (Stripe Checkout)
- 1:1 messaging (Supabase Realtime)
- Client notes (plain text)
- Emergency crisis resources (static page)
- GDPR-compliant data handling (EU-hosted)

### What's NOT Open-Source (Proprietary / Hosted)

The production version and marketplace features from Section 14 and Section 15 remain proprietary:

- Cal.com API custom booking UI
- Bundle credits system (3, 5, 10 sessions)
- EU-compliant invoice PDF generation
- P2 gesture controls (volume, framing presets)
- Emergency grounding animations
- Web Push notifications
- Automated GDPR export/deletion
- Multi-practitioner marketplace
- Stripe Connect + platform fee
- Therapist discovery + approval flows
- Admin panel
- Structured inbox with tags + file attachments
- Support chatbot (Chatwoot + Typebot)

### Deployment Method: "Deploy to Vercel" Button

**Target user:** A solo somatic therapist with no technical background. They can follow a step-by-step guide and click buttons.

**Deployment flow:**

1. Therapist clicks **"Deploy Somove"** button in the GitHub README
2. Vercel prompts: "Connect GitHub" → forks repo automatically
3. Vercel prompts: "Set up Supabase" → one click auto-provisions Supabase project (EU region, Frankfurt) via the official Vercel integration
4. Vercel prompts for environment variables with clear descriptions:
   - `DAILY_API_KEY` — "Get yours at daily.co → Sign up → API Keys"
   - `CAL_API_KEY` — "Get yours at cal.com → Sign up → Developer Settings"
   - `STRIPE_SECRET_KEY` — "Get yours at stripe.com → Sign up → API Keys"
   - `RESEND_API_KEY` — "Get yours at resend.com → Sign up → API Keys"
5. Deploy completes → therapist visits their new URL (e.g., `somove-yourname.vercel.app`)
6. **First-visit setup wizard** runs automatically (if no `therapist_profile` exists):

**Setup wizard steps:**
- Step 1: "Welcome to Somove" — enter name, email, set password (therapist account)
- Step 2: "Your profile" — upload photo, write bio, add credentials, select modalities
- Step 3: "Session pricing" — set session price (EUR), session duration, free first session toggle
- Step 4: "Availability" — set weekly schedule (Mon–Sun, working hours)
- Step 5: "Connect Stripe" — link opens Stripe onboarding in new tab
- Step 6: "Done — your practice is live" — shows booking link, shareable URL

**Cost for the therapist (all free tiers):**

| Service | Free Tier | Notes |
|---------|----------|-------|
| Vercel | Hobby plan (free) | Custom domain supported |
| Supabase | Free tier (500MB DB, 50K auth users) | EU region |
| Daily.co | Free tier (1,000 min/mo) | ~15 sessions/mo |
| Cal.com | Free tier (1 event type) | Enough for solo therapist |
| Stripe | No monthly fee | 1.5% + €0.25 per EU card payment |
| Resend | Free tier (100 emails/day) | Booking confirmations + notifications |
| **Total** | **~€0/mo** | Scales with usage |

### What to Build for the Open-Source Release

**Included in lean MVP timeline:**

| Task | Hours | Phase |
|------|-------|-------|
| Environment variable validation on startup (clear error messages with links to get each key) | 2–3h | Phase 0 |
| First-visit setup wizard (6 steps, resumable, stores therapist profile) | 10–15h | Phase 1 |
| Auto-seed script (creates DB schema + therapist user on first deploy) | 3–5h | Phase 0 |
| "Deploy to Vercel" button + README section with screenshots | 1–2h | Phase 10 |

**Post-lean MVP (before open-source release):**

| Task | Hours | Notes |
|------|-------|-------|
| README with step-by-step deploy guide (screenshots for each external service signup) | 5–8h | Daily.co, Cal.com, Stripe, Resend signup walkthroughs |
| CONTRIBUTING.md | 2–3h | Code of conduct, PR process, dev setup instructions |
| LICENSE file (MIT or AGPL-3.0) | 0.5h | Decide on license |
| Demo video (30–60s showing gesture controls) | 3–5h | Marketing asset for GitHub/Reddit/HN |
| Custom domain setup guide (point therapist's domain to Vercel) | 1–2h | Optional but valuable |

### License Consideration

- **MIT:** Permissive, allows anyone to fork and build commercial products on top. Lowers barrier to adoption but no protection against someone taking the code and competing.
- **AGPL-3.0:** Requires anyone who modifies and hosts the code to open-source their changes. Protects against proprietary forks while still allowing self-hosting. Common for open-source SaaS projects (Cal.com, Chatwoot, Typebot all use AGPL).

**Recommendation:** AGPL-3.0. The somatic therapy niche is small enough that you want contributions flowing back. AGPL ensures that anyone who improves Somove for their practice must share those improvements.

### Repository Structure

```
somove/
├── PRD.md                        → This document
├── README.md                     → Deploy guide + screenshots
├── CONTRIBUTING.md               → Contribution guidelines
├── LICENSE                       → AGPL-3.0
├── web/                          → Next.js app
│   ├── src/
│   ├── public/
│   └── ...
├── plan/                         → Full marketplace roadmaps (reference only, not built)
├── supabase/                     → Database migrations + seed scripts
│   ├── migrations/
│   └── seed.sql                  → Auto-runs on deploy (schema + therapist user)
└── docs/
    ├── setup-daily.md            → Step-by-step Daily.co signup
    ├── setup-calcom.md           → Step-by-step Cal.com signup
    ├── setup-stripe.md           → Step-by-step Stripe signup
    ├── setup-resend.md           → Step-by-step Resend signup
    └── custom-domain.md          → Pointing a domain to Vercel
```
