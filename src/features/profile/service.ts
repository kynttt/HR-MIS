import { createClient } from "@/lib/supabase/server";
import type { ApplicationStatus, EmploymentType, RoleType } from "@/types/domain";

export type ApplicantApplicationSummary = {
  application_id: string;
  status: ApplicationStatus;
  submitted_at: string;
  updated_at: string;
  job_title: string;
  role_type: RoleType | null;
  employment_type: EmploymentType | null;
  organization_name: string | null;
  department_name: string | null;
};

export type ApplicantApplicationDetails = {
  application_id: string;
  status: ApplicationStatus;
  submitted_at: string;
  updated_at: string;
  job_title: string;
  role_type: RoleType | null;
  employment_type: EmploymentType | null;
  description: string | null;
  qualifications: string | null;
  organization_name: string | null;
  organization_slug: string | null;
  department_name: string | null;
};

export type ApplicantProfileSettings = {
  full_name: string;
  email: string;
  has_applicant_profile: boolean;
  first_name: string;
  middle_name: string;
  last_name: string;
  suffix: string;
  phone: string;
  address: string;
  birth_date: string;
  sex: string;
  civil_status: string;
};

type OrganizationRow = { name: string; slug: string };
type DepartmentRow = { department_name: string };

type JobRow = {
  job_title: string;
  role_type: RoleType;
  employment_type: EmploymentType;
  description?: string | null;
  qualifications?: string | null;
  organizations: OrganizationRow | Array<OrganizationRow> | null;
  departments?: DepartmentRow | Array<DepartmentRow> | null;
};

type ApplicationRow = {
  id: string;
  status: ApplicationStatus;
  submitted_at: string;
  updated_at: string;
  job_openings: JobRow | Array<JobRow> | null;
};

type ApplicantSettingsRow = {
  first_name: string;
  middle_name: string | null;
  last_name: string;
  suffix: string | null;
  phone: string | null;
  address: string | null;
  birth_date: string | null;
  sex: string | null;
  civil_status: string | null;
};

function normalizeJob(row: ApplicationRow): JobRow | null {
  return Array.isArray(row.job_openings) ? row.job_openings[0] ?? null : row.job_openings;
}

function normalizeOrganization(job: JobRow | null): OrganizationRow | null {
  if (!job) return null;
  return Array.isArray(job.organizations) ? job.organizations[0] ?? null : job.organizations;
}

function normalizeDepartment(job: JobRow | null): DepartmentRow | null {
  if (!job) return null;
  if (!job.departments) return null;
  return Array.isArray(job.departments) ? job.departments[0] ?? null : job.departments;
}

export async function listCurrentUserApplications(userId: string): Promise<ApplicantApplicationSummary[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("applications")
    .select("id, status, submitted_at, updated_at, job_openings(job_title, role_type, employment_type, departments(department_name), organizations(name, slug))")
    .eq("submitted_by_user_id", userId)
    .order("submitted_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as ApplicationRow[];

  return rows.map((row) => {
    const job = normalizeJob(row);
    const organization = normalizeOrganization(job);
    const department = normalizeDepartment(job);

    return {
      application_id: row.id,
      status: row.status,
      submitted_at: row.submitted_at,
      updated_at: row.updated_at,
      job_title: job?.job_title ?? "Unknown Role",
      role_type: job?.role_type ?? null,
      employment_type: job?.employment_type ?? null,
      organization_name: organization?.name ?? null,
      department_name: department?.department_name ?? null
    };
  });
}

export async function getCurrentUserApplicationDetails(userId: string, applicationId: string): Promise<ApplicantApplicationDetails | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("applications")
    .select(
      "id, status, submitted_at, updated_at, job_openings(job_title, role_type, employment_type, description, qualifications, departments(department_name), organizations(name, slug))"
    )
    .eq("id", applicationId)
    .eq("submitted_by_user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const row = data as ApplicationRow;
  const job = normalizeJob(row);
  const organization = normalizeOrganization(job);
  const department = normalizeDepartment(job);

  return {
    application_id: row.id,
    status: row.status,
    submitted_at: row.submitted_at,
    updated_at: row.updated_at,
    job_title: job?.job_title ?? "Role details unavailable",
    role_type: job?.role_type ?? null,
    employment_type: job?.employment_type ?? null,
    description: job?.description ?? null,
    qualifications: job?.qualifications ?? null,
    organization_name: organization?.name ?? null,
    organization_slug: organization?.slug ?? null,
    department_name: department?.department_name ?? null
  };
}

export async function getCurrentUserProfileSettings(userId: string, email: string): Promise<ApplicantProfileSettings> {
  const supabase = await createClient();

  const [{ data: profileRow, error: profileError }, { data: applicantRow, error: applicantError }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle(),
    supabase
      .from("applicants")
      .select("first_name, middle_name, last_name, suffix, phone, address, birth_date, sex, civil_status")
      .eq("auth_user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle()
  ]);

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (applicantError) {
    throw new Error(applicantError.message);
  }

  const applicant = applicantRow as ApplicantSettingsRow | null;

  return {
    full_name: profileRow?.full_name ?? "",
    email,
    has_applicant_profile: Boolean(applicant),
    first_name: applicant?.first_name ?? "",
    middle_name: applicant?.middle_name ?? "",
    last_name: applicant?.last_name ?? "",
    suffix: applicant?.suffix ?? "",
    phone: applicant?.phone ?? "",
    address: applicant?.address ?? "",
    birth_date: applicant?.birth_date ?? "",
    sex: applicant?.sex ?? "",
    civil_status: applicant?.civil_status ?? ""
  };
}
