-- 00022_room_pending_flag.sql
-- Track sessions where video room creation failed so a reconciliation cron can retry.
alter table sessions add column if not exists room_pending boolean not null default false;
create index if not exists idx_sessions_room_pending on sessions(room_pending) where room_pending;