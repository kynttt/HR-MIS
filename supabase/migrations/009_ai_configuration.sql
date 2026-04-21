create table public.ai_configurations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider text not null check (provider in ('openai', 'gemini', 'ollama')),
  api_key text,
  model text not null,
  is_enabled boolean not null default false,
  ollama_base_url text default 'http://localhost:11434',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id)
);

create trigger set_updated_at_ai_configurations before update on public.ai_configurations for each row execute function public.set_updated_at();

alter table public.ai_configurations enable row level security;

create policy "admin_manage_ai_config" on public.ai_configurations for all using (public.is_admin_user()) with check (public.is_admin_user());
