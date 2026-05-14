# Scheduling System — Feature Roadmap

## Overview

Self-hosted Cal.com as the scheduling engine, integrated into Somove via API and webhooks. Clients book sessions through Somove's UI, therapists manage availability through a Somove dashboard backed by Cal.com. When a session is booked, a LiveKit room is automatically provisioned and join links delivered to both participants.

**Stack:** Cal.com (self-hosted, AGPL-3.0) · Cal.com REST API · Cal.com Webhooks · LiveKit (room provisioning) · Next.js API routes · FullCalendar or react-big-calendar (UI)

**Target:** 2 therapists at launch, 10 at beta — single Cal.com instance handles both

---

## Architecture Overview

```
Client books slot
      ↓
Somove booking UI (Cal.com embed or custom UI via API)
      ↓
Cal.com creates booking
      ↓
Cal.com webhook → Somove /api/webhooks/cal
      ↓
Somove creates LiveKit room + generates tokens
      ↓
Confirmation email to client + therapist with join link
      ↓
Session joins → /session/[id] (video call system)
```

---

## Phase 0 — Cal.com Infrastructure

**Goal:** Running, configured Cal.com instance connected to Somove's domain and database.

**Estimated effort:** 15–20 hours

---

### 0.1 Self-Hosting Setup

- [ ] **0.1.1** Provision VPS (can share with LiveKit or separate — recommend separate for isolation)
  - Minimum: 2 vCPU, 4GB RAM, 20GB SSD
  - Providers: Hetzner (~€8/mo), DigitalOcean ($18/mo), Railway
- [ ] **0.1.2** Clone Cal.com repository and configure environment variables
  - `DATABASE_URL` — PostgreSQL connection string
  - `NEXTAUTH_SECRET`, `CALENDSO_ENCRYPTION_KEY`
  - `EMAIL_FROM`, SMTP credentials for transactional emails
- [ ] **0.1.3** Set up PostgreSQL database (managed preferred — Supabase, Neon, or Railway)
- [ ] **0.1.4** Run Cal.com migrations (`yarn db:migrate`)
- [ ] **0.1.5** Configure custom domain (e.g. `cal.somove.com`) with SSL via nginx/Caddy
- [ ] **0.1.6** Set up process manager (PM2 or Docker Compose) for auto-restart
- [ ] **0.1.7** Configure email delivery (Resend, Postmark, or SendGrid — avoid raw SMTP for deliverability)

---

### 0.2 Cal.com Initial Configuration

- [ ] **0.2.1** Create Somove organisation account in Cal.com
- [ ] **0.2.2** Create therapist user accounts (one per therapist)
- [ ] **0.2.3** Create session event type: "Somatic Therapy Session" (60 min, default)
- [ ] **0.2.4** Configure booking questions: name, email, session goals (optional), first time? (yes/no)
- [ ] **0.2.5** Set global buffer time (15 min between sessions — prevents back-to-back burnout)
- [ ] **0.2.6** Configure confirmation and reminder email templates with Somove branding
- [ ] **0.2.7** Generate Cal.com API key for Somove backend integration

---

### 0.3 Webhook Configuration

- [ ] **0.3.1** Register webhook endpoint in Cal.com: `https://somove.com/api/webhooks/cal`
- [ ] **0.3.2** Subscribe to events: `BOOKING_CREATED`, `BOOKING_CANCELLED`, `BOOKING_RESCHEDULED`
- [ ] **0.3.3** Store webhook secret in Somove environment for signature verification
- [ ] **0.3.4** Test webhook delivery with Cal.com's built-in test trigger

---

## Phase 1 — Backend Integration

**Goal:** Somove backend handles Cal.com webhooks, provisions LiveKit rooms, and manages session state.

**Estimated effort:** 25–35 hours

---

### 1.1 Data Model

- [ ] **1.1.1** Design `Session` model:
  ```
  Session {
    id              String   (Somove internal ID)
    calBookingUid   String   (Cal.com booking UID, unique)
    therapistId     String
    clientEmail     String
    clientName      String
    scheduledAt     DateTime
    durationMinutes Int
    status          Enum (scheduled, active, completed, cancelled, rescheduled)
    livekitRoomName String?
    livekitTokenClient  String?
    livekitTokenTherapist String?
    notes           String?
    createdAt       DateTime
    updatedAt       DateTime
  }
  ```
- [ ] **1.1.2** Design `Therapist` model (or extend existing user model):
  ```
  Therapist {
    id            String
    calUserId     String   (Cal.com user ID)
    calUsername   String   (for booking URL construction)
    name          String
    bio           String?
    specialties   String[]
    timezone      String
  }
  ```
- [ ] **1.1.3** Run database migration for new models

---

### 1.2 Webhook Handler

- [ ] **1.2.1** Create `POST /api/webhooks/cal` endpoint
- [ ] **1.2.2** Implement webhook signature verification (HMAC-SHA256 using shared secret) — reject unverified requests
- [ ] **1.2.3** Handle `BOOKING_CREATED`:
  - Parse Cal.com payload (booking UID, attendee, start time, therapist)
  - Create `Session` record in database
  - Provision LiveKit room (call internal room creation service)
  - Generate therapist and client tokens
  - Store tokens on Session record
  - Trigger confirmation email with join links (see 1.4)
- [ ] **1.2.4** Handle `BOOKING_CANCELLED`:
  - Update Session status to `cancelled`
  - Destroy LiveKit room if it exists and session hasn't started
  - Trigger cancellation notification
- [ ] **1.2.5** Handle `BOOKING_RESCHEDULED`:
  - Update Session `scheduledAt` and status
  - Destroy old LiveKit room, provision new one
  - Re-generate tokens with new expiry
  - Trigger rescheduling notification
- [ ] **1.2.6** Return `200 OK` immediately, process async (use background job or `waitUntil` — webhook must respond within 5s)

---

### 1.3 Session API Endpoints

- [ ] **1.3.1** `GET /api/sessions/:id` — fetch session details (authenticated, only therapist or client with matching email)
- [ ] **1.3.2** `GET /api/sessions/:id/join` — return LiveKit join token for authenticated participant
- [ ] **1.3.3** `GET /api/therapists/:id/sessions` — therapist's upcoming sessions (authenticated, therapist only)
- [ ] **1.3.4** `PATCH /api/sessions/:id/status` — mark session as `active` (on join) or `completed` (on end)
- [ ] **1.3.5** `GET /api/sessions/upcoming?email=` — client's upcoming sessions by email (used for client dashboard)

---

### 1.4 Email Notifications

- [ ] **1.4.1** Booking confirmation to client — includes session date/time, therapist name, join link, what to expect
- [ ] **1.4.2** Booking notification to therapist — client name, session time, join link, client notes
- [ ] **1.4.3** 24-hour reminder to both — session details + join link
- [ ] **1.4.4** 15-minute reminder to both — quick nudge with direct join link
- [ ] **1.4.5** Cancellation notification to both
- [ ] **1.4.6** Rescheduling notification with new time to both
- [ ] **1.4.7** Use email provider (Resend recommended — simple API, good deliverability, free tier)
- [ ] **1.4.8** All emails mobile-responsive, Somove branded

---

## Phase 2 — Client-Facing Booking Flow

**Goal:** Clients can discover therapists, view availability, and book sessions entirely within the Somove UI.

**Estimated effort:** 30–40 hours

---

### 2.1 Therapist Discovery Page

- [ ] **2.1.1** `/therapists` — list of available therapists with name, photo, bio, specialties
- [ ] **2.1.2** Therapist profile card component (reusable)
- [ ] **2.1.3** `/therapists/:id` — therapist detail page with full bio, approach, session types offered
- [ ] **2.1.4** "Book a Session" CTA on therapist profile

---

### 2.2 Booking Flow

**Option A — Cal.com embed (faster, 5–8h)**
- [ ] **2.2.1** Embed Cal.com inline booking widget on therapist profile page via `<iframe>` or Cal.com's `@calcom/embed-react` package
- [ ] **2.2.2** Configure embed to match Somove colour palette
- [ ] **2.2.3** Listen for `bookingSuccessful` embed event, redirect to confirmation page

**Option B — Custom UI via Cal.com API (more effort, full control, 20–25h)**
- [ ] **2.2.1** `GET /api/availability?therapistId=&date=` — fetch available slots from Cal.com API
- [ ] **2.2.2** Date picker component — client selects preferred date
- [ ] **2.2.3** Time slot grid component — show available times for selected date (user's local timezone)
- [ ] **2.2.4** Booking form — name, email, optional notes
- [ ] **2.2.5** `POST /api/bookings` — create booking via Cal.com API, return confirmation
- [ ] **2.2.6** Confirmation page — session details, calendar add links (Google, Apple, .ics)

> Recommendation: Start with Option A (embed) to ship fast. Migrate to Option B in a later iteration once booking flow is validated with real users.

---

### 2.3 Client Session Dashboard

- [ ] **2.3.1** `/my-sessions` — client's upcoming and past sessions (fetched by email from 1.3.5)
- [ ] **2.3.2** Upcoming session card — date, time, therapist name, "Join Session" button (active 10 min before start)
- [ ] **2.3.3** "Join Session" button links to `/session/[id]` — enabled only within 10 min window
- [ ] **2.3.4** Past sessions list — date, therapist, duration
- [ ] **2.3.5** Cancel / reschedule link — opens Cal.com reschedule flow (Cal.com handles this natively via booking UID link)

---

## Phase 3 — Therapist Dashboard

**Goal:** Therapists manage their schedule, availability, and upcoming sessions from within Somove.

**Estimated effort:** 30–40 hours

---

### 3.1 Availability Management

- [ ] **3.1.1** Weekly availability editor — therapist sets working hours per day (Mon–Sun)
- [ ] **3.1.2** Date-specific overrides — mark specific days unavailable (holidays, personal days)
- [ ] **3.1.3** Buffer time setting — minimum gap between sessions (default 15 min)
- [ ] **3.1.4** Session duration options — 50 min / 60 min / 90 min
- [ ] **3.1.5** Advance booking window — how far ahead clients can book (e.g. max 8 weeks)
- [ ] **3.1.6** Sync availability changes to Cal.com via API (`PATCH /v1/schedules/:id`)

---

### 3.2 Calendar View

- [ ] **3.2.1** Install FullCalendar (`@fullcalendar/react`, `@fullcalendar/daygrid`, `@fullcalendar/timegrid`)
- [ ] **3.2.2** Week view — therapist's default view showing booked sessions as blocks
- [ ] **3.2.3** Day view — detailed view for a single day
- [ ] **3.2.4** Session block shows client name, time, status colour (scheduled / active / completed / cancelled)
- [ ] **3.2.5** Click session block → session detail side panel
- [ ] **3.2.6** Fetch sessions from `GET /api/therapists/:id/sessions` and map to calendar events
- [ ] **3.2.7** Today highlight, navigate forward/back by week/month

---

### 3.3 Session Detail Panel

- [ ] **3.3.1** Client name, email, booking date
- [ ] **3.3.2** Client's pre-session notes (submitted in booking form)
- [ ] **3.3.3** "Join Session" button (active 10 min before start, links to `/session/[id]`)
- [ ] **3.3.4** Session status indicator
- [ ] **3.3.5** Private therapist notes field (saved to Somove, not visible to client)
- [ ] **3.3.6** Cancel session action (calls Cal.com API, triggers webhook flow)

---

### 3.4 Google Calendar Sync (Optional — Phase 3.4)

- [ ] **3.4.1** OAuth flow to connect therapist's Google Calendar
- [ ] **3.4.2** Cal.com has native Google Calendar integration — expose the connect flow in Somove settings
- [ ] **3.4.3** Sessions appear in therapist's personal Google Calendar automatically once connected
- [ ] **3.4.4** Two-way sync: events blocked in Google Calendar mark as unavailable in Cal.com

---

## Infrastructure Sizing

| Stage | Therapists | Sessions/week | Cal.com Hosting | Cost |
|---|---|---|---|---|
| Launch | 2 | ~20 | Shared $8/mo VPS | ~$8/mo |
| Beta | 10 | ~100 | Dedicated $18/mo VPS | ~$18/mo |
| Growth | 50+ | ~500 | $40/mo VPS or Railway | ~$40/mo |

Cal.com is a Next.js app — a single $18/mo server handles hundreds of concurrent users easily at this scale.

---

## Integration with Video Call System

The scheduling and video call systems connect at one point: the webhook handler (1.2.3).

```
Booking created (Cal.com) 
      → webhook fires 
      → Somove creates Session record 
      → Somove provisions LiveKit room 
      → tokens stored on Session 
      → join link in confirmation email points to /session/[id]
      → /session/[id] reads Session, validates token, enters call
```

No other coupling. The two systems are independent and can be built and deployed separately.

---

## Decisions (Resolved)

| Decision | Answer |
|---|---|
| Client authentication | Somove account required — frictionless (Google, Apple, magic link) |
| Therapist profiles | Managed in Somove; Cal.com is the backend scheduling engine only |
| Consent/ToS | Each therapist writes their own ToS, shown and accepted during booking. Somove default terms apply if therapist has none |
| HIPAA | Not in scope — Europe only |
| Therapist booking | Clients book any available therapist |
| Bundle bookings | First session booked via Cal.com; remaining sessions use credits (no new Cal.com booking per credit) |
| Data residency | All scheduling data EU-hosted |

---

## Therapist Terms of Service — Booking Flow Addition

- [ ] **ToS.1** Therapist writes/edits their ToS in `/dashboard/settings` — plain text, version-stamped on each save
- [ ] **ToS.2** If therapist has no ToS: Somove default platform terms shown at booking (always shown regardless)
- [ ] **ToS.3** Booking screen added between time selection and payment:
  - ToS rendered in scrollable container
  - "I have read and accept these terms" checkbox — required to proceed
- [ ] **ToS.4** On acceptance: create `ClientToSAcceptance { therapistId, clientEmail, tosVersion, acceptedAt }`
- [ ] **ToS.5** ToS update by therapist creates new version — existing client acceptances remain valid; new bookings require re-acceptance
