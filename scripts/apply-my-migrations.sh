#!/bin/bash
set -e
cd "$(dirname "$0")/../web"

echo "=== Mark 00022 as applied (it succeeded before 00023 failed) ==="
npx supabase migration repair --status applied 00022

echo "=== Apply 00025_add_visual_pages.sql directly ==="
npx supabase db query --linked -f supabase/migrations/00025_add_visual_pages.sql

echo "=== Apply 00026_role_escalation_guard.sql directly ==="
npx supabase db query --linked -f supabase/migrations/00026_role_escalation_guard.sql

echo "=== Apply 00027_cms_v2.sql directly ==="
npx supabase db query --linked -f supabase/migrations/00027_cms_v2.sql

echo "=== Apply 00028_seed_homepage_sections.sql directly ==="
npx supabase db query --linked -f supabase/migrations/00028_seed_homepage_sections.sql

echo "=== Mark 00025-00028 as applied in tracking table ==="
npx supabase migration repair --status applied 00025 00026 00027 00028

echo "=== Done. Final migration list: ==="
npx supabase migration list
