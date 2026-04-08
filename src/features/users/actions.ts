"use server";

import { revalidatePath } from "next/cache";

import { requireAdminRole } from "@/features/auth/service";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/utils/audit";

import { createUserSchema, inviteUserSchema, updateUserRoleSchema } from "./schema";

type ManagedRole = "super_admin" | "hr_admin" | "department_admin";

function getInviteRedirectTo(): string | undefined {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    return undefined;
  }
  return `${appUrl.replace(/\/$/, "")}/login`;
}

async function setSingleUserRole(userId: string, role: ManagedRole) {
  const db = await createClient();
  const { data: existingRoles, error: listError } = await db
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (listError) {
    throw new Error(listError.message);
  }

  if (!existingRoles || existingRoles.length === 0) {
    const { error: insertRoleError } = await db.from("user_roles").insert({
      user_id: userId,
      role
    });

    if (insertRoleError) {
      throw new Error(insertRoleError.message);
    }

    return;
  }

  const [primaryRole, ...duplicateRoles] = existingRoles;

  const { error: updateRoleError } = await db.from("user_roles").update({ role }).eq("id", primaryRole.id);
  if (updateRoleError) {
    throw new Error(updateRoleError.message);
  }

  if (duplicateRoles.length > 0) {
    const duplicateIds = duplicateRoles.map((item) => item.id);
    const { error: cleanupError } = await db.from("user_roles").delete().in("id", duplicateIds);

    if (cleanupError) {
      throw new Error(cleanupError.message);
    }
  }
}

async function upsertProfileAndRole(userId: string, fullName: string, role: ManagedRole) {
  const db = await createClient();

  const { error: profileError } = await db.from("profiles").upsert({
    id: userId,
    full_name: fullName
  });

  if (profileError) {
    throw new Error(profileError.message);
  }

  await setSingleUserRole(userId, role);
}

export async function inviteManagedUserAction(input: unknown) {
  await requireAdminRole(["super_admin", "hr_admin"]);

  const payload = inviteUserSchema.parse(input);
  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.inviteUserByEmail(payload.email, {
    data: {
      full_name: payload.full_name
    },
    redirectTo: getInviteRedirectTo()
  });

  if (error || !data.user) {
    return { ok: false as const, error: error?.message ?? "Failed to invite user." };
  }

  try {
    await upsertProfileAndRole(data.user.id, payload.full_name, payload.role);
  } catch (caughtError) {
    return {
      ok: false as const,
      error: caughtError instanceof Error ? caughtError.message : "Failed to assign profile/role."
    };
  }

  await logAudit("invite_managed_user", "profiles", data.user.id, { role: payload.role, email: payload.email });

  revalidatePath("/users");
  return { ok: true as const, message: "Invite sent. User must confirm email via link." };
}

export async function createManagedUserAction(input: unknown) {
  await requireAdminRole(["super_admin", "hr_admin"]);

  const payload = createUserSchema.parse(input);
  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email: payload.email,
    password: payload.password,
    email_confirm: true,
    user_metadata: {
      full_name: payload.full_name
    }
  });

  if (error || !data.user) {
    return { ok: false as const, error: error?.message ?? "Failed to create user." };
  }

  try {
    await upsertProfileAndRole(data.user.id, payload.full_name, payload.role);
  } catch (caughtError) {
    return {
      ok: false as const,
      error: caughtError instanceof Error ? caughtError.message : "Failed to assign profile/role."
    };
  }

  await logAudit("create_managed_user", "profiles", data.user.id, { role: payload.role, email: payload.email });

  revalidatePath("/users");
  return { ok: true as const, message: "User created immediately (email already confirmed)." };
}

export async function updateManagedUserRoleAction(input: unknown) {
  const { user } = await requireAdminRole(["super_admin", "hr_admin"]);

  const payload = updateUserRoleSchema.parse(input);

  if (payload.user_id === user.id && payload.role === "department_admin") {
    return { ok: false as const, error: "You cannot downgrade your own account to department_admin from this panel." };
  }

  try {
    await setSingleUserRole(payload.user_id, payload.role);
  } catch (caughtError) {
    return {
      ok: false as const,
      error: caughtError instanceof Error ? caughtError.message : "Failed to update user role."
    };
  }

  await logAudit("update_managed_user_role", "user_roles", payload.user_id, { role: payload.role });

  revalidatePath("/users");
  return { ok: true as const };
}
