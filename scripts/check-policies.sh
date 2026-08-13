#!/bin/bash
set -e
cd "$(dirname "$0")/../web"
npx supabase db query --linked -f ../scripts/check-existing-policies.sql
