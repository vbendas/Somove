#!/bin/bash
set -e
cd "$(dirname "$0")/../web"

echo "=== Step 1: repair 00001-00006 ==="
npx supabase migration repair --status applied 00001 00002 00003 00004 00005 00006

echo "=== Step 2: repair 00007-00012 ==="
npx supabase migration repair --status applied 00007 00008 00009 00010 00011 00012

echo "=== Step 3: db push (00013-00028) ==="
npx supabase db push
