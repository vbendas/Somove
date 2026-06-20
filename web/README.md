# Somove Web App

A somatic therapy platform built with Next.js 14, Supabase, and Tailwind CSS.

## Architecture

- **Next.js 14** (App Router, TypeScript) + shadcn/ui + Tailwind
- **Supabase** (PostgreSQL, Auth, Realtime, Storage)
- **Stripe** (Payments, Connect)
- **Daily.co / MiroTalk** (Video calls)
- **Cal.com** (Scheduling)
- **Resend** (Email notifications)

### Route Groups

- `(client)` — Client-facing pages (booking, sessions, inbox, settings)
- `(therapist)` — Therapist dashboard (schedule, clients, earnings, settings)
- `(admin)` — Admin panel (therapists, invites, settings)
- `api/` — API routes (webhooks, cron, calendar export)

### Roles

- **Client** — Books sessions, messages therapists, joins video calls
- **Therapist** — Manages schedule, clients, earnings, session notes
- **Admin** — Platform settings, therapist approval, invites

## Getting Started

### Prerequisites

- Node.js 20+
- Docker (for local Supabase)
- Supabase CLI (optional)

### Setup

1. Clone the repo and install dependencies:
```bash
cd web
npm install
```

2. Copy `.env.example` to `.env.local` and fill in your keys:
```bash
cp .env.example .env.local
```

3. Start local Supabase:
```bash
docker compose up -d
```

4. Run migrations:
```bash
# Apply all migrations
for f in supabase/migrations/0*.sql; do
  psql "postgres://postgres:supersecretpassword@localhost:5432/postgres" -f "$f"
done
```

5. Start the dev server:
```bash
npm run dev
```

6. Visit `http://localhost:3000/setup` to create the first admin account.

## Environment Variables

See `.env.example` for the full list. Key variables:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `DAILY_API_KEY` | Daily.co API key |
| `CAL_API_KEY` | Cal.com API key |
| `RESEND_API_KEY` | Resend API key |
| `SETUP_BOOTSTRAP_TOKEN` | Token for initial setup |
| `CRON_SECRET` | Secret for cron job authentication |

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript checks
npm run test         # Run tests (Vitest)
```

## Database

Migrations are in `supabase/migrations/`. Key tables:

- `users` — User accounts (client, therapist, admin)
- `therapist_profile` — Public therapist data
- `therapist_secrets` — API keys (service-role only)
- `sessions` — Booked sessions
- `session_types` — Session offerings
- `payments` — Payment records
- `messages` / `conversations` — Messaging
- `reviews` — Client reviews
- `client_notes` — Therapist notes

## Deployment

Deploy to Vercel:

1. Connect your GitHub repo to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy — Vercel auto-detects Next.js

For self-hosting, use the Dockerfile:
```bash
docker build -t somove-web .
docker run -p 3000:3000 somove-web
```

## Security

- RLS enabled on all tables
- API secrets in separate `therapist_secrets` table (service-role only)
- Conversation membership checks on all messaging operations
- Server-side price validation (no client-trusted amounts)
- Mandatory webhook signature verification
- Role-based route protection
