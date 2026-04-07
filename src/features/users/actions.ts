"use server";

import { revalidatePath } from "next/cache";

import { requireAdminRole } from "@/features/auth/service";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/utils/audit";

import { createUserSchema, inviteUserSchema, updateUserRoleSchema } from "./schema";

function getInviteRedirectTo(): string | undefined {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    return undefined;
  }
  return `${appUrl.replace(/\/$/, "")}/login`;
}

async function upsertProfileAndRole(userId: string, fullName: string, role: "super_admin" | "hr_admin" | "department_admin") {
  const db = await createClient();

  await db.from("profiles").upsert({
    id: userId,
    full_name: fullName
  });

  await db.from("user_roles").delete().eq("user_id", userId);
  await db.from("user_roles").insert({
    user_id: userId,
    role
  });
}

export async function inviteManagedUserAction(input: unknown) {
  await requireAdminRole(["super_admin"]);

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

  await upsertProfileAndRole(data.user.id, payload.full_name, payload.role);

  await logAudit("invite_managed_user", "profiles", data.user.id, { role: payload.role, email: payload.email });

  revalidatePath("/users");
  return { ok: true as const, message: "Invite sent. User must confirm email via link." };
}

export async function createManagedUserAction(input: unknown) {
  await requireAdminRole(["super_admin"]);

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

  await upsertProfileAndRole(data.user.id, payload.full_name, payload.role);

  await logAudit("create_managed_user", "profiles", data.user.id, { role: payload.role, email: payload.email });

  revalidatePath("/users");
  return { ok: true as const, message: "User created immediately (email already confirmed)." };
}

export async function updateManagedUserRoleAction(input: unknown) {
  await requireAdminRole(["super_admin"]);

  const payload = updateUserRoleSchema.parse(input);
  const db = await createClient();

  await db.from("user_roles").delete().eq("user_id", payload.user_id);

  const { error } = await db.from("user_roles").insert({
    user_id: payload.user_id,
    role: payload.role
  });

  if (error) {
    return { ok: false as const, error: error.message };
  }

  await logAudit("update_managed_user_role", "user_roles", payload.user_id, { role: payload.role });

  revalidatePath("/users");
  return { ok: true as const };
}