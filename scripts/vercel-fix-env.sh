#!/bin/bash
# One-off: the original Vercel production env vars were stored with a literal
# trailing "\n" in their values, which breaks the Supabase auth header inside
# the edge middleware (plain "Internal Server Error" on "/").
# This pulls the current production values, strips the newline, and re-adds them.
set -e
cd "$(dirname "$0")/../web"
TMP=$(mktemp)
npx vercel env pull "$TMP" --environment=production --yes >/dev/null
for KEY in DAILY_API_KEY DAILY_DOMAIN NEXT_PUBLIC_SUPABASE_ANON_KEY NEXT_PUBLIC_SUPABASE_URL STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET SUPABASE_SERVICE_ROLE_KEY; do
  VAL=$(grep "^$KEY=" "$TMP" | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//' -e 's/\\n$//' | tr -d '\n\r ')
  if [ -z "$VAL" ]; then echo "skip $KEY (empty)"; continue; fi
  npx vercel env rm "$KEY" production --yes >/dev/null 2>&1 || true
  printf '%s' "$VAL" | npx vercel env add "$KEY" production >/dev/null 2>&1
  echo "fixed $KEY"
done
rm -f "$TMP"
echo "done"
