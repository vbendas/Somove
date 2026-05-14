# Chat & Support System — Feature Roadmap

## Overview

Three distinct communication layers, each with the right tool for its context:

1. **Therapist Inbox (client ↔ therapist)** — built natively in Somove. A structured inbox/ticket system per therapist with tags, file attachments, and real-time delivery. Clients (patients and prospects) can message their therapist at any time. Session-scoped chat messages are deleted when a session ends; the ongoing inbox conversation persists.
2. **Somove support chat** — Chatwoot embeddable widget as a corner chat bubble. Typebot handles first-contact triage using Mistral Small 4 via OpenRouter (EU data retention) and escalates to a human agent.
3. **Ticket system** — Chatwoot with two separate inboxes (clients and therapists). Simple form submission from within Somove; Somove's support team works inside Chatwoot's admin interface.

**Stack:** Supabase Realtime · Supabase Storage (EU bucket) · Chatwoot (self-hosted, AGPL-3.0) · Typebot (self-hosted, AGPL-3.0) · OpenRouter → Mistral Small 4

**UI principle:** The therapist inbox is the only communication layer built natively in Somove's UI. Support chat uses a standard corner widget. Ticket submission is a simple form. Chatwoot's admin interface is internal — clients and therapists never see it.

**Data residency:** All data (messages, attachments, conversation history) stored in EU-hosted Supabase (Frankfurt region). Typebot routes AI requests through OpenRouter configured for EU data retention.

---

## What Each User Sees

**Client:**
- Inbox: message thread(s) with their therapist(s) — native Somove UI, supports file attachments
- Chat bubble in the corner → Typebot triage (Mistral Small 4) → Chatwoot human agent for Somove support
- "Get help" form for non-urgent platform issues (creates Chatwoot ticket)

**Therapist:**
- Structured inbox with all client and prospect conversations, tagged (Patient / Not Patient / custom)
- Filterable queue: Open · Pending · Closed · by Tag
- File attachments in both directions
- "Contact Somove support" button → ticket submission form
- Email notification when support ticket is updated

**Somove support team:**
- Chatwoot admin inbox (internal — clients/therapists never see this)
- All platform support conversations and tickets managed from one place

---

## Architecture Overview

```
Client ↔ Therapist Chat:
  Somove UI → Supabase Realtime channel (per conversation)
           → Messages stored in PostgreSQL
           → Push notifications on new message

Support Chat:
  Corner widget → Typebot flow (FAQ / triage)
               → Resolved automatically (common questions)
               → Escalated to Chatwoot agent (complex issues)

Ticket System:
  Somove form → POST /api/support/ticket
             → Chatwoot conversation created via API
             → Email confirmation to submitter
             → Somove team handles in Chatwoot inbox
```

---

## Phase 0 — Chatwoot Infrastructure

**Goal:** Running Chatwoot instance configured with Somove branding, two inboxes, and email delivery.

**Estimated effort:** 10–15 hours

---

### 0.1 Self-Hosting Setup

- [ ] **0.1.1** Provision VPS: 2 vCPU, 4GB RAM minimum (Chatwoot recommendation)
  - Can share with Cal.com server or separate — recommend separate
  - Hetzner (~€8/mo) or DigitalOcean ($18/mo)
- [ ] **0.1.2** Install Chatwoot via Docker Compose (official supported method)
- [ ] **0.1.3** Configure PostgreSQL and Redis (Chatwoot requires both)
- [ ] **0.1.4** Set custom domain: `support.somove.com` with SSL via Caddy or nginx
- [ ] **0.1.5** Configure SMTP for outbound emails (Resend or Postmark — same provider as rest of Somove)
- [ ] **0.1.6** Set up automated backups for Chatwoot PostgreSQL database

---

### 0.2 Chatwoot Initial Configuration

- [ ] **0.2.1** Create Somove organisation account in Chatwoot
- [ ] **0.2.2** Add branding: Somove logo, brand colour, support email address
- [ ] **0.2.3** Create two inboxes:
  - `Client Support` — for clients contacting Somove
  - `Therapist Support` — for therapists contacting Somove
- [ ] **0.2.4** Create support team agents (Somove staff accounts)
- [ ] **0.2.5** Assign agents to inboxes
- [ ] **0.2.6** Configure auto-assignment rules (round-robin for now)
- [ ] **0.2.7** Set up conversation labels: `billing`, `technical`, `session-issue`, `onboarding`, `urgent`
- [ ] **0.2.8** Configure business hours and away message
- [ ] **0.2.9** Generate Chatwoot API key for Somove backend integration

---

## Phase 1 — Therapist Inbox (Client ↔ Therapist)

**Goal:** Each therapist has a structured, tagged inbox for all client and prospect communication. Supports file attachments, real-time delivery, and CRM-style queue management. Session-scoped chat (if any) is deleted when a session ends; inbox conversations persist independently.

**Estimated effort:** 40–50 hours

---

### 1.1 Data Model

- [ ] **1.1.1** `Conversation`:
  ```
  Conversation {
    id            String
    therapistId   String
    clientEmail   String
    clientName    String
    status        Enum (open, pending, closed)
    tags          Tag[]
    lastMessageAt DateTime?
    sessionId     String?   (optional — for session-linked context)
    createdAt     DateTime
  }
  ```
- [ ] **1.1.2** `Message`:
  ```
  Message {
    id              String
    conversationId  String
    senderRole      Enum (client, therapist)
    senderId        String
    body            String
    attachments     Attachment[]
    readAt          DateTime?
    createdAt       DateTime
  }
  ```
- [ ] **1.1.3** `Attachment`:
  ```
  Attachment {
    id        String
    messageId String
    fileUrl   String   (Supabase Storage, EU bucket — signed URL)
    fileName  String
    fileSize  Int
    mimeType  String
  }
  ```
- [ ] **1.1.4** `Tag`:
  ```
  Tag {
    id          String
    therapistId String
    name        String
    colour      String
    isSystem    Boolean  (Patient / Not Patient = true, not deletable)
  }
  ```
- [ ] **1.1.5** Seed system tags for each new therapist: `Patient` (green), `Not Patient` (grey)
- [ ] **1.1.6** Auto-apply `Patient` tag when first session booking confirmed for that client-therapist pair
- [ ] **1.1.7** Run database migration, index `conversationId + createdAt`, `therapistId`, `clientEmail`

---

### 1.2 Tag Management

- [ ] **1.2.1** Therapist creates/edits custom tags from `/dashboard/settings` (name + colour picker)
- [ ] **1.2.2** Apply multiple tags to any conversation
- [ ] **1.2.3** System tags `Patient` / `Not Patient` cannot be deleted or renamed
- [ ] **1.2.4** Deleting a custom tag removes it from all conversations (confirmation required)

---

### 1.3 File Attachments

- [ ] **1.3.1** Supabase Storage bucket: `conversation-attachments`, EU region (Frankfurt), private
- [ ] **1.3.2** Allowed types: images (JPEG, PNG, WebP), PDF, DOCX, common document formats
- [ ] **1.3.3** Max file size: 10MB per file
- [ ] **1.3.4** Upload via paperclip button in message input → stored in Supabase Storage → URL saved on `Attachment`
- [ ] **1.3.5** Image: inline thumbnail in message thread, tap to view full size
- [ ] **1.3.6** Document: file icon + name + size + download link
- [ ] **1.3.7** Signed URLs for file access (expire 1h) — no public bucket access

---

### 1.4 Supabase Realtime Setup

- [ ] **1.4.1** Enable Supabase Realtime on `messages` table
- [ ] **1.4.2** RLS policies:
  - Therapist reads/writes messages in their own conversations only
  - Client reads/writes messages in conversations matching their email only
  - No cross-conversation access
- [ ] **1.4.3** Subscribe to channel `conversation:{id}` on frontend using `supabase.channel()`
- [ ] **1.4.4** Unsubscribe on component unmount to prevent memory leaks

---

### 1.5 API Endpoints

- [ ] **1.5.1** `GET /api/conversations` — list conversations
  - Therapist: all their conversations, supports `?status=` and `?tag=` filters
  - Client: their conversations by email
- [ ] **1.5.2** `POST /api/conversations` — create conversation
  - Auto-create on first booking confirmation (link to session)
  - Prevent duplicates: one active conversation per therapist-client pair
  - Client can also initiate before booking (prospect messaging)
- [ ] **1.5.3** `GET /api/conversations/:id/messages` — paginated history (50 per page, cursor-based)
- [ ] **1.5.4** `POST /api/conversations/:id/messages` — send message (text body + optional attachment)
- [ ] **1.5.5** `PATCH /api/conversations/:id` — update status (open/pending/closed) or tags (therapist only)
- [ ] **1.5.6** `PATCH /api/conversations/:id/read` — mark messages as read
- [ ] **1.5.7** `POST /api/conversations/:id/attachments` — upload file → Supabase Storage → return signed URL

---

### 1.6 Therapist Inbox UI

- [ ] **1.6.1** `/dashboard/inbox` — split layout (desktop: list + thread; mobile: list → thread full-screen)
- [ ] **1.6.2** `ConversationList` (left panel):
  - Client name, last message preview, timestamp, tag chips, unread indicator
  - Filter bar: All · Open · Pending · Closed · [custom tags]
  - Search by client name or message content
  - Sorted by `lastMessageAt` descending
- [ ] **1.6.3** `ConversationThread` (right panel / full screen mobile):
  - Message bubbles, date separators
  - File attachment previews inline (image thumbnails, doc icons)
  - Tag chips at top, editable (click to add/remove)
  - Status toggle (Open / Pending / Closed)
  - Message input + paperclip (file attach) + send
- [ ] **1.6.4** Optimistic updates — message appears instantly on send
- [ ] **1.6.5** Unread count badge on Inbox nav item (total across all conversations)

---

### 1.7 Client Inbox UI

- [ ] **1.7.1** `/inbox` — client's conversations (typically one per therapist)
- [ ] **1.7.2** Simple thread view: message bubbles + file attachment previews
- [ ] **1.7.3** Text input + paperclip (file attach) + send
- [ ] **1.7.4** "Message [therapist name]" on therapist profile creates conversation if none exists
- [ ] **1.7.5** Unread badge on Inbox tab in client bottom nav

---

### 1.8 Notifications

- [ ] **1.8.1** Email notification on new message when recipient is offline (debounced 15 min per conversation)
- [ ] **1.8.2** Browser push notification if permission granted (Phase 10)
- [ ] **1.8.3** In-app badge clears when conversation is opened

---

## Phase 2 — Support Chat Widget + Chatbot

**Goal:** Clients and therapists can get help via a corner chat bubble backed by a Typebot triage flow that escalates to a Chatwoot agent.

**Estimated effort:** 20–30 hours

---

### 2.1 Chatwoot Widget Embed

- [ ] **2.1.1** Add Chatwoot widget script to Next.js `_document` or layout component
  ```js
  window.chatwootSettings = { hideMessageBubble: false, position: 'right', locale: 'en' }
  ```
- [ ] **2.1.2** Configure widget to use `Client Support` inbox by default
- [ ] **2.1.3** Pass user identity to widget when user is authenticated:
  ```js
  window.$chatwoot.setUser(userId, { name, email })
  ```
  — pre-fills the chat, avoids asking for name/email again
- [ ] **2.1.4** Style widget to match Somove brand colour (Chatwoot supports custom colour)
- [ ] **2.1.5** Hide widget on the `/session/[id]` video call page (no interruptions during sessions)

---

### 2.2 Typebot Infrastructure

- [ ] **2.2.1** Provision Typebot (same VPS as Chatwoot or separate — ~1GB RAM sufficient)
- [ ] **2.2.2** Set custom domain: `bot.somove.com`
- [ ] **2.2.3** Configure SMTP for Typebot
- [ ] **2.2.4** Generate Typebot API credentials
- [ ] **2.2.5** Configure OpenRouter integration in Typebot:
  - Provider: OpenRouter
  - Model: `mistralai/mistral-small` (Mistral Small 4)
  - EU data retention: enabled in OpenRouter account settings
  - Used for freeform message understanding and intelligent fallback responses

---

### 2.3 Typebot Flow — Client Triage

- [ ] **2.3.1** Build "Client Support" Typebot flow:
  ```
  "Hi, I'm Somove's support assistant. What can I help you with?"
    → Booking & scheduling issue
    → Payment or billing question
    → Technical problem (video call, camera, etc.)
    → Question about somatic therapy
    → Something else
  ```
- [ ] **2.3.2** Booking & scheduling branch:
  - "Have you checked your confirmation email for the session link?" (Yes/No)
  - If No → send them to `/my-sessions`
  - If Yes, still having issue → escalate to Chatwoot
- [ ] **2.3.3** Payment/billing branch:
  - Common answers: refund policy, pricing, invoice requests
  - Unresolved → escalate to Chatwoot with context
- [ ] **2.3.4** Technical branch:
  - Camera issues → link to browser permissions guide
  - Video call not loading → troubleshooting steps
  - Unresolved → escalate to Chatwoot
- [ ] **2.3.5** Escalation action: use Chatwoot API to create conversation, pass transcript as first message so agent has full context before responding
- [ ] **2.3.6** Freeform input: Mistral Small 4 (via OpenRouter) attempts to understand and answer from Somove's FAQ context before escalating. If confidence is low → escalate to Chatwoot agent with full transcript

---

### 2.4 Typebot Flow — Therapist Triage

- [ ] **2.4.1** Build separate "Therapist Support" Typebot flow:
  ```
  "Hi [name], what can we help you with?"
    → Payment or payout question
    → Client management issue
    → Technical problem
    → Platform feedback or feature request
    → Urgent issue
  ```
- [ ] **2.4.2** Urgent issue → skip Typebot entirely, create high-priority Chatwoot ticket immediately
- [ ] **2.4.3** Feature request branch → collect description, log to Chatwoot with label `feedback` (no human needed immediately)
- [ ] **2.4.4** All other branches → triage questions then escalate with context if unresolved

---

### 2.5 Connecting Typebot to Chatwoot Widget

- [ ] **2.5.1** Embed Typebot as the first screen inside Chatwoot's pre-chat widget flow
- [ ] **2.5.2** Alternatively: open Typebot as a modal on "Get Help" click, only open Chatwoot when Typebot escalates
- [ ] **2.5.3** Test handoff: agent receives conversation with full Typebot transcript attached
- [ ] **2.5.4** Validate that user identity (name, email) carries through from Typebot to Chatwoot agent

---

## Phase 3 — Ticket System

**Goal:** Users can submit non-urgent support tickets from within Somove. Somove's team manages them in Chatwoot's inbox.

**Estimated effort:** 15–20 hours

---

### 3.1 Ticket Submission Form — Client

- [ ] **3.1.1** "Get Help" or "Contact Support" link in client navigation and footer
- [ ] **3.1.2** Simple form:
  ```
  Category (dropdown): Booking · Payment · Technical · Other
  Subject (text, max 100 chars)
  Description (textarea, max 1000 chars)
  Attach screenshot (optional, single image)
  ```
- [ ] **3.1.3** `POST /api/support/ticket` — create ticket
  - Identify user from session (auth) or ask for email if not logged in
  - Call Chatwoot API: `POST /api/v1/accounts/{id}/conversations`
  - Set inbox to `Client Support`
  - Attach category as label
  - Return ticket reference number (Chatwoot conversation ID)
- [ ] **3.1.4** Confirmation screen: "Your request has been submitted. Reference: #1234. We'll reply to your email within 24 hours."
- [ ] **3.1.5** Email confirmation to client with reference number

---

### 3.2 Ticket Submission Form — Therapist

- [ ] **3.2.1** "Contact Somove Support" button in therapist dashboard settings
- [ ] **3.2.2** Form (same structure as client, different categories):
  ```
  Category: Payout issue · Client issue · Technical problem · Feature request · Urgent
  Subject
  Description
  Attach screenshot (optional)
  ```
- [ ] **3.2.3** Same API endpoint `POST /api/support/ticket` with `{ role: 'therapist' }`
  - Route to `Therapist Support` inbox in Chatwoot
  - `Urgent` category → set high priority flag in Chatwoot
- [ ] **3.2.4** Confirmation with reference number

---

### 3.3 Ticket Status Tracking

- [ ] **3.3.1** Simple status page: `GET /api/support/ticket/:id` — returns status from Chatwoot API
  - Statuses: `open`, `pending`, `resolved`
- [ ] **3.3.2** Link in confirmation email: "Check the status of your request" → `/support/ticket/{id}`
- [ ] **3.3.3** Email notification to submitter when ticket is resolved (Chatwoot webhook → Somove → email)
- [ ] **3.3.4** No need for a full ticket dashboard in Somove — email is sufficient at this scale

---

## Phase 4 — Polish & Notifications Consolidation

**Goal:** Ensure notifications across all three communication layers are coherent and non-spammy.

**Estimated effort:** 10–15 hours

---

### 4.1 Notification Preferences

- [ ] **4.1.1** User notification settings page:
  - New message from therapist/client (email: on/off, push: on/off)
  - Support ticket update (email: always on — no toggle, too important)
- [ ] **4.2.2** Store preferences in user profile in DB
- [ ] **4.1.3** Respect preferences in all notification-sending paths

---

### 4.2 In-App Notification Centre

- [ ] **4.2.1** Bell icon in top navigation with unread count badge
- [ ] **4.2.2** Dropdown showing recent notifications:
  - New message from [name]
  - Your support ticket #1234 has been resolved
- [ ] **4.2.3** Mark all as read action
- [ ] **4.2.4** Click notification → navigate to relevant page (conversation or ticket status)
- [ ] **4.2.5** Notification records stored in DB with `readAt`, cleaned up after 30 days

---

## Effort Summary

| Phase | Description | Hours |
|---|---|---|
| 0 | Chatwoot infrastructure | 10–15h |
| 1 | Client ↔ Therapist private chat | 35–45h |
| 2 | Support chat widget + Typebot chatbot | 20–30h |
| 3 | Ticket system | 15–20h |
| 4 | Polish & notification consolidation | 10–15h |
| **Total** | | **90–125h** |

---

## Infrastructure Sizing

| Tool | Hosting | Cost |
|---|---|---|
| Chatwoot | Shared VPS (2 vCPU / 4GB) | ~€8–18/mo |
| Typebot | Same VPS or separate (1GB RAM) | ~€0–8/mo |
| Supabase Realtime | Supabase free tier (up to 200 concurrent) | $0 at launch |

At 2–10 therapists, a single €18/mo VPS running both Chatwoot and Typebot is more than sufficient.

---

## Integration Points with Other Systems

| System | Integration |
|---|---|
| Scheduling | Auto-create Conversation when session is booked (link session to conversation) |
| Video Call | Link "Message your therapist" from post-session screen |
| Payments | Billing-related Chatwoot tickets automatically labelled `billing` |

---

## Decisions (Resolved)

| Decision | Answer |
|---|---|
| Client can message before booking | Yes — prospects can contact therapist directly |
| Message history retention | Session-scoped chat deleted when session ends. Inbox conversations persist |
| File attachments | Yes — both sides. Images + documents, 10MB limit, EU Supabase Storage |
| GDPR / data residency | All data in EU (Supabase Frankfurt). Attachments in EU Supabase Storage bucket |
| Chatbot AI model | Typebot → OpenRouter → Mistral Small 4. EU data retention configured |
