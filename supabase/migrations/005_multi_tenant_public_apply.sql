-- Multi-tenant organization support + scoped public application flow

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_updated_at_organizations on public.organizations;
create trigger set_updated_at_organizations
before update on public.organizations
for each row execute function public.set_updated_at();

insert into public.organizations (name, slug)
values ('Default Organization', 'default')
on conflict (slug) do nothing;

create or replace function public.default_organization_id()
returns uuid
language sql
stable
set search_path = public
as $$
  select id from public.organizations order by created_at asc limit 1
$$;

alter table public.profiles add column if not exists organization_id uuid;
alter table public.departments add column if not exists organization_id uuid;
alter table public.job_openings add column if not exists organization_id uuid;
alter table public.applicants add column if not exists organization_id uuid;
alter table public.applications add column if not exists organization_id uuid;
alter table public.employees add column if not exists organization_id uuid;

update public.profiles
set organization_id = public.default_organization_id()
where organization_id is null;

update public.departments
set organization_id = public.default_organization_id()
where organization_id is null;

update public.job_openings j
set organization_id = d.organization_id
from public.departments d
where j.department_id = d.id and j.organization_id is null;

update public.job_openings
set organization_id = public.default_organization_id()
where organization_id is null;

update public.applicants
set organization_id = public.default_organization_id()
where organization_id is null;

update public.applications a
set organization_id = j.organization_id
from public.job_openings j
where a.job_opening_id = j.id and a.organization_id is null;

update public.applications
set organization_id = public.default_organization_id()
where organization_id is null;

update public.employees e
set organization_id = d.organization_id
from public.departments d
where e.department_id = d.id and e.organization_id is null;

update public.employees
set organization_id = public.default_organization_id()
where organization_id is null;

alter table public.profiles alter column organization_id set not null;
alter table public.departments alter column organization_id set not null;
alter table public.job_openings alter column organization_id set not null;
alter table public.applicants alter column organization_id set not null;
alter table public.applications alter column organization_id set not null;
alter table public.employees alter column organization_id set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_organization_fk') then
    alter table public.profiles add constraint profiles_organization_fk foreign key (organization_id) references public.organizations(id);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'departments_organization_fk') then
    alter table public.departments add constraint departments_organization_fk foreign key (organization_id) references public.organizations(id);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'job_openings_organization_fk') then
    alter table public.job_openings add constraint job_openings_organization_fk foreign key (organization_id) references public.organizations(id);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'applicants_organization_fk') then
    alter table public.applicants add constraint applicants_organization_fk foreign key (organization_id) references public.organizations(id);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'applications_organization_fk') then
    alter table public.applications add constraint applications_organization_fk foreign key (organization_id) references public.organizations(id);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'employees_organization_fk') then
    alter table public.employees add constraint employees_organization_fk foreign key (organization_id) references public.organizations(id);
  end if;
end $$;

create index if not exists idx_profiles_organization on public.profiles(organization_id);
create index if not exists idx_departments_organization on public.departments(organization_id);
create index if not exists idx_jobs_organization on public.job_openings(organization_id);
create index if not exists idx_applicants_organization on public.applicants(organization_id);
create index if not exists idx_applications_organization on public.applications(organization_id);
create index if not exists idx_employees_organization on public.employees(organization_id);

create unique index if not exists idx_departments_org_code on public.departments(organization_id, department_code);
create unique index if not exists idx_departments_org_name on public.departments(organization_id, department_name);

-- Create this after profiles.organization_id exists.
create or replace function public.current_user_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.organization_id
  from public.profiles p
  where p.id = auth.uid()
$$;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, organization_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce((new.raw_user_meta_data->>'organization_id')::uuid, public.default_organization_id())
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Public users may only read open jobs for listings/details.
drop policy if exists "jobs_admin_only" on public.job_openings;
drop policy if exists "jobs_public_open_read" on public.job_openings;
drop policy if exists "jobs_admin_write_scoped" on public.job_openings;
drop policy if exists "jobs_admin_update_scoped" on public.job_openings;
drop policy if exists "jobs_admin_delete_scoped" on public.job_openings;

create policy "jobs_public_open_read"
on public.job_openings
for select
using (status = 'open' or public.is_admin_user());

create policy "jobs_admin_write_scoped"
on public.job_openings
for insert
with check (
  public.is_admin_user() and organization_id = public.current_user_organization_id()
);

create policy "jobs_admin_update_scoped"
on public.job_openings
for update
using (
  public.is_admin_user() and organization_id = public.current_user_organization_id()
)
with check (
  public.is_admin_user() and organization_id = public.current_user_organization_id()
);

create policy "jobs_admin_delete_scoped"
on public.job_openings
for delete
using (
  public.is_admin_user() and organization_id = public.current_user_organization_id()
);

drop policy if exists "admin_manage_applications" on public.applications;
drop policy if exists "public_can_submit_applications" on public.applications;
drop policy if exists "admin_manage_applications_scoped" on public.applications;

create policy "public_can_submit_applications"
on public.applications
for insert
with check (organization_id is not null);

create policy "admin_manage_applications_scoped"
on public.applications
for all
using (
  public.is_admin_user() and organization_id = public.current_user_organization_id()
)
with check (
  public.is_admin_user() and organization_id = public.current_user_organization_id()
);

drop policy if exists "public_can_create_applicant" on public.applicants;
create policy "public_can_create_applicant"
on public.applicants
for insert
with check (organization_id is not null);
drop policy if exists "admin_can_view_applicants" on public.applicants;
drop policy if exists "admin_can_update_applicants" on public.applicants;
drop policy if exists "admin_can_view_applicants_scoped" on public.applicants;
drop policy if exists "admin_can_update_applicants_scoped" on public.applicants;

create policy "admin_can_view_applicants_scoped"
on public.applicants
for select
using (
  public.is_admin_user() and organization_id = public.current_user_organization_id()
);

create policy "admin_can_update_applicants_scoped"
on public.applicants
for update
using (
  public.is_admin_user() and organization_id = public.current_user_organization_id()
)
with check (
  public.is_admin_user() and organization_id = public.current_user_organization_id()
);

drop policy if exists "admin_manage_employees" on public.employees;
drop policy if exists "admin_manage_employees_scoped" on public.employees;

create policy "admin_manage_employees_scoped"
on public.employees
for all
using (
  public.is_admin_user() and organization_id = public.current_user_organization_id()
)
with check (
  public.is_admin_user() and organization_id = public.current_user_organization_id()
);

drop policy if exists "departments_admin_only" on public.departments;
drop policy if exists "departments_admin_scoped" on public.departments;

create policy "departments_admin_scoped"
on public.departments
for all
using (
  public.is_admin_user() and organization_id = public.current_user_organization_id()
)
with check (
  public.is_admin_user() and organization_id = public.current_user_organization_id()
);

