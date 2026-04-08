-- Require authenticated applicant identity for public apply flow.

alter table public.applicants add column if not exists auth_user_id uuid;
alter table public.applications add column if not exists submitted_by_user_id uuid;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'applicants_auth_user_fk') then
    alter table public.applicants
      add constraint applicants_auth_user_fk
      foreign key (auth_user_id) references auth.users(id) on delete set null;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'applications_submitted_by_user_fk') then
    alter table public.applications
      add constraint applications_submitted_by_user_fk
      foreign key (submitted_by_user_id) references auth.users(id) on delete set null;
  end if;
end $$;

-- Backfill by matching applicant emails to existing auth users when possible.
update public.applicants a
set auth_user_id = u.id
from auth.users u
where a.auth_user_id is null
  and lower(a.email) = lower(u.email);

update public.applications app
set submitted_by_user_id = a.auth_user_id
from public.applicants a
where app.applicant_id = a.id
  and app.submitted_by_user_id is null
  and a.auth_user_id is not null;

create index if not exists idx_applicants_auth_user on public.applicants(auth_user_id);
create index if not exists idx_applications_submitted_by_user on public.applications(submitted_by_user_id);

create unique index if not exists idx_applicants_org_auth_user_unique
  on public.applicants(organization_id, auth_user_id)
  where auth_user_id is not null;

create unique index if not exists idx_applications_org_user_job_unique
  on public.applications(organization_id, submitted_by_user_id, job_opening_id)
  where submitted_by_user_id is not null;

-- Public insert paths now require authenticated ownership.
drop policy if exists "public_can_create_applicant" on public.applicants;
create policy "public_can_create_applicant"
on public.applicants
for insert
with check (
  organization_id is not null
  and auth.uid() is not null
  and auth_user_id = auth.uid()
);

drop policy if exists "public_can_submit_applications" on public.applications;
create policy "public_can_submit_applications"
on public.applications
for insert
with check (
  organization_id is not null
  and auth.uid() is not null
  and submitted_by_user_id = auth.uid()
);

