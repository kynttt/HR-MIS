import { getCurrentUserOrganizationId } from "@/features/organizations/service";
import { createClient } from "@/lib/supabase/server";
import type { ApplicationStatus, RoleType } from "@/types/domain";

export type ApplicationFilters = {
  q?: string;
  status?: ApplicationStatus;
  departmentId?: string;
  roleType?: RoleType;
};

export type PaginatedApplicationsResult = {
  items: ApplicationListItem[];
  total: number;
};

export type ApplicationListItem = {
  id: string;
  status: ApplicationStatus;
  submitted_at: string;
  updated_at: string;
  applicant: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  job: {
    job_title: string;
    role_type: "faculty" | "staff";
    department_name: string | null;
  } | null;
};

export type ApplicationDetails = {
  id: string;
  status: ApplicationStatus;
  submitted_at: string;
  converted_employee_id: string | null;
  applicant: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
  };
  documents: Array<{
    id: string;
    document_type: string;
    original_file_name: string | null;
    file_path: string;
    file_url: string;
    is_image: boolean;
  }>;
  notes: Array<{ id: string; note_text: string }>;
  status_history: Array<{ id: string; from_status: string | null; to_status: string; changed_at: string }>;
};

function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function isImagePath(value: string): boolean {
  const normalized = value.split("?")[0].toLowerCase();
  return [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp", ".avif"].some((ext) => normalized.endsWith(ext));
}

export async function listApplications(filters: ApplicationFilters): Promise<ApplicationListItem[]> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganizationId();

  const keyword = filters.q?.trim() ?? "";
  const applicantJoin = keyword ? "applicants!inner(first_name, last_name, email)" : "applicants(first_name, last_name, email)";
  const requiresJobInnerJoin = Boolean(filters.roleType || filters.departmentId);
  const jobOpeningsJoin = requiresJobInnerJoin
    ? "job_openings!inner(job_title, role_type, department_id, departments(id, department_name))"
    : "job_openings(job_title, role_type, department_id, departments(id, department_name))";

  let query = supabase
    .from("applications")
    .select(`id, status, submitted_at, updated_at, ${applicantJoin}, ${jobOpeningsJoin}`)
    .eq("organization_id", organizationId)
    .order("submitted_at", { ascending: false });

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.roleType) {
    query = query.eq("job_openings.role_type", filters.roleType);
  }

  if (filters.departmentId) {
    query = query.eq("job_openings.department_id", filters.departmentId);
  }

  if (keyword) {
    query = query.or(`first_name.ilike.%${keyword}%,last_name.ilike.%${keyword}%,email.ilike.%${keyword}%`, {
      foreignTable: "applicants"
    });
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((item) => {
    const applicant = Array.isArray(item.applicants) ? item.applicants[0] : item.applicants;
    const job = Array.isArray(item.job_openings) ? item.job_openings[0] : item.job_openings;
    let department: { department_name: string } | null = null;
    if (job) {
      const rawDepartment = job.departments;
      department = Array.isArray(rawDepartment) ? rawDepartment[0] ?? null : rawDepartment ?? null;
    }

    return {
      id: item.id,
      status: item.status,
      submitted_at: item.submitted_at,
      updated_at: item.updated_at,
      applicant: applicant
        ? {
            first_name: applicant.first_name,
            last_name: applicant.last_name,
            email: applicant.email
          }
        : null,
      job: job
        ? {
            job_title: job.job_title,
            role_type: job.role_type,
            department_name: department?.department_name ?? null
          }
        : null
    };
  });
}

export async function getApplicationDetails(applicationId: string): Promise<ApplicationDetails> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganizationId();

  const { data: application, error: applicationError } = await supabase
    .from("applications")
    .select("id, status, submitted_at, converted_employee_id, applicants(*), job_openings(*, departments(*)), application_documents(*), application_notes(*), application_status_history(*)")
    .eq("id", applicationId)
    .eq("organization_id", organizationId)
    .single();

  if (applicationError || !application) {
    throw new Error(applicationError?.message ?? "Application not found");
  }

  const applicantRow = Array.isArray(application.applicants) ? application.applicants[0] : application.applicants;

  if (!applicantRow) {
    throw new Error("Applicant not found");
  }

  return {
    id: application.id,
    status: application.status,
    submitted_at: application.submitted_at,
    converted_employee_id: application.converted_employee_id,
    applicant: {
      first_name: applicantRow.first_name,
      last_name: applicantRow.last_name,
      email: applicantRow.email,
      phone: applicantRow.phone ?? null
    },
    documents: (application.application_documents ?? []).map((document) => {
      const fileUrl = isAbsoluteUrl(document.file_path)
        ? document.file_path
        : supabase.storage.from("application-documents").getPublicUrl(document.file_path).data.publicUrl;

      return {
        id: document.id,
        document_type: document.document_type,
        original_file_name: document.original_file_name ?? null,
        file_path: document.file_path,
        file_url: fileUrl,
        is_image: isImagePath(document.original_file_name ?? document.file_path)
      };
    }),
    notes: (application.application_notes ?? []).map((note) => ({
      id: note.id,
      note_text: note.note_text
    })),
    status_history: (application.application_status_history ?? []).map((item) => ({
      id: item.id,
      from_status: item.from_status,
      to_status: item.to_status,
      changed_at: item.changed_at
    }))
  };
}

export async function listApplicationsPaginated(
  filters: ApplicationFilters,
  page: number,
  pageSize: number
): Promise<PaginatedApplicationsResult> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganizationId();

  const keyword = filters.q?.trim() ?? "";
  const applicantJoin = keyword ? "applicants!inner(first_name, last_name, email)" : "applicants(first_name, last_name, email)";
  const requiresJobInnerJoin = Boolean(filters.roleType || filters.departmentId);
  const jobOpeningsJoin = requiresJobInnerJoin
    ? "job_openings!inner(job_title, role_type, department_id, departments(id, department_name))"
    : "job_openings(job_title, role_type, department_id, departments(id, department_name))";

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("applications")
    .select(`id, status, submitted_at, updated_at, ${applicantJoin}, ${jobOpeningsJoin}`, { count: "exact" })
    .eq("organization_id", organizationId)
    .order("submitted_at", { ascending: false })
    .range(from, to);

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.roleType) {
    query = query.eq("job_openings.role_type", filters.roleType);
  }

  if (filters.departmentId) {
    query = query.eq("job_openings.department_id", filters.departmentId);
  }

  if (keyword) {
    query = query.or(`first_name.ilike.%${keyword}%,last_name.ilike.%${keyword}%,email.ilike.%${keyword}%`, {
      foreignTable: "applicants"
    });
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const items = (data ?? []).map((item) => {
    const applicant = Array.isArray(item.applicants) ? item.applicants[0] : item.applicants;
    const job = Array.isArray(item.job_openings) ? item.job_openings[0] : item.job_openings;
    let department: { department_name: string } | null = null;
    if (job) {
      const rawDepartment = job.departments;
      department = Array.isArray(rawDepartment) ? rawDepartment[0] ?? null : rawDepartment ?? null;
    }

    return {
      id: item.id,
      status: item.status,
      submitted_at: item.submitted_at,
      updated_at: item.updated_at,
      applicant: applicant
        ? {
            first_name: applicant.first_name,
            last_name: applicant.last_name,
            email: applicant.email
          }
        : null,
      job: job
        ? {
            job_title: job.job_title,
            role_type: job.role_type,
            department_name: department?.department_name ?? null
          }
        : null
    };
  });

  return { items, total: count ?? 0 };
}
