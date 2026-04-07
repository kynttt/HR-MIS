import { createClient } from "@/lib/supabase/server";

export type JobOpeningListItem = {
  id: string;
  job_title: string;
  role_type: "faculty" | "staff";
  employment_type: "full_time" | "part_time" | "contractual" | "job_order";
  status: "open" | "closed";
  created_at: string;
  department_name: string | null;
};

export type OpenJobListItem = {
  id: string;
  job_title: string;
  role_type: "faculty" | "staff";
  employment_type: "full_time" | "part_time" | "contractual" | "job_order";
  department_name: string | null;
};

export type JobOpeningEditDetails = {
  id: string;
  job_title: string;
  department_id: string;
  role_type: "faculty" | "staff";
  employment_type: "full_time" | "part_time" | "contractual" | "job_order";
  description: string | null;
  qualifications: string | null;
  status: "open" | "closed";
};

export type JobOpeningFilters = {
  q?: string;
  status?: string;
  departmentId?: string;
  roleType?: string;
  sort?: string;
  order?: "asc" | "desc";
};

export async function listJobOpenings(filters?: JobOpeningFilters): Promise<JobOpeningListItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("job_openings")
    .select("id, job_title, role_type, employment_type, status, created_at, departments(department_name)")
    .order(filters?.sort === "title" ? "job_title" : "created_at", { ascending: filters?.order === "asc" });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.roleType) {
    query = query.eq("role_type", filters.roleType);
  }
  if (filters?.departmentId) {
    query = query.eq("department_id", filters.departmentId);
  }
  if (filters?.q) {
    query = query.ilike("job_title", `%${filters.q}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((item) => {
    const department = Array.isArray(item.departments) ? item.departments[0] : item.departments;
    return {
      id: item.id,
      job_title: item.job_title,
      role_type: item.role_type,
      employment_type: item.employment_type,
      status: item.status,
      created_at: item.created_at,
      department_name: department?.department_name ?? null
    };
  });
}

export async function getJobOpeningDetails(id: string): Promise<JobOpeningEditDetails> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("job_openings")
    .select("id, job_title, department_id, role_type, employment_type, description, qualifications, status")
    .eq("id", id)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Job opening not found");
  }

  return {
    id: data.id,
    job_title: data.job_title,
    department_id: data.department_id,
    role_type: data.role_type,
    employment_type: data.employment_type,
    description: data.description,
    qualifications: data.qualifications,
    status: data.status
  };
}

export async function listOpenJobOpenings(): Promise<OpenJobListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_openings")
    .select("id, job_title, role_type, employment_type, departments(department_name)")
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((item) => {
    const department = Array.isArray(item.departments) ? item.departments[0] : item.departments;
    return {
      id: item.id,
      job_title: item.job_title,
      role_type: item.role_type,
      employment_type: item.employment_type,
      department_name: department?.department_name ?? null
    };
  });
}
