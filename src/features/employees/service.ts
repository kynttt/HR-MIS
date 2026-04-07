import { createClient } from "@/lib/supabase/server";

export type EmployeeFilters = {
  q?: string;
  roleType?: string;
  departmentId?: string;
  employmentStatus?: string;
  active?: string;
};

export type PaginatedEmployeesResult = {
  items: EmployeeListItem[];
  total: number;
};

export type EmployeeListItem = {
  id: string;
  employee_id_code: string;
  first_name: string;
  last_name: string;
  email: string;
  role_type: "faculty" | "staff";
  employment_status: "active" | "probationary" | "resigned" | "retired" | "terminated";
  is_active: boolean;
  department_name: string | null;
};

export type EmployeeDetails = {
  id: string;
  employee_id_code: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  suffix: string | null;
  email: string;
  phone: string | null;
  sex: string | null;
  civil_status: string | null;
  birth_date: string | null;
  employment_status: "active" | "probationary" | "resigned" | "retired" | "terminated";
  employment_type: "full_time" | "part_time" | "contractual" | "job_order";
  role_type: "faculty" | "staff";
  department_id: string;
  position_title: string;
  hire_date: string;
  campus: string | null;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  notes: string | null;
  is_active: boolean;
  department_name: string | null;
  faculty_profile: {
    academic_rank: string | null;
    highest_education: string | null;
    specialization: string | null;
    teaching_status: string | null;
    tenure_status: string | null;
  } | null;
  staff_profile: {
    staff_category: string | null;
    office_assignment: string | null;
  } | null;
  documents: Array<{ id: string; document_type: string; original_file_name: string | null; file_path: string; file_url: string; is_image: boolean }>;
};


function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function isImagePath(value: string): boolean {
  const normalized = value.split("?")[0].toLowerCase();
  return [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp", ".avif"].some((ext) => normalized.endsWith(ext));
}
export async function listEmployees(filters: EmployeeFilters): Promise<EmployeeListItem[]> {
  const supabase = await createClient();

  let query = supabase
    .from("employees")
    .select("id, employee_id_code, first_name, last_name, email, role_type, employment_status, is_active, departments(department_name)")
    .order("created_at", { ascending: false });

  if (filters.roleType) {
    query = query.eq("role_type", filters.roleType);
  }

  if (filters.departmentId) {
    query = query.eq("department_id", filters.departmentId);
  }

  if (filters.employmentStatus) {
    query = query.eq("employment_status", filters.employmentStatus);
  }

  if (filters.active === "true") {
    query = query.eq("is_active", true);
  }
  if (filters.active === "false") {
    query = query.eq("is_active", false);
  }

  if (filters.q) {
    const keyword = filters.q.trim();
    query = query.or(`first_name.ilike.%${keyword}%,last_name.ilike.%${keyword}%,email.ilike.%${keyword}%,employee_id_code.ilike.%${keyword}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((item) => {
    const department = Array.isArray(item.departments) ? item.departments[0] : item.departments;
    return {
      id: item.id,
      employee_id_code: item.employee_id_code,
      first_name: item.first_name,
      last_name: item.last_name,
      email: item.email,
      role_type: item.role_type,
      employment_status: item.employment_status,
      is_active: item.is_active,
      department_name: department?.department_name ?? null
    };
  });
}

export async function getEmployeeDetails(employeeId: string): Promise<EmployeeDetails> {
  const supabase = await createClient();
  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select("*, departments(*), faculty_profiles(*), staff_profiles(*), employee_documents(*)")
    .eq("id", employeeId)
    .single();

  if (employeeError || !employee) {
    throw new Error(employeeError?.message ?? "Employee not found");
  }

  const department = Array.isArray(employee.departments) ? employee.departments[0] : employee.departments;
  const faculty = Array.isArray(employee.faculty_profiles) ? employee.faculty_profiles[0] : employee.faculty_profiles;
  const staff = Array.isArray(employee.staff_profiles) ? employee.staff_profiles[0] : employee.staff_profiles;

  return {
    id: employee.id,
    employee_id_code: employee.employee_id_code,
    first_name: employee.first_name,
    middle_name: employee.middle_name,
    last_name: employee.last_name,
    suffix: employee.suffix,
    email: employee.email,
    phone: employee.phone,
    sex: employee.sex,
    civil_status: employee.civil_status,
    birth_date: employee.birth_date,
    employment_status: employee.employment_status,
    employment_type: employee.employment_type,
    role_type: employee.role_type,
    department_id: employee.department_id,
    position_title: employee.position_title,
    hire_date: employee.hire_date,
    campus: employee.campus,
    address: employee.address,
    emergency_contact_name: employee.emergency_contact_name,
    emergency_contact_phone: employee.emergency_contact_phone,
    notes: employee.notes,
    is_active: employee.is_active,
    department_name: department?.department_name ?? null,
    faculty_profile: faculty
      ? {
          academic_rank: faculty.academic_rank ?? null,
          highest_education: faculty.highest_education ?? null,
          specialization: faculty.specialization ?? null,
          teaching_status: faculty.teaching_status ?? null,
          tenure_status: faculty.tenure_status ?? null
        }
      : null,
    staff_profile: staff
      ? {
          staff_category: staff.staff_category ?? null,
          office_assignment: staff.office_assignment ?? null
        }
      : null,
    documents: (employee.employee_documents ?? []).map((document: { id: string; document_type: string; original_file_name: string | null; file_path: string }) => {
      const fileUrl = isAbsoluteUrl(document.file_path)
        ? document.file_path
        : supabase.storage.from("employee-documents").getPublicUrl(document.file_path).data.publicUrl;

      return {
        id: document.id,
        document_type: document.document_type,
        original_file_name: document.original_file_name ?? null,
        file_path: document.file_path,
        file_url: fileUrl,
        is_image: isImagePath(document.original_file_name ?? document.file_path)
      };
    })
  };
}

export async function listEmployeesPaginated(
  filters: EmployeeFilters,
  page: number,
  pageSize: number
): Promise<PaginatedEmployeesResult> {
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("employees")
    .select("id, employee_id_code, first_name, last_name, email, role_type, employment_status, is_active, departments(department_name)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.roleType) {
    query = query.eq("role_type", filters.roleType);
  }

  if (filters.departmentId) {
    query = query.eq("department_id", filters.departmentId);
  }

  if (filters.employmentStatus) {
    query = query.eq("employment_status", filters.employmentStatus);
  }

  if (filters.active === "true") {
    query = query.eq("is_active", true);
  }
  if (filters.active === "false") {
    query = query.eq("is_active", false);
  }

  if (filters.q) {
    const keyword = filters.q.trim();
    query = query.or(`first_name.ilike.%${keyword}%,last_name.ilike.%${keyword}%,email.ilike.%${keyword}%,employee_id_code.ilike.%${keyword}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const items = (data ?? []).map((item) => {
    const department = Array.isArray(item.departments) ? item.departments[0] : item.departments;
    return {
      id: item.id,
      employee_id_code: item.employee_id_code,
      first_name: item.first_name,
      last_name: item.last_name,
      email: item.email,
      role_type: item.role_type,
      employment_status: item.employment_status,
      is_active: item.is_active,
      department_name: department?.department_name ?? null
    };
  });

  return { items, total: count ?? 0 };
}



