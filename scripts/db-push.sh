#!/bin/bash
# Apply pending Supabase migrations to the linked remote project.
#
# Reads SUPABASE_ACCESS_TOKEN (and the rest of the app env) from
# web/.env.local so no `supabase login` session is required.
#
# --include-all is needed because some migrations sort before the last one
# already applied remotely; the CLI refuses out-of-order pushes without it.
set -e
cd "$(dirname "$0")/../web"
set -a
. ./.env.local
set +a
npx supabase db push --include-all --yes
