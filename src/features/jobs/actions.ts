"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/utils/audit";

import { jobOpeningSchema } from "./schema";

export async function createJobOpeningAction(input: unknown) {
  const payload = jobOpeningSchema.parse(input);
  const supabase = await createClient();

  const {
    data: { session }
  } = await supabase.auth.getSession();

  const { data, error } = await supabase
    .from("job_openings")
    .insert({
      ...payload,
      created_by: session?.user.id ?? null
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false as const, error: error.message };
  }

  await logAudit("create_job_opening", "job_openings", data.id, { role_type: payload.role_type });

  revalidatePath("/jobs");
  revalidatePath("/apply");
  return { ok: true as const };
}

export async function updateJobOpeningAction(id: string, input: unknown) {
  const payload = jobOpeningSchema.parse(input);
  const supabase = await createClient();

  const { error } = await supabase
    .from("job_openings")
    .update({
      ...payload,
      description: payload.description?.trim() ? payload.description : null,
      qualifications: payload.qualifications?.trim() ? payload.qualifications : null
    })
    .eq("id", id);

  if (error) {
    return { ok: false as const, error: error.message };
  }

  await logAudit("update_job_opening", "job_openings", id, { role_type: payload.role_type });

  revalidatePath("/jobs");
  revalidatePath(`/jobs/${id}/edit`);
  revalidatePath("/apply");

  return { ok: true as const };
}

export async function setJobOpeningStatusAction(id: string, status: "open" | "closed"): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("job_openings").update({ status }).eq("id", id);
  if (error) {
    throw new Error(error.message);
  }

  await logAudit("set_job_status", "job_openings", id, { status });

  revalidatePath("/jobs");
  revalidatePath("/apply");
}
