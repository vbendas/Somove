# API Versioning Strategy

## Current State

Somove's API surface is small and consists of:

| Path | Type | External? |
|------|------|-----------|
| `/api/webhooks/stripe` | Stripe webhook | Yes — configured in Stripe Dashboard |
| `/api/webhooks/cal` | Cal.com webhook | Yes — configured in Cal.com |
| `/api/cron/reminders` | Vercel cron | No — internal |
| `/api/cron/reconcile-rooms` | Vercel cron | No — internal |
| `/api/health` | Health check | No — internal |
| `/api/calendar/[sessionId]` | ICS export | Semi — shareable links |

All data mutation happens via Next.js Server Actions (not HTTP endpoints), so
versioning is less critical than in a traditional REST API.

## Strategy

**Keep current paths for existing endpoints.** Webhooks are configured in
external dashboards (Stripe, Cal.com) and renaming them would break production.
If new public API endpoints are added in the future, prefix them with `/api/v1/`.

If a breaking change is needed on an existing webhook:
1. Create the new handler at `/api/v1/webhooks/stripe` (or similar).
2. Update the Stripe/Cal dashboard to point to the new URL.
3. Keep the old path as a 302 redirect for 30 days.
4. Remove the old path after the transition period.

## Server Actions

Server Actions are not HTTP-exposed and are bundled with the app. They are
implicitly versioned by the deployment — a new deployment = a new version of all
actions. No explicit versioning needed.