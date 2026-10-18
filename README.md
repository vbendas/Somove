# Somove

An open-source online session platform for independent professionals.

## What it does

- Profile and landing page with a visual page builder and theming
- Booking, with payments through Stripe Connect
- Video sessions via Daily.co or self-hosted MiroTalk
- Messaging and private client notes
- Session credits and bundles
- Admin panel with professional invites
- Notifications
- GDPR data export and deletion

## Who it's for

Therapists and psychologists, coaches, teachers and tutors, consultants, and other remote professionals who meet clients online.

## Built with

- Next.js 15 (App Router, TypeScript)
- Tailwind CSS and shadcn/ui
- Supabase (Postgres with RLS, Auth, Realtime, Storage)
- Stripe Connect
- Daily.co / MiroTalk
- Resend
- Sentry
- Vitest

## Links

- Website: https://web-smoky-six-20.vercel.app
- Live demo, signed in automatically with made-up accounts:
  - Client: https://web-smoky-six-20.vercel.app/dashboard
  - Professional: https://web-smoky-six-20.vercel.app/professional/dashboard
  - Admin: https://web-smoky-six-20.vercel.app/admin

Destructive admin actions are disabled in the demo, and its sample sessions are re-dated daily so there is always upcoming activity.

## Status

Solo project, under active development. Planned work is tracked in [ROADMAP.md](ROADMAP.md) and in [open issues](https://github.com/vbendas/Somove/issues).

## Getting started

Prerequisites: Node.js 20+, Docker (for local Supabase), and optionally the Supabase CLI.

```bash
git clone https://github.com/vbendas/Somove.git somove
cd somove/web
npm install
cp .env.example .env.local   # then fill in the values
```

Required variables include `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `NEXT_PUBLIC_SITE_URL`. Integrations such as Stripe, Daily.co, MiroTalk, Resend, Chatwoot, Typebot and Web Push are optional. `.env.example` lists every variable with a comment on where to get it.

Apply the migrations in `web/supabase/migrations/` to your database. The `scripts/db-push.sh` helper applies pending migrations.

Start the dev server and open the setup page to create the first admin account:

```bash
npm run dev
# then open http://localhost:3000/setup
```

### Self-hosting with Docker Compose

The root `docker-compose.yml` runs the app, Postgres and a Supabase API gateway as one stack. Copy `web/.env.self-hosted.example` to `.env` at the repository root and fill in the values (`scripts/generate-keys.sh` can generate the secrets), then run:

```bash
docker compose up -d
```

Open http://localhost:3000 and complete the setup wizard. Change the default Postgres and dashboard passwords before exposing the stack.

## Scripts

Run these from `web/`:

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript checks |
| `npm run test` | Run tests once (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run format` | Format `src/` with Prettier |
| `npm run format:check` | Check formatting without writing |
| `npm run analyze` | Production build with bundle analysis |

## Repository layout

- `web/`: Next.js application (route groups for client, therapist and admin, plus `api/`)
- `web/supabase/migrations/`: SQL migrations
- `docs/`: API versioning, backup runbook, OpenAPI spec
- `Documentation/`: product and design documentation, including detailed plans
- `scripts/`: database, backup and deployment helper scripts

## Roadmap

See [ROADMAP.md](ROADMAP.md) for planned work and links to the detailed plans, and the [issue tracker](https://github.com/vbendas/Somove/issues) for the concrete tasks.

## License

MIT. See LICENSE.
