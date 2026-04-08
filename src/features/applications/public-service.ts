import { createAdminClient } from "@/lib/supabase/admin";

export async function listAppliedJobIdsForUser(options: {
  userId: string;
  organizationId?: string;
  jobIds?: string[];
}): Promise<Set<string>> {
  const supabase = createAdminClient();
  const uniqueJobIds = Array.from(new Set(options.jobIds ?? []));

  if (uniqueJobIds.length === 0) {
    return new Set<string>();
  }

  let query = supabase.from("applications").select("job_opening_id").eq("submitted_by_user_id", options.userId).in("job_opening_id", uniqueJobIds);

  if (options.organizationId) {
    query = query.eq("organization_id", options.organizationId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return new Set((data ?? []).map((item) => item.job_opening_id));
}

