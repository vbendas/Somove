-- ============================================================
-- Phase 10: Notifications & Push Subscriptions
-- ============================================================

-- In-app notifications table
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  type text not null check (type in (
    'booking_confirmed',
    'session_reminder',
    'session_cancelled',
    'new_message',
    'payment_received'
  )),
  title text not null,
  body text not null,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_notifications_user_read on notifications(user_id, read_at);
create index idx_notifications_user_created on notifications(user_id, created_at desc);

alter table notifications enable row level security;

create policy "Users read own notifications"
  on notifications for select
  using (auth.uid() = user_id);

create policy "Users update own notifications"
  on notifications for update
  using (auth.uid() = user_id);

create policy "System inserts notifications"
  on notifications for insert
  with check (true);

create policy "Users delete own notifications"
  on notifications for delete
  using (auth.uid() = user_id);

-- Push subscriptions table
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  unique(user_id, endpoint)
);

create index idx_push_subscriptions_user on push_subscriptions(user_id);

alter table push_subscriptions enable row level security;

create policy "Users manage own push subscriptions"
  on push_subscriptions for all
  using (auth.uid() = user_id);

create policy "System manages push subscriptions"
  on push_subscriptions for insert
  with check (true);

-- Notification preferences table
create table if not exists notification_preferences (
  user_id uuid primary key references users(id) on delete cascade,
  email_booking_confirmed boolean not null default true,
  email_session_reminder boolean not null default true,
  email_new_message boolean not null default true,
  push_booking_confirmed boolean not null default true,
  push_session_reminder boolean not null default true,
  push_new_message boolean not null default true,
  push_session_cancelled boolean not null default true,
  quiet_hours_start time,
  quiet_hours_end time,
  updated_at timestamptz not null default now()
);

alter table notification_preferences enable row level security;

create policy "Users manage own notification preferences"
  on notification_preferences for all
  using (auth.uid() = user_id);

-- Enable realtime for notifications
alter publication supabase_realtime add table notifications;
