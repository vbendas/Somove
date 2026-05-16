---
title: Group Breathwork Classes
description: Feature specification for group session support — breathwork classes with 1 therapist and up to 8 participants
tags:
  - feature
  - group-sessions
  - breathwork
---

# Group Breathwork Classes

## Context

One of Somove's founding therapists facilitates **breathwork group classes** — a format where a single therapist guides up to **8 participants** simultaneously through a structured breathing session. This is fundamentally different from the 1:1 session model and requires dedicated features across booking, video calls, safety, and payments.

**Why this matters:** Group sessions are a high-margin, high-demand format. A single 60-min class at a lower per-person price generates more revenue per hour than individual sessions while making somatic work accessible to clients who can't afford 1:1 rates.

---

## Feature Set

### Booking & Scheduling

#### 1. Group Session Type (Capacity-Based Booking)

A new session format where one timeslot has multiple bookable slots, controlled by a configurable capacity (default: 8 participants + 1 therapist).

- New `session_type` category: `group` (alongside existing `individual`)
- `max_participants` field on session types (default 8)
- Booking slot decrements available capacity in real-time
- Calendar shows remaining spots (e.g. "3 spots left")
- Once full, booking button changes to "Join waitlist"

#### 2. Waitlist

When a group class reaches capacity, interested clients can join a waitlist.

- Auto-notified (email + push) when a spot opens (cancellation, capacity increase)
- Waitlist position visible to client
- First-come-first-served auto-fill, or therapist can manually pick from waitlist
- Waitlist expires when class starts

#### 3. Recurring Class Series

Support for classes that repeat on a schedule (e.g. "Every Tuesday 7pm, 6-week breathwork series").

- Therapist creates a class series: day(s) of week, start date, number of weeks
- Clients can book the full series (at a discount) or individual drop-in sessions
- Series dashboard shows enrollment per session
- Therapist can cancel individual sessions within a series without cancelling the whole series

#### 4. Minimum Enrollment Threshold

Auto-cancel or notify therapist if fewer than the minimum number of participants sign up.

- Therapist sets `min_participants` per class type (e.g. 3)
- If threshold not met by X hours before class (configurable, default 12h), options:
  - Auto-cancel with full refund + notification to enrolled participants
  - Flag therapist to decide manually (keep or cancel)
- Applies to individual drop-in sessions within a series too

---

### Live Session Features

#### 5. Shared Audio Channel

Therapist can play ambient music, breathing cues, or guided instructions to all participants simultaneously.

- Therapist uploads or links audio files (ambient, binaural beats, guided cues)
- Audio plays synchronized to all participants during session
- Therapist controls: play, pause, volume (master), track selection
- Participants hear both the shared audio and each other (balanced mix)
- Audio library stored per therapist, reusable across classes

#### 6. Participant Mute/Unmute Grid

Therapist sees all participants in a grid layout with individual mute/unmute controls.

- Therapist view: participant grid (up to 8 tiles) with individual audio/video toggles
- Default: all participants muted, only therapist speaks
- Therapist can unmute individual participants (e.g. for sharing)
- "Mute all" button for returning to guided instruction
- Participant layout: therapist large, other participants in a collapsible strip

---

### Safety & Monitoring

#### 9. Participant Status Indicators

Each participant can tap a quick reaction visible only to the therapist — critical for breathwork where people may feel overwhelmed.

- Three status options: **OK** (default, green) / **Need attention** (yellow) / **Stop** (red)
- Status appears as a colored border/icon on the participant's tile (therapist view only)
- Participants see a small floating status bar they can tap during the session
- No sound disruption — visual only
- Therapist can quickly identify who needs support without interrupting the class

#### 10. Private Chat to Therapist

Any participant can privately message the therapist during the session without other participants seeing.

- Text-only chat panel (collapsible, doesn't obstruct video)
- Only visible to the sender and the therapist
- Therapist sees participant name + message in a dedicated panel
- Useful for: "I need to step away for a moment", "I'm feeling lightheaded", etc.
- Messages saved post-session for therapist review

#### 11. Emergency Signal

A prominent "I need help" button that alerts the therapist with a visual flash on that participant's tile.

- Always visible, large touch target, red button
- On press: participant's tile flashes red + audio ping to therapist (subtle, not disruptive to class)
- Therapist can immediately address the participant
- Logged in session records for follow-up
- Auto-disables participant's camera/audio if they prefer privacy while recovering

---

### Post-Session

#### 12. Group Check-Out Pulse

A quick post-session mood/energy rating from each participant, visible to therapist for follow-up.

- After class ends, each participant sees a simple 1-5 scale prompt: "How do you feel?"
- Optional short text field for reflections
- Therapist sees aggregated results (average + individual, anonymous or named based on class setting)
- Data stored per participant per session for tracking progress over time

#### 14. Customizable Post-Class Follow-Up

The therapist creates **follow-up templates** they can customize per class type, sent to all participants after the session.

- Therapist builds templates in dashboard: text, links, images, audio files
- Templates are reusable and editable (e.g. "Breathwork Basics - Post Session", "Wim Hof Follow-Up")
- After each class, therapist selects or edits a template
- Auto-appended **"Book your next class"** button with available upcoming sessions
- Sent via email and/or in-app message to all participants
- Therapist can also send a personalized note alongside the template

---

### Business & Management

#### 15. Class Pack / Drop-In Pricing

Clients can buy a single drop-in or a multi-class pack with a remaining balance tracker.

- Therapist sets: drop-in price + pack options (e.g. 5-class pack at 20% discount)
- `group_session_credits` model: tracks total/used/remaining credits per client per therapist
- At booking, system checks for available credits first
- Credits visible on client dashboard
- Therapist sees credits outstanding per client

#### 16. Attendance Tracking

Therapist marks who showed up; no-shows are tracked and can trigger policy enforcement.

- Post-session: therapist marks each participant as attended / no-show / cancelled
- No-shows can trigger: loss of a class credit, warning email, or nothing (configurable policy)
- Attendance history per client
- Aggregated stats: attendance rate per class, no-show rate per client

---

## Impact on Existing Architecture

### Database Changes

New tables and modifications needed:

```
group_sessions
  ├── id
  ├── therapist_id
  ├── session_type_id
  ├── max_participants
  ├── min_participants
  ├── enrolled_count (computed)
  ├── status (scheduled | live | completed | cancelled)
  ├── scheduled_at
  ├── duration_min
  └── series_id (nullable, FK → class_series)

group_session_enrollments
  ├── id
  ├── group_session_id
  ├── client_id
  ├── status (enrolled | waitlisted | cancelled | attended | no_show)
  ├── waitlist_position
  ├── payment_status
  └── enrolled_at

class_series
  ├── id
  ├── therapist_id
  ├── name
  ├── description
  ├── recurrence_rule (jsonb: day of week, interval)
  ├── start_date
  ├── end_date
  ├── total_sessions
  └── status

group_session_credits
  ├── id
  ├── client_id
  ├── therapist_id
  ├── total_credits
  ├── used_credits
  ├── remaining_credits (computed)
  ├── stripe_payment_intent_id
  └── purchased_at

follow_up_templates
  ├── id
  ├── therapist_id
  ├── name
  ├── content (jsonb: text blocks, links, images, audio refs)
  ├── is_default (boolean)
  └── created_at

session_follow_ups
  ├── id
  ├── group_session_id
  ├── template_id
  ├── customized_content (jsonb)
  ├── sent_at
  └── recipient_count
```

### Video Call Modifications

- Grid layout for therapist view (up to 9 tiles: 8 participants + self)
- Shared audio channel requires Daily.co or LiveKit audio mixing
- Private chat channels per participant within a group session room
- Status indicator overlay on participant tiles

### Route Additions

```
(client app)
  /classes                    → Browse available group classes
  /classes/:id                → Class detail + booking
  /class-session/:id          → Group video call (participant view)

(therapist app)
  /dashboard/classes          → Manage group classes + series
  /dashboard/classes/new      → Create class / series
  /dashboard/class-session/:id → Group video call (therapist view)
  /dashboard/follow-ups       → Manage follow-up templates
```

---

## MVP Subset Recommendation

| # | Feature | Priority | Rationale |
|---|---------|----------|-----------|
| 1 | Group Session Type | P0 | Core foundation — nothing works without this |
| 5 | Shared Audio Channel | P0 | Breathwork requires ambient/cue audio |
| 9 | Participant Status Indicators | P0 | Safety — non-negotiable for breathwork |
| 6 | Participant Grid (therapist view) | P0 | Therapist must see all participants |
| 15 | Class Pack / Drop-In Pricing | P1 | Business model support |
| 2 | Waitlist | P1 | Demand management |
| 4 | Minimum Enrollment Threshold | P1 | Protects therapist from unprofitable sessions |
| 14 | Customizable Follow-Up + Next Class | P1 | Retention + therapist personalization |
| 16 | Attendance Tracking | P2 | Operational, can be manual initially |
| 12 | Group Check-Out Pulse | P2 | Nice-to-have, enhances post-session engagement |
| 3 | Recurring Class Series | P2 | Can manage manually with individual classes first |
| 10 | Private Chat to Therapist | P2 | Important but not day-one for breathwork |
| 11 | Emergency Signal | P2 | Enhances safety but status indicators cover the core need |

---

## Sources & Decisions

- Items 7 (Visual Breathing Guide), 8 (Breakout Pairs), 13 (Session Recording), and 17 (Class Templates) were removed from the original feature proposal per product decision
- Feature 14 (Automated Follow-Up) was changed to **Customizable Follow-Up** — the therapist elaborates what will be sent per class type, with an auto-appended "Book next class" button
- Group sessions extend the existing 1:1 model; both coexist on the same platform
