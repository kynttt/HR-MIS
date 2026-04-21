"use server";

import { revalidatePath } from "next/cache";
import { rankAllApplicationsForJob } from "@/skills/ai-applicant-ranking/orchestrator";
import { requireAdminRole } from "@/features/auth/service";

const APPLICATION_MANAGEMENT_ROLES = ["super_admin", "hr_admin", "department_admin"] as const;

export async function rankAllApplicationsForJobAction(jobOpeningId: string) {
  await requireAdminRole(APPLICATION_MANAGEMENT_ROLES);

  try {
    const results = await rankAllApplicationsForJob(jobOpeningId);
    revalidatePath("/jobs");
    revalidatePath("/applications");
    return { ok: true as const, count: results.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ranking failed";
    return { ok: false as const, error: message };
  }
}
