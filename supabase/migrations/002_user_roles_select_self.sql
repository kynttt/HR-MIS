-- Fix authorization for non-super-admin users by allowing users
-- to read their own assigned role row.

create policy "roles_select_self_or_super_admin"
on public.user_roles
for select
using (
  user_id = auth.uid()
  or public.has_role(array['super_admin']::public.user_role[])
);