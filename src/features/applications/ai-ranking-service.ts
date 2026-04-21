"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUserOrganizationId } from "@/features/organizations/service";
import type { RankedApplicant } from "@/features/jobs/types";

export async function getApplicationAIResult(applicationId: string) {
  const organizationId = await getCurrentUserOrganizationId();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("application_ai_scores")
    .select("score, highlights, rationale, provider, model, created_at")
    .eq("application_id", applicationId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getRankedApplicantsForJob(jobOpeningId: string): Promise<RankedApplicant[]> {
  const organizationId = await getCurrentUserOrganizationId();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("applications")
    .select(
      "id, status, submitted_at, applicants(id, first_name, last_name, email), application_ai_scores(score, highlights)"
    )
    .eq("job_opening_id", jobOpeningId)
    .eq("organization_id", organizationId)
    .order("submitted_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((item) => {
    const applicant = Array.isArray(item.applicants) ? item.applicants[0] : item.applicants;
    const scoreRow = Array.isArray(item.application_ai_scores)
      ? item.application_ai_scores[0]
      : item.application_ai_scores;

    return {
      id: item.id,
      applicantId: applicant?.id ?? "",
      name: applicant ? `${applicant.first_name} ${applicant.last_name}`.trim() : "Unknown",
      email: applicant?.email ?? "",
      aiScore: scoreRow ? Math.round(Number(scoreRow.score)) : 0,
      status: item.status,
      appliedAt: item.submitted_at,
      highlights: scoreRow?.highlights ?? [],
    };
  });
}
