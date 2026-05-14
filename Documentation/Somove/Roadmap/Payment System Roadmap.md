# Payment System — Feature Roadmap

## Overview

Stripe Connect (Express) as the payment infrastructure for the Somove marketplace. Clients pay per session (or in bundles of 3, 5, or 10 sessions) via card in EUR. Somove collects a **10% platform fee** automatically. Therapists receive the remainder to their bank account on a configured payout schedule. Stripe handles KYC, compliance, and tax forms for therapists. Stripe Tax enabled from day one for EU VAT.

**Stack:** Stripe Connect (Express accounts) · Stripe Checkout · Stripe Webhooks · Next.js API routes

**Model:** Per-session or bundle payment. Somove takes **10%** of the session or bundle price at the point of charge. Therapist receives the net amount on payout schedule.

**Currency:** EUR primary. Europe-only for MVP and Beta.

**Target:** 2 therapists at launch, 10 at beta — single Stripe platform account handles all.

---

## Architecture Overview

```
Client books session (Cal.com → webhook)
        ↓
Somove creates PaymentIntent with application_fee_amount
        ↓
Client completes payment (Stripe Checkout)
        ↓
Stripe charges client, splits automatically:
  - Platform fee → Somove Stripe account
  - Net amount   → Therapist connected account
        ↓
Stripe webhook → Somove confirms payment, activates session
        ↓
Therapist receives bank payout on schedule (daily/weekly)
```

---

## Stripe Connect Account Type: Express

Three options exist (Standard, Express, Custom). **Express is the right choice for Somove:**

- Stripe hosts the therapist onboarding and KYC flow
- Therapist gets a Stripe Express dashboard for payouts and tax documents
- Somove gets full control over charges and fee structure
- Compliance and identity verification owned by Stripe
- Least dev work, least regulatory exposure

---

## Phase 0 — Stripe Platform Setup

**Goal:** Stripe platform account configured and ready to accept connected accounts and split payments.

**Estimated effort:** 8–12 hours

---

### 0.1 Account & Configuration

- [ ] **0.1.1** Create Stripe account for Somove (business account, not personal)
- [ ] **0.1.2** Complete Stripe platform profile — business details, support email, support URL
- [ ] **0.1.3** Enable Stripe Connect in the Dashboard under "Connect settings"
- [ ] **0.1.4** Set branding: Somove logo, brand colour — shown on Stripe-hosted pages
- [ ] **0.1.5** Configure Connect settings:
  - Account type: Express
  - Service agreement: Full (therapists accept Stripe's terms, not Somove's custom terms)
  - Countries: enable EU + US at minimum
- [ ] **0.1.6** Set payout schedule default for connected accounts (recommend: daily automatic)
- [ ] **0.1.7** Store API keys in environment: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- [ ] **0.1.8** Install Stripe SDK: `npm install stripe @stripe/stripe-js`

---

### 0.2 Environment Configuration

- [ ] **0.2.1** Create `.env.local` entries for Stripe keys (test and live)
- [ ] **0.2.2** Create `lib/stripe.ts` — singleton Stripe client (server-side)
- [ ] **0.2.3** Never expose `STRIPE_SECRET_KEY` to the client — all Stripe API calls go through Next.js API routes
- [ ] **0.2.4** Configure test mode with test API keys for development and staging

---

## Phase 1 — Therapist Onboarding (Connected Accounts)

**Goal:** Each therapist has a verified Stripe Express connected account before they can receive payments.

**Estimated effort:** 20–25 hours

---

### 1.1 Data Model

- [ ] **1.1.1** Add to `Therapist` model:
  ```
  Therapist {
    ...existing fields...
    stripeAccountId         String?
    stripeOnboardingDone    Boolean  (default: false)
    stripePayoutsEnabled    Boolean  (default: false)
    sessionPriceEur         Int      (single session price in cents)
    bundle3PriceEur         Int?     (3-session bundle, null = not offered)
    bundle5PriceEur         Int?     (5-session bundle, null = not offered)
    bundle10PriceEur        Int?     (10-session bundle, null = not offered)
    freeFirstSession        Boolean  (default: false)
    platformFeePercent      Int      (default: 10)
  }
  ```
- [ ] **1.1.2** Run database migration

---

### 1.2 Create Connected Account

- [ ] **1.2.1** `POST /api/stripe/connect/create-account` — server-side endpoint
  - Calls `stripe.accounts.create({ type: 'express', country, email, capabilities: { card_payments, transfers } })`
  - Stores `stripeAccountId` on Therapist record
  - Returns account ID
- [ ] **1.2.2** Only callable by authenticated therapist for their own account
- [ ] **1.2.3** Idempotent — if `stripeAccountId` already exists, return existing ID (never create duplicates)

---

### 1.3 Onboarding Flow

- [ ] **1.3.1** `POST /api/stripe/connect/onboarding-link` — generate Stripe-hosted onboarding URL
  - Calls `stripe.accountLinks.create({ account, refresh_url, return_url, type: 'account_onboarding' })`
  - `return_url` → `/dashboard/settings/payments?onboarding=complete`
  - `refresh_url` → `/dashboard/settings/payments?onboarding=refresh`
- [ ] **1.3.2** Therapist settings page — "Set up payouts" section
  - If no `stripeAccountId`: show "Connect your bank account" CTA
  - If onboarding incomplete: show "Complete setup" CTA with link
  - If fully onboarded: show payout status, last payout, bank account last 4 digits
- [ ] **1.3.3** Handle `?onboarding=refresh` — silently re-generate a fresh onboarding link and redirect (Stripe links expire)
- [ ] **1.3.4** Handle `?onboarding=complete` — show success state, verify via API that onboarding actually completed (don't trust URL param alone)

---

### 1.4 Account Status Verification

- [ ] **1.4.1** `GET /api/stripe/connect/account-status` — retrieve live account status
  - Calls `stripe.accounts.retrieve(stripeAccountId)`
  - Returns `{ chargesEnabled, payoutsEnabled, requirements }` 
- [ ] **1.4.2** Update `stripeOnboardingDone` and `stripePayoutsEnabled` on Therapist record based on response
- [ ] **1.4.3** If `requirements.currently_due` is non-empty, surface actionable message to therapist: "Stripe needs additional information"
- [ ] **1.4.4** Block session activation for therapist if `payoutsEnabled === false` — cannot accept bookings without a verified payout account

---

### 1.5 Webhook: Account Updates

- [ ] **1.5.1** Handle `account.updated` webhook event
  - Re-check `charges_enabled` and `payouts_enabled`
  - Update Therapist record accordingly
  - If newly enabled: send therapist a "You're ready to receive payments" email

---

## Phase 2 — Session Payment Flow

**Goal:** Client pays for a session at booking time. Payment is split automatically between Somove and the therapist.

**Estimated effort:** 30–40 hours

---

### 2.1 Pricing Configuration

- [ ] **2.1.1** Therapist sets own prices during onboarding and in `/dashboard/settings`:
  - Single session price (required)
  - 3-session bundle price (optional)
  - 5-session bundle price (optional)
  - 10-session bundle price (optional)
  - Free first session toggle (optional)
- [ ] **2.1.2** Helper function `calculateFees(priceInCents)`:
  ```
  platformFee = Math.round(priceInCents * 0.10)   // 10% fixed
  therapistReceives = priceInCents - platformFee - estimatedStripeFee
  ```
- [ ] **2.1.3** Fee transparency: show client the total they pay. Show therapist their net in earnings dashboard.
- [ ] **2.1.4** Bundle per-session effective price shown on booking screen (e.g. "5 sessions · €350 · €70/session")

---

### 2.2 Free First Session Flow

- [ ] **2.2.1** Before creating checkout, check eligibility: `freeFirstSession === true` AND no previous completed session between this client + therapist
- [ ] **2.2.2** If eligible: skip Stripe Checkout entirely, confirm booking directly (no payment record needed)
- [ ] **2.2.3** Mark session `paymentStatus: free_first_session` for earnings reporting
- [ ] **2.2.4** One free session per client-therapist pair — system enforces, not trust-based

---

### 2.3 Bundle Checkout

- [ ] **2.3.1** `POST /api/payments/create-checkout` with `{ type: 'bundle', bundleSize: 3|5|10 }`
- [ ] **2.3.2** Stripe Checkout for full bundle price (single payment)
- [ ] **2.3.3** On `checkout.session.completed`: create `SessionCredit` record
  ```
  SessionCredit { clientEmail, therapistId, totalCredits: N, usedCredits: 0 }
  ```
- [ ] **2.3.4** Booking with this therapist checks for available credits first — deduct one, skip payment
- [ ] **2.3.5** Credits shown to client on therapist profile and booking screen
- [ ] **2.3.6** Refund of unused credits: full refund for remaining credits on cancellation

---

### 2.4 Single Session Checkout

- [ ] **2.4.1** `POST /api/payments/create-checkout` — create Stripe Checkout session
  - Input: `{ sessionId }` (Somove session ID from scheduling system)
  - Fetch session + therapist from DB, verify therapist has `payoutsEnabled`
  - Call `stripe.checkout.sessions.create`:
    ```
    {
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price_data: { currency, product_data, unit_amount }, quantity: 1 }],
      payment_intent_data: {
        application_fee_amount: platformFeeInCents,
        transfer_data: { destination: therapist.stripeAccountId }
      },
      metadata: { somoveSessionId, therapistId, clientEmail },
      success_url: '/booking/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: '/booking/cancelled'
    }
    ```
  - Store Stripe `checkoutSessionId` on Somove Session record
  - Return `{ url }` — redirect client to this URL
- [ ] **2.2.2** Checkout triggers after Cal.com booking confirmation (booking confirmed → payment required before session is activated)
- [ ] **2.2.3** Handle therapist not onboarded: return error, block checkout creation

---

### 2.3 Post-Payment Handling

- [ ] **2.3.1** `/booking/success` page — show confirmation, session details, join link availability
- [ ] **2.3.2** `/booking/cancelled` page — reassure client, offer to retry payment or cancel booking
- [ ] **2.3.3** Payment link expiry: if client doesn't pay within 24h of booking, auto-cancel via scheduled job

---

### 2.4 Webhook: Payment Confirmation

- [ ] **2.4.1** `POST /api/webhooks/stripe` — Stripe webhook handler
- [ ] **2.4.2** Verify webhook signature using `stripe.webhooks.constructEvent` with `STRIPE_WEBHOOK_SECRET` — reject unverified requests
- [ ] **2.4.3** Handle `checkout.session.completed`:
  - Extract `metadata.somoveSessionId`
  - Update Session status to `paid` / `scheduled`
  - Record `stripePaymentIntentId` on Session
  - Trigger confirmation emails (client + therapist)
  - If Cal.com booking already confirmed, provision LiveKit room now (if not already done)
- [ ] **2.4.4** Handle `checkout.session.expired`:
  - Update Session status to `payment_failed`
  - Notify client that payment window expired
  - Cancel Cal.com booking via API
- [ ] **2.4.5** Handle `payment_intent.payment_failed`:
  - Log failure reason
  - Notify client with retry link
- [ ] **2.4.6** Return `200 OK` immediately, process async

---

### 2.5 Payment State on Session Model

- [ ] **2.5.1** Add payment fields to `Session` model:
  ```
  Session {
    ...existing fields...
    paymentStatus         Enum (pending, paid, failed, refunded)
    stripeCheckoutId      String?
    stripePaymentIntentId String?
    amountPaidCents       Int?
    platformFeeCents      Int?
    currency              String   (default: 'eur')
  }
  ```
- [ ] **2.5.2** Run database migration
- [ ] **2.5.3** "Join Session" button on client dashboard only activates if `paymentStatus === 'paid'`

---

## Phase 3 — Refunds & Cancellations

**Goal:** Clean handling of cancellations with configurable refund policy.

**Estimated effort:** 15–20 hours

---

### 3.1 Refund Policy Configuration

- [ ] **3.1.1** Define refund policy (recommend for launch):
  - Cancelled >24h before session: full refund
  - Cancelled <24h before session: no refund
  - Therapist cancels: always full refund regardless of timing
- [ ] **3.1.2** Store policy in config (not hardcoded — needs to be adjustable)

---

### 3.2 Refund Flow

- [ ] **3.2.1** `POST /api/payments/refund` — process refund
  - Input: `{ sessionId, reason }`
  - Fetch Session, verify `paymentStatus === 'paid'`
  - Calculate refund amount based on policy and time remaining
  - Call `stripe.refunds.create({ payment_intent: stripePaymentIntentId, amount: refundAmountCents })`
  - Stripe reverses the transfer to therapist automatically (partial or full)
  - Update Session `paymentStatus` to `refunded`
- [ ] **3.2.2** Partial refund support — if policy allows pro-rata (future enhancement)
- [ ] **3.2.3** Handle `charge.refunded` webhook — confirm refund processed, notify client

---

### 3.3 Cancellation Integration with Scheduling System

- [ ] **3.3.1** When Cal.com `BOOKING_CANCELLED` webhook fires, check `paymentStatus`
  - If `paid` → trigger refund flow automatically based on policy
  - If `pending` → just cancel, no refund needed
  - If `refunded` → no action
- [ ] **3.3.2** When therapist cancels from their dashboard → always full refund, no prompt
- [ ] **3.3.3** When client cancels from their dashboard → apply policy, show refund amount before confirming

---

## Phase 4 — Therapist Earnings Dashboard

**Goal:** Therapists can see their earnings, upcoming payouts, and payment history within Somove.

**Estimated effort:** 20–25 hours

---

### 4.1 Earnings Overview

- [ ] **4.1.1** `GET /api/therapist/earnings` — fetch earnings data
  - Calls `stripe.balanceTransactions.list({ limit, starting_after })` on connected account
  - Returns total earned, platform fees deducted, net payouts
- [ ] **4.1.2** Earnings summary card: total earned this month, pending payout, lifetime total
- [ ] **4.1.3** Per-session breakdown: date, client (anonymised if needed), gross, fee, net
- [ ] **4.1.4** Paginated history — load more on scroll

---

### 4.2 Payout Status

- [ ] **4.2.1** `GET /api/therapist/payouts` — list recent payouts
  - Calls `stripe.payouts.list()` on connected account
  - Returns amount, status (paid/pending/in_transit), arrival date, bank account
- [ ] **4.2.2** Upcoming payout card: amount pending, estimated arrival date
- [ ] **4.2.3** Payout history list: date, amount, status, bank last 4

---

### 4.3 Stripe Express Dashboard Link

- [ ] **4.3.1** `POST /api/stripe/connect/dashboard-link` — generate link to Stripe Express dashboard
  - Calls `stripe.accounts.createLoginLink(stripeAccountId)`
  - Returns one-time URL, redirect therapist
- [ ] **4.3.2** "Manage payouts & tax documents" link in therapist settings — opens Stripe Express dashboard
  - Therapist manages bank account, downloads tax documents, views full transaction history directly in Stripe
  - Somove doesn't need to replicate this

---

## Phase 5 — Admin & Platform Oversight

**Goal:** Somove can monitor platform revenue, fees collected, and therapist payment status.

**Estimated effort:** 15–20 hours

---

### 5.1 Platform Revenue Dashboard (Internal)

- [ ] **5.1.1** `GET /api/admin/revenue` — platform fee income summary (admin only)
  - Total fees collected this month / all time
  - Breakdown by therapist
  - Outstanding unpaid sessions
- [ ] **5.1.2** Simple internal admin page (not client-facing) showing:
  - Total platform revenue
  - Active therapists + their onboarding status
  - Recent transactions with status

---

### 5.2 Therapist Payment Status Monitoring

- [ ] **5.2.1** Admin view: list of therapists with `stripeOnboardingDone`, `stripePayoutsEnabled` flags
- [ ] **5.2.2** Alert if therapist has incomplete onboarding with pending sessions
- [ ] **5.2.3** Manual trigger to re-send onboarding link from admin (for support cases)

---

## Stripe Fee Reference

Europe-only MVP — all cards will be EU cards.

| Card Type | Stripe Fee |
|---|---|
| EU consumer card | 1.5% + €0.25 |
| EU business card | 2.5% + €0.25 |
| + Connect platform | Additional 0.25% + €0.25 per payout |

Example for an €80 single session (10% platform fee):
- Client charged: €80.00
- Stripe fee (EU consumer card): ~€1.45
- Platform fee (10%): €8.00
- Therapist receives: ~€70.55

Example for a 5-session bundle at €350 (10% platform fee):
- Client charged: €350.00
- Stripe fee: ~€5.50
- Platform fee (10%): €35.00
- Therapist receives: ~€309.50 (over 5 sessions)

---

## Integration with Scheduling System

Payment connects to the scheduling system at two points:

```
1. Booking created (Cal.com webhook)
        → Somove creates Session record (status: pending_payment)
        → Send client payment link via email

2. Payment confirmed (Stripe webhook)
        → Update Session status to paid
        → Provision LiveKit room
        → Send confirmation emails with join links
```

Sessions are not activated until payment is confirmed. This prevents unpaid sessions from consuming LiveKit room resources.

---

## Test Coverage Checklist

- [ ] Successful payment → session activated
- [ ] Failed payment → session stays pending, client notified
- [ ] Expired checkout → session cancelled, Cal.com booking cancelled
- [ ] Refund >24h before session → full refund processed
- [ ] Refund <24h before session → no refund, client notified of policy
- [ ] Therapist cancels → full refund regardless of timing
- [ ] Therapist not onboarded → checkout blocked, clear error
- [ ] Webhook signature failure → request rejected with 400
- [ ] Duplicate webhook event → idempotent handler, no double-processing

---

## Effort Summary

| Phase | Description | Hours |
|---|---|---|
| 0 | Stripe platform setup | 8–12h |
| 1 | Therapist onboarding (Connect) | 20–25h |
| 2 | Session payment flow | 30–40h |
| 3 | Refunds & cancellations | 15–20h |
| 4 | Therapist earnings dashboard | 20–25h |
| 5 | Admin & platform oversight | 15–20h |
| **Total** | | **108–142h** |

---

## Decisions (Resolved)

| Decision | Answer |
|---|---|
| Platform fee | 10% fixed |
| Session pricing | Therapist sets own price (single + optional bundles of 3, 5, 10) |
| Currency | EUR primary — Europe only for MVP and Beta |
| Account required | Yes, but frictionless (Google, Apple, magic link — name + email only) |
| VAT/tax | Stripe Tax enabled from day one |
| Free sessions | Therapist opt-in toggle — one free session per new client per therapist |
| Recording | Never in scope |
