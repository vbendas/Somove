---
title: Group Sessions Roadmap
description: Development roadmap for group session support — breathwork classes, group booking, safety monitoring, and class management
tags:
  - roadmap
  - group-sessions
  - breathwork
---

# Group Sessions Roadmap

## Overview

This roadmap covers the development of **group session support** for Somove, enabling therapists to facilitate classes (e.g. breathwork) with up to 8 participants simultaneously. See [[Group Breathwork Classes]] for the full feature specification.

**Scope:** Builds on top of the existing platform (booking, video, payments). Assumes Phase 0–4 from the [[Master Platform Roadmap]] are complete.

**Total estimated effort:** 180–240 hours
**Recommended team:** 2 developers (frontend + backend) for 5–6 weeks
**Or:** 1 senior developer for 9–12 weeks

---

## Phase G0 — Data Model & Infrastructure

**Goal:** Extend the database schema and API to support group sessions alongside individual sessions.

**Estimated effort:** 15–20 hours
**Dependency:** [[Master Platform Roadmap]] Phase 0 complete.

### Tasks

- [ ] G0.1 Create `group_sessions` table
- [ ] G0.2 Create `group_session_enrollments` table
- [ ] G0.3 Create `class_series` table
- [ ] G0.4 Create `group_session_credits` table
- [ ] G0.5 Create `follow_up_templates` table
- [ ] G0.6 Create `session_follow_ups` table
- [ ] G0.7 Extend `session_types` with `format` column (`individual` | `group`) and `max_participants`, `min_participants`
- [ ] G0.8 RLS policies: therapist manages own group sessions; client enrolls in own enrollments only
- [ ] G0.9 API endpoints for group session CRUD (therapist)
- [ ] G0.10 API endpoints for enrollment (client): enroll, cancel, join waitlist

---

## Phase G1 — Group Session Booking & Display

**Goal:** Clients can browse, book, and manage group class enrollments. Therapists can create and manage classes.

**Estimated effort:** 30–40 hours
**Dependency:** Phase G0.

### G1.1 Therapist — Class Management

- [ ] G1.1.1 `/dashboard/classes` — list of group classes (upcoming + past)
- [ ] G1.1.2 `/dashboard/classes/new` — create a single class or recurring series
  - Session type selection (if multiple group types)
  - Date, time, duration
  - Max/min participants
  - Pricing (drop-in price, pack options)
  - Audio library selection (for shared audio channel — links to G2.1)
- [ ] G1.1.3 Edit class details (before enrollment starts)
- [ ] G1.1.4 Cancel class → auto-refund enrolled participants + notification
- [ ] G1.1.5 Class detail view: enrolled participants list, spots remaining, waitlist

### G1.2 Client — Class Discovery & Booking

- [ ] G1.2.1 `/classes` — browse available group classes
  - Filter by therapist, date range, class type
  - Class card: therapist name, class name, date/time, spots remaining, price
- [ ] G1.2.2 `/classes/:id` — class detail page
  - Therapist info, class description, date/time, price
  - Remaining spots indicator
  - "Book this class" / "Join waitlist" CTA
  - Pack purchase option if available
- [ ] G1.2.3 Booking flow:
  - Select: drop-in or use existing pack credit
  - Stripe Checkout for drop-in (or credit deduction)
  - Confirmation with calendar add links
- [ ] G1.2.4 Waitlist flow:
  - Join waitlist → position shown
  - Auto-notification on spot opening → 24h to confirm before passing to next
- [ ] G1.2.5 `/my-sessions` — add "Group Classes" tab alongside individual sessions

### G1.3 Minimum Enrollment Threshold

- [ ] G1.3.1 Background job (runs X hours before class): check enrollment vs `min_participants`
- [ ] G1.3.2 If below threshold: notify therapist to decide (keep or cancel)
- [ ] G1.3.3 Therapist decision UI: "Keep class" or "Cancel & refund"
- [ ] G1.3.4 Auto-cancel option: if therapist doesn't respond within Y hours, auto-cancel with refunds

### G1.4 Class Pack / Drop-In Pricing

- [ ] G1.4.1 Therapist sets pack options on class creation (e.g. 5-class pack at 20% off)
- [ ] G1.4.2 `group_session_credits` model: purchase creates credit record
- [ ] G1.4.3 At booking: check for available credits → deduct if found, skip Stripe
- [ ] G1.4.4 Client sees remaining credits on class detail page and `/my-sessions`
- [ ] G1.4.5 Therapist sees credits outstanding per client in enrollment list

---

## Phase G2 — Group Video Call

**Goal:** Group video call with therapist controls, shared audio, and safety indicators.

**Estimated effort:** 60–80 hours
**Dependency:** Phase G1. [[Video Call Roadmap]] Phase 1 complete (base video infrastructure).

### G2.1 Shared Audio Channel

- [ ] G2.1.1 Therapist audio library: upload/manage ambient tracks, breathing cues
  - Supported formats: MP3, WAV, OGG
  - Stored in Supabase Storage (EU bucket)
- [ ] G2.1.2 During session: therapist selects track + presses play
  - Audio streams to all participants synchronously
  - Master volume control (therapist only)
  - Play/pause/stop controls
- [ ] G2.1.3 Audio mix: participants hear shared audio + other participants (balanced)
- [ ] G2.1.4 Fallback: if sync fails, each participant gets a direct stream with slight delay

### G2.2 Participant Grid (Therapist View)

- [ ] G2.2.1 Grid layout: up to 9 tiles (8 participants + therapist self-view)
- [ ] G2.2.2 Individual mute/unmute toggle per participant tile
- [ ] G2.2.3 Individual camera on/off toggle per participant tile
- [ ] G2.2.4 "Mute all" button (returns to guided instruction mode)
- [ ] G2.2.5 Participant name label on each tile
- [ ] G2.2.6 Tile reordering: drag to rearrange priority

### G2.3 Participant View

- [ ] G2.3.1 Therapist large (main video), participants in a collapsible strip at bottom
- [ ] G2.3.2 Expand/collapse participant strip
- [ ] G2.3.3 Minimal controls: mute self, camera toggle, end call

### G2.4 Participant Status Indicators

- [ ] G2.4.1 Participant floating status bar: **OK** (green) / **Need attention** (yellow) / **Stop** (red)
- [ ] G2.4.2 Default: OK (green). One tap to change status
- [ ] G2.4.3 Therapist view: colored border/icon on participant tile reflecting status
- [ ] G2.4.4 Therapist gets subtle notification when status changes to yellow or red
- [ ] G2.4.5 Status resets to OK on session start

### G2.5 Emergency Signal

- [ ] G2.5.1 Red "I need help" button — always visible, large touch target
- [ ] G2.5.2 On press: participant tile flashes red on therapist view + subtle audio ping
- [ ] G2.5.3 Therapist can address immediately (unmute participant, speak to them)
- [ ] G2.5.4 Logged in session record for post-session follow-up

### G2.6 Private Chat (Participant ↔ Therapist)

- [ ] G2.6.1 Collapsible chat panel on participant side (doesn't obstruct video)
- [ ] G2.6.2 Messages visible only to sender + therapist
- [ ] G2.6.3 Therapist sees dedicated panel with messages grouped by participant
- [ ] G2.6.4 Messages saved post-session for therapist review

### G2.7 Attendance Tracking

- [ ] G2.7.1 Post-session: therapist marks each enrollment as `attended` / `no_show` / `cancelled`
- [ ] G2.7.2 No-show policy: configurable per therapist (loss of credit / warning / none)
- [ ] G2.7.3 Attendance stats on class management dashboard

---

## Phase G3 — Post-Session & Follow-Up

**Goal:** Customizable follow-up messages sent to participants after class.

**Estimated effort:** 25–30 hours
**Dependency:** Phase G2.

### G3.1 Follow-Up Templates

- [ ] G3.1.1 `/dashboard/follow-ups` — template management
- [ ] G3.1.2 Create/edit template:
  - Rich text content (paragraphs, links)
  - Attach images or audio files
  - Save with name (e.g. "Breathwork Basics - Week 1")
  - Set as default for a class type
- [ ] G3.1.3 Template library: list, search, duplicate, delete

### G3.2 Post-Class Follow-Up Flow

- [ ] G3.2.1 After class ends: therapist prompted to send follow-up
  - Select template (auto-selects default if set)
  - Edit/customize content before sending
  - Add personal note
- [ ] G3.2.2 Auto-appended "Book your next class" section:
  - Shows upcoming available classes from same therapist
  - Direct booking links
- [ ] G3.2.3 Send via email (Resend) and in-app message
- [ ] G3.2.4 Delivery tracking: sent count, opened count

### G3.3 Group Check-Out Pulse

- [ ] G3.3.1 After class ends, participant sees 1-5 scale: "How do you feel?"
- [ ] G3.3.2 Optional short text field for reflections
- [ ] G3.3.3 Therapist sees aggregated results: average rating + individual responses
- [ ] G3.3.4 Data stored per participant per session for progress tracking

---

## Phase G4 — Recurring Series & Polish

**Goal:** Recurring class series, notifications, and overall polish.

**Estimated effort:** 50–70 hours
**Dependency:** Phase G3.

### G4.1 Recurring Class Series

- [ ] G4.1.1 Create series: select day(s) of week, start date, number of occurrences
- [ ] G4.1.2 Series detail: list all sessions with enrollment count per session
- [ ] G4.1.3 Client booking options: full series (discounted) or individual drop-in
- [ ] G4.1.4 Cancel individual session within series (partial refund if series booking)
- [ ] G4.1.5 Cancel entire series (refund for remaining sessions)
- [ ] G4.1.6 Series completion tracking: sessions attended vs total

### G4.2 Notifications

- [ ] G4.2.1 Email: booking confirmed, waitlist spot opened, class cancelled, follow-up received
- [ ] G4.2.2 Push (if enabled): class reminder 24h, reminder 15min, waitlist notification
- [ ] G4.2.3 Deep-link from notification to class detail or video call

### G4.3 Therapist Dashboard Enhancements

- [ ] G4.3.1 Dashboard: today's classes alongside individual sessions
- [ ] G4.3.2 Earnings: group class revenue separate from individual sessions
- [ ] G4.3.3 Client profile: group class attendance history alongside individual sessions
- [ ] G4.3.4 Analytics: attendance rates, no-show rates, most popular classes

---

## Build Sequence

```
Phase G0  Data Model & API                      ████████
Phase G1  Booking & Display                      ████████████████████
Phase G2  Group Video Call                       ████████████████████████████████████
Phase G3  Post-Session & Follow-Up               ██████████████
Phase G4  Recurring Series & Polish              ████████████████████████████████
```

---

## Effort Summary

| Phase | Description | Hours | Priority |
|-------|-------------|-------|----------|
| G0 | Data model & infrastructure | 15–20h | P0 |
| G1 | Booking, display, pricing, enrollment | 30–40h | P0 |
| G2 | Group video call + safety features | 60–80h | P0 |
| G3 | Post-session follow-up + check-out pulse | 25–30h | P1 |
| G4 | Recurring series + notifications + polish | 50–70h | P2 |
| **Total** | | **180–240h** | |

### Recommended Build Order

**First iteration (MVP, ~105–140h):** G0 + G1 + G2.1 + G2.2 + G2.3 + G2.4
Covers the essential loop: create class → clients book → group video with audio and safety indicators.

**Second iteration (+55–70h):** G2.5 + G2.6 + G2.7 + G3
Adds emergency signal, private chat, attendance, and customizable follow-ups.

**Third iteration (+20–30h):** G4.1 + G4.2 + G4.3
Recurring series and polish.

---

## Integration with Existing Roadmaps

| Area | Integration Point |
|------|-------------------|
| [[Master Platform Roadmap\|Master Platform Roadmap]] Phase 3 | Booking flow extended for group sessions |
| [[Video Call Roadmap]] Phase 1 | Video infrastructure shared; group layout is additive |
| [[Payment System Roadmap\|Payment System Roadmap]] | Stripe Checkout for drop-in; credit system for packs |
| [[Scheduling System Roadmap\|Scheduling System Roadmap]] | Cal.com availability for group time slots |
| [[Chat and Support Roadmap\|Chat and Support Roadmap]] | Private chat during sessions uses same Supabase Realtime infra |

---

## Decisions Log

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Group sessions coexist with individual sessions | Same platform, same therapist, different format |
| 2 | Max 8 participants default, configurable | Breathwork class size; can be adjusted per class type |
| 3 | No breakout rooms (removed) | Adds complexity without clear value for breathwork format |
| 4 | No visual breathing guide (removed) | Therapist verbally guides; visual sync adds high technical cost |
| 5 | No session recording (removed) | Aligned with platform decision — permanently out of scope |
| 6 | No class templates (removed) | Redundant with follow-up templates and class series setup |
| 7 | Customizable follow-ups over automated | Therapist personalization is core to the brand; generic messages feel impersonal |
| 8 | Class packs modeled after bundle credits | Same mental model, extended for group context |
