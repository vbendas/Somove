-- 00023_gdpr_tables.sql
-- GDPR compliance: consent log, audit log, and terms acceptance tracking.

-- Cookie consent log — users can read their own consent history
create table if not exists consent_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  cookie_consent jsonb not null,
  accepted_at timestamptz not null default now()
);
alter table consent_log enable row level security;
create policy "own consent log" on consent_log
  for select using (auth.uid() = user_id);
create policy "insert own consent log" on consent_log
  for insert with check (auth.uid() = user_id);
create index if not exists idx_consent_log_user on consent_log(user_id, accepted_at desc);

-- Audit log — service role only; users cannot read directly
create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);
alter table audit_log enable row level security;
-- No SELECT policy: only service role bypasses RLS
create index if not exists idx_audit_log_actor on audit_log(actor_id, created_at desc);
create index if not exists idx_audit_log_action on audit_log(action, created_at desc);

-- Terms of Service acceptance tracking
create table if not exists terms_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  version text not null,
  accepted_at timestamptz not null default now(),
  unique (user_id, version)
);
alter table terms_acceptances enable row level security;
create policy "own acceptances" on terms_acceptances
  for select using (auth.uid() = user_id);
create policy "insert own acceptance" on terms_acceptances
  for insert with check (auth.uid() = user_id);
create index if not exists idx_terms_acceptances_user on terms_acceptances(user_id, accepted_at desc);