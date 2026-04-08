import { createClient } from "@/lib/supabase/server";
import type { ApplicationStatus, EmploymentType, RoleType } from "@/types/domain";

export type ApplicantApplicationSummary = {
  application_id: string;
  status: ApplicationStatus;
  submitted_at: string;
  job_title: string;
  role_type: RoleType | null;
  employment_type: EmploymentType | null;
  organization_name: string | null;
};

type JobRow = {
  job_title: string;
  role_type: RoleType;
  employment_type: EmploymentType;
  organizations: { name: string } | Array<{ name: string }> | null;
};

type ApplicationRow = {
  id: string;
  status: ApplicationStatus;
  submitted_at: string;
  job_openings: JobRow | Array<JobRow> | null;
};

export async function listCurrentUserApplications(userId: string): Promise<ApplicantApplicationSummary[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("applications")
    .select("id, status, submitted_at, job_openings(job_title, role_type, employment_type, organizations(name))")
    .eq("submitted_by_user_id", userId)
    .order("submitted_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as ApplicationRow[];

  return rows.map((row) => {
    const job = Array.isArray(row.job_openings) ? row.job_openings[0] ?? null : row.job_openings;
    const organization = job
      ? Array.isArray(job.organizations)
        ? job.organizations[0] ?? null
        : job.organizations
      : null;

    return {
      application_id: row.id,
      status: row.status,
      submitted_at: row.submitted_at,
      job_title: job?.job_title ?? "Unknown Role",
      role_type: job?.role_type ?? null,
      employment_type: job?.employment_type ?? null,
      organization_name: organization?.name ?? null
    };
  });
}
