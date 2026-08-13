#!/bin/bash
set -e
cd "$(dirname "$0")/../web"

echo "=== Dropping the two known-conflicting policies ==="
npx supabase db query --linked -f ../scripts/fix-policy-conflicts.sql

echo "=== Retrying db push ==="
npx supabase db push
