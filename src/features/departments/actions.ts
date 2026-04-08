"use server";

import { revalidatePath } from "next/cache";

import { requireAdminRole } from "@/features/auth/service";
import { logAudit } from "@/lib/utils/audit";
import { createClient } from "@/lib/supabase/server";

import { departmentSchema } from "./schema";

const DEPARTMENT_MANAGEMENT_ROLES = ["super_admin", "hr_admin", "department_admin"] as const;

export async function createDepartmentAction(input: unknown) {
  await requireAdminRole(DEPARTMENT_MANAGEMENT_ROLES);

  const payload = departmentSchema.parse(input);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("departments")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    return { ok: false as const, error: error.message };
  }

  await logAudit("create_department", "departments", data.id, { department_code: payload.department_code });

  revalidatePath("/departments");
  return { ok: true as const };
}

export async function toggleDepartmentAction(id: string, isActive: boolean): Promise<void> {
  await requireAdminRole(DEPARTMENT_MANAGEMENT_ROLES);

  const supabase = await createClient();

  const { error } = await supabase.from("departments").update({ is_active: isActive }).eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  await logAudit("update_department_active", "departments", id, { is_active: isActive });

  revalidatePath("/departments");
}
