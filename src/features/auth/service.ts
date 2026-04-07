import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ADMIN_ROLES, type AdminRole } from "@/lib/utils/constants";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentUserRole(): Promise<AdminRole | null> {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!data) {
    return null;
  }

  if (!ADMIN_ROLES.includes(data.role)) {
    return null;
  }

  return data.role;
}

export async function requireAdminRole(allowedRoles: readonly AdminRole[]) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const role = await getCurrentUserRole();

  if (!role || !allowedRoles.includes(role)) {
    redirect("/dashboard?error=unauthorized");
  }

  return { user, role };
}