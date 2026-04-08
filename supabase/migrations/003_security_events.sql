-- Security events for operational abuse monitoring
create table if not exists public.security_events (
  id uuid primary key default gen_random_uuid(),
  event text not null,
  scope text not null,
  key_hash text not null,
  retry_after_ms integer not null default 0,
  remaining integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_security_events_created_at on public.security_events(created_at desc);
create index if not exists idx_security_events_scope on public.security_events(scope);

alter table public.security_events enable row level security;

create policy "admin_select_security_events"
on public.security_events
for select
using (public.is_admin_user());
