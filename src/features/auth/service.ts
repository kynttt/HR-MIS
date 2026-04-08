import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { isAdminRole, type AdminRole, type AppUserRole } from "@/lib/utils/constants";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentUserRole(): Promise<AppUserRole | null> {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) {
    return null;
  }

  return data.role;
}

export async function getCurrentAdminRole(): Promise<AdminRole | null> {
  const role = await getCurrentUserRole();
  return isAdminRole(role) ? role : null;
}

export async function getAuthenticatedHomePath(): Promise<"/dashboard" | "/profile"> {
  const role = await getCurrentUserRole();
  return isAdminRole(role) ? "/dashboard" : "/profile";
}

export async function requireAdminRole(allowedRoles: readonly AdminRole[]) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const role = await getCurrentUserRole();

  if (!isAdminRole(role) || !allowedRoles.includes(role)) {
    redirect("/unauthorized");
  }

  return { user, role };
}

