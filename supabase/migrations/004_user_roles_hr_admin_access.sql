-- Allow HR admins to manage user roles alongside super admins.
-- Department admins remain read-limited to their own role row.

drop policy if exists "roles_select_self_or_super_admin" on public.user_roles;
drop policy if exists "roles_admin_only" on public.user_roles;

create policy "roles_select_self_or_super_hr_admin"
on public.user_roles
for select
using (
  user_id = auth.uid()
  or public.has_role(array['super_admin', 'hr_admin']::public.user_role[])
);

create policy "roles_admin_only"
on public.user_roles
for all
using (public.has_role(array['super_admin', 'hr_admin']::public.user_role[]))
with check (public.has_role(array['super_admin', 'hr_admin']::public.user_role[]));