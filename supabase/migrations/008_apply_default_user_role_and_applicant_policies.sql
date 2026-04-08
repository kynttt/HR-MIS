-- Apply default role assignment and applicant self-access policies.
-- This migration intentionally runs after 007 so enum value `user` is already committed.

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

  insert into public.user_roles (user_id, role)
  values (new.id, 'user'::public.user_role)
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

insert into public.user_roles (user_id, role)
select p.id, 'user'::public.user_role
from public.profiles p
where not exists (
  select 1
  from public.user_roles ur
  where ur.user_id = p.id
);

-- Allow applicants to access their own applicant/application records.
drop policy if exists "applicant_can_view_own_profile" on public.applicants;
create policy "applicant_can_view_own_profile"
on public.applicants
for select
using (
  auth.uid() is not null and auth_user_id = auth.uid()
);

drop policy if exists "applicant_can_update_own_profile" on public.applicants;
create policy "applicant_can_update_own_profile"
on public.applicants
for update
using (
  auth.uid() is not null and auth_user_id = auth.uid()
)
with check (
  auth.uid() is not null and auth_user_id = auth.uid()
);

drop policy if exists "applicant_can_view_own_applications" on public.applications;
create policy "applicant_can_view_own_applications"
on public.applications
for select
using (
  auth.uid() is not null and submitted_by_user_id = auth.uid()
);
