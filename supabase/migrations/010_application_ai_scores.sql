-- 010_application_ai_scores.sql

create table public.application_ai_scores (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  job_opening_id uuid not null references public.job_openings(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,

  score numeric(5,2) not null check (score >= 0 and score <= 100),
  highlights text[] not null default '{}',
  rationale text,

  model text not null,
  provider text not null,
  tokens_used integer,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (application_id)
);

create trigger set_updated_at_application_ai_scores
  before update on public.application_ai_scores
  for each row execute function public.set_updated_at();

alter table public.application_ai_scores enable row level security;

create policy "admin_manage_ai_scores"
  on public.application_ai_scores
  for all
  using (public.is_admin_user())
  with check (public.is_admin_user());

create index if not exists idx_ai_scores_job on public.application_ai_scores(job_opening_id);
create index if not exists idx_ai_scores_org on public.application_ai_scores(organization_id);
