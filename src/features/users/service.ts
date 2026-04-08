import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { AppUserRole } from "@/lib/utils/constants";

export type ManagedUser = {
  user_id: string;
  email: string;
  full_name: string | null;
  role: AppUserRole | null;
  created_at: string;
  email_confirmed_at: string | null;
};

export async function listManagedUsers(): Promise<ManagedUser[]> {
  const admin = createAdminClient();
  const db = await createClient();

  const [{ data: userData, error: userError }, { data: rolesData }, { data: profilesData }] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 200 }),
    db.from("user_roles").select("user_id, role"),
    db.from("profiles").select("id, full_name")
  ]);

  if (userError) {
    throw new Error(userError.message);
  }

  const roleMap = new Map<string, AppUserRole>();
  for (const row of rolesData ?? []) {
    roleMap.set(row.user_id, row.role);
  }

  const nameMap = new Map<string, string | null>();
  for (const row of profilesData ?? []) {
    nameMap.set(row.id, row.full_name);
  }

  return (userData.users ?? []).map((user) => ({
    user_id: user.id,
    email: user.email ?? "",
    full_name: nameMap.get(user.id) ?? null,
    role: roleMap.get(user.id) ?? null,
    created_at: user.created_at,
    email_confirmed_at: user.email_confirmed_at ?? null
  }));
}
