# Somove Platform — Master Roadmap

## Overview

A unified PWA-first platform for somatic therapy. One codebase, two experiences (client and therapist), one design system. Mobile is the primary target — every screen designed for phone first, enhanced for tablet and desktop.

**MVP & Beta scope: Europe only. All infrastructure EU-hosted. Primary currency: EUR.**

**This document describes the full marketplace build (all phases).** For lean MVP scope (single-therapist, 169–219h, Cal.com embed, P1 gesture controls only), see [[Product Requirements Document|Product Requirements Document]] which is the authoritative MVP source of truth. This roadmap picks up where the lean MVP leaves off and describes the complete multi-practitioner platform.

**Referenced documents:**
- [[Product Requirements Document|Product Requirements Document]] — **Lean MVP source of truth** (single-therapist, Daily.co, Cal.com embed, P1 gestures, Stripe Checkout, 169–219h)
- [[Video Call Roadmap]] — LiveKit + auto-framing
- [[Scheduling System Roadmap]] — Cal.com integration
- [[Payment System Roadmap]] — Stripe Connect
- [[Chat and Support Roadmap]] — Therapist inbox + Chatwoot + Typebot

**Full marketplace stack:** Next.js 14 (App Router) · Supabase (PostgreSQL + Auth + Realtime) · Tailwind CSS · PWA (next-pwa) · LiveKit · Cal.com · Stripe Connect · Chatwoot · Typebot + OpenRouter (Mistral Small 4)

**Lean MVP stack (from [[Product Requirements Document|PRD]]):** Next.js 14 · Supabase · Daily.co · Cal.com embed · MediaPipe Hands (P1) · Stripe Checkout (single sessions) · Resend · Vercel

---

## Decisions Log

| # | Decision |
|---|---|
| 1 | Clients can book any available therapist — no fixed assignment |
| 2 | Therapists apply and are manually approved by Somove before going live |
| 3 | No platform-wide free trials. Individual therapists may optionally offer a free first session to new clients |
| 4 | Platform fee: **10%** of session revenue |
| 5 | Therapists set their own pricing: single session + optional bundles (3, 5, or 10 sessions) |
| 6 | Primary currency: **EUR**. Europe-only for MVP and Beta |
| 7 | Account required, but frictionless: Google, Apple, or email magic link. Only name + email collected |
| 8 | Stripe Tax enabled from day one — VAT handled automatically |
| 9 | Scheduling is fully end-to-end within Somove (Cal.com under the hood) |
| 10 | Each therapist can write their own Terms of Service, shown and accepted by clients at booking |
| 11 | All data (including clinical notes and messages) stored on EU-hosted infrastructure |
| 12 | HIPAA not in scope — Europe only for now |
| 13 | Session-related chat messages deleted when session ends. Therapist notes are persistent (with PII warning) |
| 14 | Therapist-client communication is a structured inbox/ticket system with tags (system: Patient / Not Patient + custom therapist-defined tags) |
| 15 | Both clients and therapists can send file attachments in conversations |
| 16 | Support chatbot uses Typebot → OpenRouter → Mistral Small 4 (EU data retention) |
| 17 | Session recording: permanently out of scope |

---

## Two Experiences, One Design Language

```
somove.com/
├── (client app)
│     ├── /                    → Home / therapist discovery
│     ├── /therapists/:id      → Therapist profile + booking
│     ├── /my-sessions         → Upcoming + past sessions
│     ├── /inbox               → Messages with therapist
│     ├── /session/:id         → Video call
│     └── /settings            → Profile, notifications, account
│
├── (therapist app)
│     ├── /dashboard           → Today: sessions, inbox, earnings summary
│     ├── /dashboard/schedule  → Calendar view
│     ├── /dashboard/clients   → Client list with inbox tags
│     ├── /dashboard/clients/:id → Client profile + notes
│     ├── /dashboard/inbox     → All client conversations (tagged inbox)
│     ├── /dashboard/session/:id → Video call (therapist view)
│     ├── /dashboard/earnings  → Payouts + revenue
│     └── /dashboard/settings  → Availability, pricing, ToS, Stripe, profile
│
└── /admin                     → Internal Somove team (therapist approvals, support oversight)
```

---

## Mobile Navigation

### Client — Bottom Navigation Bar
```
┌─────────────────────────────────────────┐
│              (screen content)           │
├─────────────────────────────────────────┤
│  🏠 Home  │  📅 Sessions  │  💬 Inbox  │  ❓ Help  │
└─────────────────────────────────────────┘
```

### Therapist — Bottom Navigation Bar
```
┌─────────────────────────────────────────┐
│              (screen content)           │
├─────────────────────────────────────────┤
│  📊 Today  │  📅 Schedule  │  👥 Clients  │  💰 Earnings  │
└─────────────────────────────────────────┘
```

Profile, settings, and inbox accessible via avatar + notification bell in top-right.
Chatwoot support bubble floats bottom-right, hidden during video calls.

---

## PWA Principles (applies to every phase)

- **Touch targets minimum 44×44px** on all interactive elements
- **No hover-only interactions** — every action works on tap
- **Safe area insets** — respect notch and home indicator on iOS
- **Bottom sheet pattern** for secondary actions instead of full-screen modals
- **Skeleton screens** instead of spinners — perceived performance on mobile
- **Optimistic UI** — messages and note saves update instantly before server confirms
- **Offline states** — graceful degradation with clear messaging
- **Pull-to-refresh** on all lists

---

## Phase 0 — Foundation

**Goal:** Project skeleton, design system, auth, PWA config, and navigation shell.

**Estimated effort:** 35–45 hours
**Dependency:** Nothing — first thing to build.

---

### 0.1 Project Setup

- [ ] **0.1.1** Initialise Next.js 14 with App Router and TypeScript
- [ ] **0.1.2** Configure Tailwind CSS with Somove design tokens:
  - Colours: gold `#D4A574`, sage `#8BA888`, rose `#E8C4B8`, moss `#C5D5C5`, warm white `#FFF5E1`
  - Typography, spacing, border-radius, shadow scales
- [ ] **0.1.3** Install and configure `next-pwa`
- [ ] **0.1.4** Create `manifest.json` (display: standalone, portrait, Somove icons 192 + 512px)
- [ ] **0.1.5** Set COOP/COEP headers in `next.config.js` (required for WASM — Phase 5 auto-framing):
  ```
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
  ```
- [ ] **0.1.6** Set up Supabase project on **EU region** (Frankfurt) — mandatory for data residency
- [ ] **0.1.7** Configure environment variables across dev / staging / production
- [ ] **0.1.8** ESLint, Prettier, TypeScript strict mode, Husky pre-commit hook

---

### 0.2 Design System

- [ ] **0.2.1** Base components: `Button`, `Input`, `Textarea`, `Select`, `Checkbox`, `Toggle`
- [ ] **0.2.2** Display components: `Card` (glassmorphism from landing page), `Avatar`, `Badge`, `Tag`
- [ ] **0.2.3** Feedback components: `Spinner`, `Skeleton`, `Toast`, `EmptyState`, `ErrorBoundary`
- [ ] **0.2.4** Layout components:
  - `BottomNav` (safe area inset aware)
  - `TopBar` (title + back + avatar)
  - `BottomSheet` (slides up, replaces modals on mobile)
  - `PageContainer` (max-width, padding, scroll)
- [ ] **0.2.5** `FileAttachment` component — preview thumbnail for images, file icon for documents
- [ ] **0.2.6** All components keyboard accessible and screen-reader labelled

---

### 0.3 Authentication — Frictionless

Only name and email collected. No passwords required.

- [ ] **0.3.1** Configure Supabase Auth providers:
  - Google OAuth
  - Apple Sign In (required for iOS PWA users)
  - Magic link (email → one-click login, no password)
- [ ] **0.3.2** Sign in / sign up page — single screen, three options:
  - "Continue with Google"
  - "Continue with Apple"
  - "Continue with email" → email field → magic link sent
- [ ] **0.3.3** On first sign-in: prompt for display name (pre-filled from OAuth if available)
- [ ] **0.3.4** `User` roles: `client`, `therapist`, `admin`
- [ ] **0.3.5** Role-based redirect on auth: `client` → `/`, `therapist` → `/dashboard`, `admin` → `/admin`
- [ ] **0.3.6** Auth middleware — protect routes by role
- [ ] **0.3.7** Sign out clears local state, redirects to landing

---

### 0.4 Navigation Shell

- [ ] **0.4.1** `ClientLayout` — BottomNav + TopBar for all client routes
- [ ] **0.4.2** `TherapistLayout` — BottomNav + TopBar for all therapist routes
- [ ] **0.4.3** `VideoCallLayout` — full-screen, no nav, no support bubble
- [ ] **0.4.4** Unread inbox badge on relevant nav tab for both roles
- [ ] **0.4.5** PWA install prompt after 3rd visit (not on first)

---

## Phase 1 — Client Onboarding & Therapist Discovery

**Goal:** Client signs up, completes a brief intake, and can browse therapists.

**Estimated effort:** 20–25 hours
**Dependency:** Phase 0.

---

### 1.1 Client Sign Up & Intake

- [ ] **1.1.1** After first sign-in: brief 2-step intake:
  - Step 1: "What brings you to Somove?" (checkboxes: stress, anxiety, trauma, burnout, curiosity, other)
  - Step 2: "Have you worked with a somatic therapist before?" (yes / no / not sure)
- [ ] **1.1.2** Store on `ClientProfile`
- [ ] **1.1.3** Skip option available — intake collectable later
- [ ] **1.1.4** Redirect to therapist discovery on completion

---

### 1.2 Therapist Discovery

- [ ] **1.2.1** `/` (authenticated client) — therapist cards grid
- [ ] **1.2.2** `TherapistCard`: photo, name, specialties, session price (or "Free first session" badge), CTA
- [ ] **1.2.3** Filter by specialty, price range, has availability this week
- [ ] **1.2.4** `/therapists/:id` — full profile: bio, approach, specialties, pricing (single + bundles), free first session badge if applicable, "Book a session" CTA

---

## Phase 2 — Therapist Onboarding & Approval

**Goal:** Therapists apply, get reviewed by Somove admin, and only go live after approval.

**Estimated effort:** 30–35 hours
**Dependency:** Phase 0. Cal.com + Stripe infra live.

---

### 2.1 Therapist Application Flow

- [ ] **2.1.1** `/apply` — public landing page: "Join Somove as a therapist"
- [ ] **2.1.2** Sign up as therapist → triggers application flow (status: `pending_review`)
- [ ] **2.1.3** Multi-step application (saves each step, resumable):
  - Step 1: Personal info (name, photo, location, timezone)
  - Step 2: Credentials (training, certifications, years of practice)
  - Step 3: Your approach (bio, specialties, modalities)
  - Step 4: Session pricing:
    - Single session price (EUR, required)
    - 3-session bundle price (EUR, optional)
    - 5-session bundle price (EUR, optional)
    - 10-session bundle price (EUR, optional)
  - Step 5: Free first session toggle ("Offer a free first session to new clients")
  - Step 6: Terms of Service editor (optional — therapist writes their own ToS shown to clients at booking; if left blank, Somove's default terms apply)
  - Step 7: Availability setup → Cal.com integration
  - Step 8: Payout setup → Stripe Connect onboarding
- [ ] **2.1.4** Checklist UI showing completion of each step
- [ ] **2.1.5** "Submit application" CTA (enabled when all required steps done)
- [ ] **2.1.6** On submit: status → `pending_review`, admin notified (see Phase 2.2)

---

### 2.2 Admin Approval Flow

- [ ] **2.2.1** `/admin/applications` — list of pending therapist applications
- [ ] **2.2.2** Application detail: full profile, credentials, bio, pricing
- [ ] **2.2.3** Approve action → status: `active`, therapist profile visible in discovery, email sent to therapist ("You're approved — welcome to Somove")
- [ ] **2.2.4** Reject action → status: `rejected`, require rejection reason, email sent to therapist with reason
- [ ] **2.2.5** Request more info action → email therapist with specific question, status: `awaiting_info`
- [ ] **2.2.6** Therapist can resubmit after rejection or info request

---

### 2.3 Post-Approval: Profile Management

- [ ] **2.3.1** `/dashboard/settings` — edit all profile fields post-approval
- [ ] **2.3.2** Pricing changes take effect for new bookings only (existing sessions unaffected)
- [ ] **2.3.3** Free first session toggle (on/off at any time)
- [ ] **2.3.4** ToS editor: edit anytime; version-stamped so old acceptances remain valid
- [ ] **2.3.5** Profile visibility toggle: temporarily hide from discovery without losing account

---

## Phase 3 — Booking Flow (Client)

**Goal:** Client selects a session type, accepts therapist ToS, pays (or uses credits/free session), and receives confirmation.

**Estimated effort:** 25–30 hours
**Dependency:** Phase 1 + 2. Cal.com + Stripe infra live.

---

### 3.1 Booking Entry Points

- [ ] **3.1.1** "Book a session" on therapist profile
- [ ] **3.1.2** "Book again" on past session card
- [ ] **3.1.3** Therapist can send a direct booking link to a client (from their dashboard)

---

### 3.2 Booking Flow (mobile-first, 4 screens)

- [ ] **3.2.1** Screen 1 — Session type selection:
  - Single session (price shown)
  - 3-session bundle (if set, price + per-session breakdown)
  - 5-session bundle (if set)
  - 10-session bundle (if set)
  - Free first session (shown automatically if eligible: never booked this therapist + toggle is on)
- [ ] **3.2.2** Screen 2 — Date & time picker:
  - Available slots from Cal.com API
  - Calendar → time grid for selected date
  - Shown in client's local timezone
  - For bundles: book first session now, remaining credits usable for future bookings
- [ ] **3.2.3** Screen 3 — Terms of Service (shown only if therapist has written ToS):
  - Therapist's ToS rendered in scrollable view
  - "I have read and accept these terms" checkbox
  - Required to proceed
  - ToS version and acceptance timestamp stored
- [ ] **3.2.4** Screen 4 — Confirm & Pay:
  - Session summary + pricing breakdown
  - For free first session: "Confirm booking" (no payment)
  - For paid: redirect to Stripe Checkout
- [ ] **3.2.5** `/booking/confirmed` — confirmation with calendar add links (Google, Apple, .ics)
- [ ] **3.2.6** Email confirmation sent automatically

---

### 3.3 Session Credits (Bundle Bookings)

- [ ] **3.3.1** `SessionCredit` model:
  ```
  SessionCredit {
    id              String
    clientEmail     String
    therapistId     String
    totalCredits    Int
    usedCredits     Int
    remainingCredits Int  (computed)
    stripePaymentIntentId String
    purchasedAt     DateTime
    expiresAt       DateTime?
  }
  ```
- [ ] **3.3.2** On bundle purchase confirmed: create `SessionCredit` record
- [ ] **3.3.3** On each booking with this therapist: check for available credits first, deduct one if available (skip payment flow)
- [ ] **3.3.4** Client can see remaining credits on therapist profile and session booking screen
- [ ] **3.3.5** Therapist can see credits outstanding per client in their client profile

---

## Phase 4 — Session Management

**Goal:** Client and therapist view upcoming/past sessions with correct status and join access.

**Estimated effort:** 20–25 hours
**Dependency:** Phase 3.

---

### 4.1 Client Sessions Page

- [ ] **4.1.1** `/my-sessions` — tabbed: Upcoming / Past
- [ ] **4.1.2** `SessionCard`: therapist photo + name, date/time (local tz), duration, status badge
- [ ] **4.1.3** "Join Session" button — active 10 min before start only
- [ ] **4.1.4** Past session: "Book again" link
- [ ] **4.1.5** Remaining bundle credits shown if any
- [ ] **4.1.6** Cancellation → refund flow (per policy in payment roadmap)

---

### 4.2 Therapist Schedule & Today View

- [ ] **4.2.1** `/dashboard` — today's sessions chronologically + unread inbox count
- [ ] **4.2.2** `/dashboard/schedule` — FullCalendar week view, session blocks with client name
- [ ] **4.2.3** Session detail bottom sheet: client name, pre-session notes, join button, credits status if bundle
- [ ] **4.2.4** "Cancel session" action → triggers refund and Cal.com cancellation

---

## Phase 5 — Video Call

**Goal:** Stable mobile-optimised video call. Auto-framing available as opt-in toggle. No recording — ever.

**Estimated effort:** 155–215 hours total across both sub-phases.
**Dependency:** Phase 4. LiveKit infrastructure live (EU region).
**Detail:** See [[Video Call Roadmap]].

---

### 5.1 Call Screen

- [ ] **5.1.1** `/session/:id` — full-screen, `VideoCallLayout` (no nav, no support bubble)
- [ ] **5.1.2** Remote video full screen, self-view draggable corner tile
- [ ] **5.1.3** Controls bar (auto-hides, reappears on tap):
  - Mute mic · Toggle camera · Auto-frame toggle (Phase 5.2) · End call
  - Notes button (therapist only — see 5.3)
- [ ] **5.1.4** Connection state overlays (connecting / reconnecting / poor connection)
- [ ] **5.1.5** "Waiting for [name]..." holding state
- [ ] **5.1.6** On end call: session messages wiped (see decision #13). Client → `/my-sessions`. Therapist → client profile page.

---

### 5.2 Auto-Frame (Phase 2 of video call roadmap)

- [ ] Capability detection → toggle shown only if supported
- [ ] MoveNet pose detection pipeline
- [ ] Crop-and-follow with smoothing
- [ ] Runtime performance fallback to standard camera
- [ ] **Detail:** See [[Video Call Roadmap]] Phase 2

---

### 5.3 Therapist Notes During Call

- [ ] **5.3.1** Notes button in call controls (therapist only, invisible to client)
- [ ] **5.3.2** Tap → notes panel slides up as bottom sheet (call continues uninterrupted)
- [ ] **5.3.3** Shows existing client notes + new note text area
- [ ] **5.3.4** Auto-save (debounced 2s) — notes safe if call drops
- [ ] **5.3.5** New notes auto-linked to `sessionId`
- [ ] **5.3.6** Swipe down to dismiss panel

---

## Phase 6 — Therapist Notes System

**Goal:** Persistent, private per-client notes. Visible on client profile and during sessions. Never visible to clients.

**Estimated effort:** 25–30 hours
**Dependency:** Phase 4.

---

### 6.1 Data Model

- [ ] **6.1.1** `ClientNote`:
  ```
  ClientNote {
    id          String
    therapistId String
    clientEmail String
    sessionId   String?    (null = general note, set = session note)
    body        String     (markdown)
    deletedAt   DateTime?  (soft delete)
    createdAt   DateTime
    updatedAt   DateTime
  }
  ```
- [ ] **6.1.2** RLS policy: therapist reads/writes own notes only. Client has zero access.
- [ ] **6.1.3** PII warning displayed in notes UI: "Do not record personally identifiable or sensitive clinical data. Use key observations only."

---

### 6.2 Client Profile Page (Therapist View)

- [ ] **6.2.1** `/dashboard/clients/:id` — header: name, pronouns, intake responses, first session date, remaining credits
- [ ] **6.2.2** Two-tab layout: **Notes** (default) | **Sessions**
- [ ] **6.2.3** "Send message" button → opens inbox conversation with this client

---

### 6.3 Notes Tab

- [ ] **6.3.1** "General notes" — free-form, not tied to session. Single editable area, auto-saves on blur
- [ ] **6.3.2** "Session notes" — chronological, each session as collapsible section header with linked notes beneath
- [ ] **6.3.3** "Add note" FAB → bottom sheet with textarea + save
- [ ] **6.3.4** Tap note → inline edit → auto-save
- [ ] **6.3.5** Swipe left on note → delete (soft delete, with undo toast)
- [ ] **6.3.6** Markdown rendered in read mode

---

### 6.4 Client List (Notes Preview)

- [ ] **6.4.1** `/dashboard/clients` — therapist's full client list
- [ ] **6.4.2** `ClientRow`: photo, name, next session date, last note preview (60 chars), unread inbox badge, tags (Patient / Not Patient / custom)
- [ ] **6.4.3** Sort: by next session, last activity, alphabetical
- [ ] **6.4.4** Search by name

---

## Phase 7 — Therapist Inbox (Client Communication)

**Goal:** Each therapist has a structured inbox for all client and prospect communication. Tagged, filterable, supports file attachments. Replaces simple 1:1 chat with a lightweight CRM-style system.

**Estimated effort:** 40–50 hours
**Dependency:** Phase 0 (Supabase Realtime). Phase 2 (therapist live).

---

### 7.1 Data Model

- [ ] **7.1.1** `Conversation`:
  ```
  Conversation {
    id            String
    therapistId   String
    clientEmail   String
    clientName    String
    status        Enum (open, pending, closed)
    tags          Tag[]
    lastMessageAt DateTime?
    sessionId     String?   (if linked to a booked session)
    createdAt     DateTime
  }
  ```
- [ ] **7.1.2** `Message`:
  ```
  Message {
    id              String
    conversationId  String
    senderRole      Enum (client, therapist)
    body            String
    attachments     Attachment[]
    readAt          DateTime?
    createdAt       DateTime
  }
  ```
- [ ] **7.1.3** `Attachment`:
  ```
  Attachment {
    id           String
    messageId    String
    fileUrl      String    (Supabase Storage, EU bucket)
    fileName     String
    fileSize     Int
    mimeType     String
  }
  ```
- [ ] **7.1.4** `Tag`:
  ```
  Tag {
    id          String
    therapistId String
    name        String
    colour      String
    isSystem    Boolean   (true = Patient / Not Patient, not deletable)
  }
  ```
- [ ] **7.1.5** Seed system tags for each therapist on account creation: `Patient` (green), `Not Patient` (grey)
- [ ] **7.1.6** RLS: therapist reads/writes own conversations; client reads/writes their own conversations only

---

### 7.2 Tag Management

- [ ] **7.2.1** Therapist can create custom tags (name + colour) from `/dashboard/settings`
- [ ] **7.2.2** Apply multiple tags to a conversation
- [ ] **7.2.3** System tags `Patient` / `Not Patient` cannot be deleted or renamed
- [ ] **7.2.4** Auto-apply `Patient` tag when a session booking is confirmed for that client-therapist pair

---

### 7.3 Therapist Inbox View

- [ ] **7.3.1** `/dashboard/inbox` — split layout (desktop: list + thread; mobile: list → thread)
- [ ] **7.3.2** Conversation list: client name, last message preview, timestamp, tags, unread indicator
- [ ] **7.3.3** Filter bar: All · Open · Pending · Closed · by Tag
- [ ] **7.3.4** Search conversations by client name or message content
- [ ] **7.3.5** Conversation detail:
  - Message thread (reverse chronological, newest at bottom)
  - File attachment previews inline
  - Tag chips shown at top, editable
  - Status toggle (Open / Pending / Closed)
  - Text input with file attach button (paperclip) + send
- [ ] **7.3.6** Mark conversation as read on open
- [ ] **7.3.7** Unread count badge on inbox nav item

---

### 7.4 Client Inbox View

- [ ] **7.4.1** `/inbox` — client's conversations (typically one per therapist)
- [ ] **7.4.2** Simple thread view: message bubbles + file previews
- [ ] **7.4.3** Text input + file attach + send
- [ ] **7.4.4** "Message [therapist name]" CTA on therapist profile (creates conversation if none exists)
- [ ] **7.4.5** Unread badge on Inbox tab in bottom nav

---

### 7.5 File Attachments

- [ ] **7.5.1** File upload via Supabase Storage (EU bucket, mandatory)
- [ ] **7.5.2** Allowed types: images (JPEG, PNG, WebP), PDF, common document formats
- [ ] **7.5.3** Max file size: 10MB per file
- [ ] **7.5.4** Image: inline thumbnail preview in message thread
- [ ] **7.5.5** Document: file icon + name + size + download link
- [ ] **7.5.6** Storage bucket access: private, signed URLs (expire after 1h for previews)

---

### 7.6 Real-Time Delivery

- [ ] **7.6.1** Supabase Realtime subscription on `messages` table filtered by `conversationId`
- [ ] **7.6.2** New message → instant append to thread without page refresh
- [ ] **7.6.3** Email notification when recipient is offline (debounced 15 min per conversation)
- [ ] **7.6.4** Push notification when recipient is offline and has granted permission (Phase 10)

---

## Phase 8 — Payments & Earnings

**Goal:** Full payment flow including single sessions, bundles, and free first session. 10% platform fee. EUR primary.

**Estimated effort:** 110–145 hours
**Dependency:** Phase 3. Stripe Connect infra live.
**Detail:** See [[Payment System Roadmap]].

---

### 8.1 Client Payment Touchpoints

- [ ] Single session → Stripe Checkout in booking flow
- [ ] Bundle purchase → single Stripe Checkout, credits created on confirmation
- [ ] Free first session → no payment step, booking confirmed directly
- [ ] Refund flow on cancellation (per policy)

---

### 8.2 Therapist Earnings Screen

- [ ] `/dashboard/earnings` — this month / all time toggle
- [ ] Per-session earnings (gross, 10% fee, net)
- [ ] Bundle sales: total paid, sessions delivered, credits outstanding
- [ ] Upcoming payout card
- [ ] "Manage bank account" → Stripe Express dashboard

---

## Phase 9 — Support System

**Goal:** Clients and therapists can reach Somove support via chat bubble (Typebot + Chatwoot). Typebot uses Mistral Small 4 via OpenRouter (EU data retention).

**Estimated effort:** 45–65 hours
**Dependency:** Phase 0. Chatwoot + Typebot infra live.
**Detail:** See [[Chat and Support Roadmap]] Phases 2 and 3.

---

- [ ] Chatwoot widget embedded globally (hidden on `/session/:id`)
- [ ] User identity passed on auth
- [ ] Typebot triage → OpenRouter → Mistral Small 4 for freeform understanding
- [ ] Escalation to human Chatwoot agent with full transcript context
- [ ] Ticket submission form in client and therapist settings

---

## Phase 10 — Notifications & PWA Polish

**Goal:** Push notifications, install prompt, offline states. Platform feels native.

**Estimated effort:** 25–35 hours
**Dependency:** All previous phases.

---

### 10.1 Push Notifications

- [ ] **10.1.1** Request Web Push permission after booking confirmation (high-value moment)
- [ ] **10.1.2** Notification types:
  - New inbox message
  - Session reminder 24h before
  - Session reminder 15 min before ("Your session starts soon")
  - Support ticket reply
  - Payment confirmed / refund processed
  - Bundle credits running low (1 remaining)
- [ ] **10.1.3** Deep-link on tap (notification → correct screen)
- [ ] **10.1.4** Per-type notification preferences in settings

---

### 10.2 PWA Install

- [ ] **10.2.1** Custom install banner after 3rd visit
- [ ] **10.2.2** Dismiss stores preference (don't show for 30 days)
- [ ] **10.2.3** iOS: manual install instructions in settings with screenshots

---

### 10.3 Offline States

- [ ] **10.3.1** Service worker: caches app shell, fonts, static assets
- [ ] **10.3.2** Offline banner
- [ ] **10.3.3** Inbox messages queued offline, sent on reconnect
- [ ] **10.3.4** Session details page cached (client has join link info even offline)

---

### 10.4 Performance

- [ ] Lighthouse PWA 90+, LCP < 2.5s on 4G
- [ ] Code-split by route (TF.js pose detection only loaded when needed)
- [ ] `next/image` with WebP, lazy loading

---

## Phased Build Sequence

```
Phase 0   Foundation                ████████████
Phase 1   Client Onboarding                 █████████
Phase 2   Therapist Onboarding              █████████
Phase 3   Booking Flow                               ████████
Phase 4   Session Management                                 ████████
Phase 5   Video Call                                         ████████████████████
Phase 6   Notes System                                               ████████
Phase 7   Therapist Inbox                            ████████████████
Phase 8   Payments                                   ████████████████████
Phase 9   Support System                    ████████████████
Phase 10  PWA Polish                                                       ██████
```

---

## Integration Map

```
THERAPIST APPROVED (admin action)
  → Profile visible in discovery
  → Stripe Connect + Cal.com already configured

CLIENT BOOKS SESSION
  → Selects type (single / bundle / free)
  → Accepts therapist ToS (if exists)
  → Free session: skip payment, confirm directly
  → Bundle: Stripe Checkout → credits created
  → Single: Stripe Checkout → session activated
  → Auto-create inbox Conversation (therapist ↔ client) if none exists
  → Auto-apply "Patient" tag to conversation

SESSION CONFIRMED (Stripe webhook / free booking)
  → Activate Session
  → Provision LiveKit room (EU region)
  → Generate tokens
  → Confirmation email with join link

JOIN SESSION (/session/:id)
  → Validate token, load LiveKit room
  → Therapist: notes panel available
  → Notes linked to sessionId

SESSION ENDS
  → Session status → completed
  → LiveKit room destroyed
  → Any session-scoped chat wiped
  → Therapist → client profile page (notes visible)
  → Client → /my-sessions

BOOKING CANCELLED
  → Refund if within policy
  → LiveKit room destroyed
  → Cal.com booking cancelled
  → Both participants notified
  → If bundle: credit returned
```

---

## Data Model Overview

```
User
  ├── ClientProfile { intake, timezone }
  └── TherapistProfile {
        bio, specialties, pricing, bundles,
        freeFirstSession (bool),
        termsOfService (text + version),
        stripeAccountId, calUserId,
        status (pending_review | active | rejected)
      }

Session
  ├── therapistId, clientEmail
  ├── type (single | bundle)
  ├── calBookingUid, stripePaymentIntentId
  ├── livekitRoomName
  ├── status, paymentStatus
  └── scheduledAt, durationMinutes

SessionCredit
  ├── clientEmail, therapistId
  ├── totalCredits, usedCredits
  └── stripePaymentIntentId

ClientToSAcceptance
  ├── therapistId, clientEmail
  ├── tosVersion
  └── acceptedAt

ClientNote
  ├── therapistId, clientEmail
  ├── sessionId? (null = general)
  └── body (markdown), deletedAt?

Conversation
  ├── therapistId, clientEmail
  ├── status (open | pending | closed)
  ├── tags Tag[]
  └── Message[]
        └── Attachment[]

Tag
  ├── therapistId
  ├── name, colour
  └── isSystem (Patient / Not Patient)

Notification
  ├── userId, type, body, link
  └── readAt?
```

---

## Effort Summary

| Phase | Description | Hours |
|---|---|---|
| 0 | Foundation (PWA shell, design system, auth) | 35–45h |
| 1 | Client onboarding & therapist discovery | 20–25h |
| 2 | Therapist onboarding & admin approval | 30–35h |
| 3 | Booking flow (ToS + bundles + free session) | 25–30h |
| 4 | Session management | 20–25h |
| 5 | Video call (basic + auto-frame) | 155–215h |
| 6 | Therapist notes system | 25–30h |
| 7 | Therapist inbox (tagged conversations + files) | 40–50h |
| 8 | Payments (Stripe Connect + bundles) | 110–145h |
| 9 | Support system (Chatwoot + Typebot) | 45–65h |
| 10 | Notifications & PWA polish | 25–35h |
| **Total** | | **530–700h** |

**1 senior developer full-time:** 14–18 months
**2 developers (frontend + backend split):** 7–9 months
**Shipping Phase 5.1 only (no auto-frame) first** saves ~60–80h
