# Victor-Plan.md — Things You Need to Do

Action items for Victor to complete before tomorrow's test. These are external services, accounts, and manual setup that the agent cannot do.

---

## 1. Stripe Test Account Setup

**Time**: ~20 min | **Priority**: Critical

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com) → **Developers → API keys**
2. Make sure you're in **Test mode** (toggle in top-right)
3. Copy the **Secret key** (`sk_test_...`)
4. Copy the **Publishable key** (`pk_test_...`) — optional for now
5. Set up Stripe CLI for local webhook testing:
   ```bash
   brew install stripe/stripe-cli/stripe
   stripe login
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
6. Copy the **Webhook signing secret** (`whsec_...`) from the CLI output

---

## 2. Daily.co Account Setup

**Time**: ~10 min | **Priority**: Critical

1. Go to [dashboard.daily.co](https://dashboard.daily.co) → sign up (free)
2. Go to **Developers → API keys**
3. Copy the **API key**
4. Note your **Domain** (the part before `.daily.co` in your room URLs)
5. Free tier gives 2,000 min/month — more than enough for testing

---

## 3. Update `.env.local`

**Time**: ~5 min | **Priority**: Critical

Edit `web/.env.local` and replace the placeholder values:

```
STRIPE_SECRET_KEY=sk_test_...your-test-key-here...
STRIPE_WEBHOOK_SECRET=whsec_...from-stripe-listen...
DAILY_API_KEY=...your-daily-api-key...
DAILY_DOMAIN=...your-domain...   (e.g. "somove" if your rooms are somove.daily.co)
```

**Important**: The env var for Daily domain must be `DAILY_DOMAIN` (not `NEXT_PUBLIC_DAILY_DOMAIN`).

---

## 4. Fresh Database Setup

**Time**: ~15 min | **Priority**: Critical

If testing on a fresh database (recommended):

1. Start the stack:
   ```bash
   cd /Users/victorbendas/Documents/GitHub/Somove
   docker compose up -d
   ```
2. Apply all 12 migrations via Supabase SQL editor or psql:
   ```bash
   # Via psql (after docker is up):
   for f in web/supabase/migrations/0*.sql; do psql "postgres://postgres:supersecretpassword@localhost:5432/postgres" -f "$f"; done
   ```
3. Run the setup wizard: go to `http://localhost:3000/setup`
   - Create the first **admin** account (email + password)
   - This sets `platform_settings.setup_completed = true`

---

## 5. Create Therapist Account

**Time**: ~5 min | **Priority**: Critical

1. Log in as admin → go to `/admin/invites`
2. Create an invite for your **therapist email** with role `therapist`
3. Copy the invite link (`/invite/{token}`) — emails aren't sent, you must copy manually
4. Open the link in an incognito window (or second device)
5. Enter name + password → submit
6. You're redirected to `/login` — log in via **magic link** (the password you set has no login form)

---

## 6. Set Therapist Stripe Key in Database

**Time**: ~5 min | **Priority**: Critical

After the therapist account exists, set their `stripe_secret_key` so the booking flow can create Stripe checkouts:

```sql
-- Via Supabase SQL editor or psql:
UPDATE therapist_profile
SET stripe_secret_key = 'sk_test_...your-test-key...'
WHERE user_id = '<therapist-user-id>';
```

Find the therapist user ID:
```sql
SELECT id, email, name FROM users WHERE role = 'therapist';
```

---

## 7. Create Client Account

**Time**: ~5 min | **Priority**: Critical

1. Open `http://localhost:3000/login` in a different browser/device (or incognito)
2. Enter a **different email** than the therapist's
3. Click the magic link in the email
4. Complete profile (enter name)
5. You're now a client — you should see the therapist directory on the home page

---

## 8. Pre-Test Checklist

Before tomorrow's test, verify:

- [ ] Docker compose is running (`docker compose ps`)
- [ ] App is accessible at `http://localhost:3000`
- [ ] Admin can log in and see `/admin/dashboard`
- [ ] Therapist appears in the directory (status = active, has availability rules)
- [ ] `stripe listen` is running in a separate terminal
- [ ] Daily.co rooms can be created (check by booking a free session first)

---

## Quick Reference: Test Flow

| Step | Device 1 (Customer) | Device 2 (Professional) |
|------|---------------------|------------------------|
| 1 | Login via magic link | Login via magic link |
| 2 | Browse home → see therapist | — |
| 3 | Click therapist → "Book a Session" | — |
| 4 | Select type, date, time → confirm → Stripe checkout | — |
| 5 | Complete Stripe test payment (card: 4242 4242 4242 4242) | — |
| 6 | Redirected to confirmation → see session | — |
| 7 | — | See session on dashboard → "Start Session" |
| 8 | — | Enters video call (Daily.co iframe) |
| 9 | Click "Join Video Call" on session detail | — |
| 10 | Both in video call | Both in video call |
| 11 | — | Click "End Session" |
| 12 | See session marked completed | See session marked completed |
