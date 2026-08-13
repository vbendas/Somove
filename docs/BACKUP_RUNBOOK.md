# Somove — Backup & Recovery Runbook

## Overview

Somove runs on **Vercel** (app) + **Supabase Cloud** (Postgres, Auth, Storage).
Backups protect against data loss from accidental deletion, corruption, or
provider-side incidents.

## RPO / RTO Targets

| Metric | Target | Mechanism |
|--------|--------|-----------|
| RPO (Recovery Point Objective) | ≤ 24 hours | Supabase Pro daily automated backups |
| RPO (Storage) | ≤ 7 days | Weekly `scripts/backup.sh` offsite |
| RTO (Recovery Time Objective) | < 2 hours | Supabase point-in-time recovery |

## Supabase Cloud Backups (Pro plan)

Supabase Pro plan provides:
- **Daily automated backups** — full database snapshot every 24h, retained 7 days.
- **Point-in-Time Recovery (PITR)** — recover to any second within the retention window. Enable in Dashboard → Database → Backups.
- **Storage backups** — Storage objects are NOT included in DB backups. Use the weekly script below.

### Enable PITR
1. Upgrade to Supabase Pro plan (Dashboard → Billing).
2. Navigate to Database → Backups → Settings.
3. Enable "Point-in-Time Recovery" (7-day window).

## On-Demand Backup (before deploys)

Run before each production deploy:
```bash
export DATABASE_URL="postgres://postgres.{ref}:***@aws-0-{region}.pooler.supabase.com:6543/postgres"
export SUPABASE_PROJECT_REF="{ref}"
export SUPABASE_ACCESS_TOKEN="{token}"
bash scripts/backup.sh
```

Output: `backups/<timestamp>/db.dump` + `backups/<timestamp>/storage/`.

## Weekly Offsite Backup

Schedule a weekly cron (GitHub Actions, server, or local) to run `scripts/backup.sh` and upload to an offsite destination:
- **Backblaze B2 / S3** — `aws s3 sync backups/ s3://somove-backups/`
- Or any cloud storage provider.

Retain weekly snapshots for 30 days.

## Restore Procedure

### Database restore (from Supabase backup)
1. Supabase Dashboard → Database → Backups.
2. Select the desired backup snapshot.
3. Click "Restore" — this will replace the current database.
4. For PITR: select a specific timestamp and click "Restore to timestamp".

### Database restore (from pg_dump)
```bash
# Restore from a custom-format dump
pg_restore -d "$DATABASE_URL" --no-owner --no-privileges --clean "$DUMP_FILE"
```

### Storage restore
```bash
# Re-upload storage objects from backup
for BKT in attachments avatars session-attachments; do
  for file in backups/*/storage/$BKT/*; do
    supabase storage upload "$BKT/$(basename $file)" "$file"
  done
done
```

## What's NOT Backed Up Automatically

- **Storage objects** (message attachments, avatars) — must use the weekly script.
- **Vercel environment variables** — export via `vercel env ls` or dashboard.
- **Stripe / Cal.com / Daily.co / Resend configurations** — provider-side, not in DB.

## Testing Restores

Quarterly: restore the latest backup to a staging Supabase project and verify:
1. App connects and loads data.
2. Storage objects are accessible.
3. Auth users are present.