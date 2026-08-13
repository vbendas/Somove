#!/usr/bin/env bash
set -euo pipefail

# Somove backup script
# Dumps the Postgres database and exports Storage objects.
# Requires: pg_dump, supabase CLI
#
# Env vars:
#   DATABASE_URL    — Supabase pooled connection string (postgres://...@aws-0-<region>.pooler.supabase.com:6543/postgres)
#   SUPABASE_PROJECT_REF — Supabase project ref (for storage CLI)
#   SUPABASE_ACCESS_TOKEN — Supabase CLI access token
#   BACKUP_DIR — output directory (defaults to ./backups)

TS=$(date -u +%Y%m%dT%H%M%SZ)
OUT="${BACKUP_DIR:-./backups}/${TS}"
mkdir -p "$OUT"

echo "==> Backing up database to $OUT/db.dump ..."
pg_dump "$DATABASE_URL" --no-owner --no-privileges -Fc -f "$OUT/db.dump"

echo "==> Exporting Storage objects ..."
for BKT in attachments avatars session-attachments; do
  mkdir -p "$OUT/storage/$BKT"
  # List objects and download each
  supabase storage list "$BKT" --recursive 2>/dev/null | while read -r obj; do
    [ -z "$obj" ] && continue
    filepath=$(echo "$obj" | awk '{print $NF}')
    echo "  downloading $BKT/$filepath ..."
    supabase storage download "$BKT/$filepath" "$OUT/storage/$BKT/$(basename "$filepath")" 2>/dev/null || true
  done || echo "  (bucket $BKT not found or empty)"
done

echo "==> Backup complete: $OUT"
echo "    DB dump: $OUT/db.dump"
echo "    Storage: $OUT/storage/"
ls -lhR "$OUT" | head -20