import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import process from "process";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.");
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const firstNames = [
  "Liam", "Noah", "Ethan", "Mason", "Lucas", "Logan", "Aiden", "James", "Caleb", "Elijah",
  "Olivia", "Emma", "Ava", "Sophia", "Mia", "Isabella", "Amelia", "Harper", "Evelyn", "Abigail"
];

const lastNames = [
  "Reyes", "Santos", "Dela Cruz", "Garcia", "Mendoza", "Torres", "Flores", "Navarro", "Aquino", "Bautista",
  "Ramos", "Fernandez", "Morales", "Castillo", "Domingo", "Valdez", "Suarez", "Lim", "Tan", "Villanueva"
];

const jobTitlesFaculty = [
  "Assistant Professor I", "Assistant Professor II", "Instructor I", "Instructor II", "Lecturer"
];

const jobTitlesStaff = [
  "HR Assistant", "Records Officer", "Administrative Assistant", "Payroll Specialist", "Recruitment Officer"
];

function pick(arr, i) {
  return arr[i % arr.length];
}

function makeEmail(prefix, i) {
  return `${prefix}.${String(i + 1).padStart(2, "0")}@sample-univ.edu`;
}

async function main() {
  const { data: departments, error: deptError } = await supabase
    .from("departments")
    .select("id, department_name")
    .eq("is_active", true)
    .order("department_name", { ascending: true });

  if (deptError) throw deptError;
  if (!departments || departments.length === 0) {
    throw new Error("No active departments found. Seed departments first.");
  }

  const nowSuffix = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 12);

  const applicants = Array.from({ length: 20 }, (_, i) => ({
    id: randomUUID(),
    first_name: pick(firstNames, i),
    middle_name: i % 3 === 0 ? "Maria" : null,
    last_name: pick(lastNames, i),
    email: makeEmail("applicant", i),
    phone: `0917${String(1000000 + i).padStart(7, "0")}`,
    address: `Sample Address Block ${i + 1}`
  }));

  const { error: applicantError } = await supabase.from("applicants").insert(applicants);
  if (applicantError) throw applicantError;

  const jobs = Array.from({ length: 20 }, (_, i) => {
    const roleType = i % 2 === 0 ? "faculty" : "staff";
    const employmentType = i % 3 === 0 ? "part_time" : "full_time";
    const titlePool = roleType === "faculty" ? jobTitlesFaculty : jobTitlesStaff;

    return {
      id: randomUUID(),
      job_title: `${pick(titlePool, i)} ${i + 1}`,
      department_id: departments[i % departments.length].id,
      role_type: roleType,
      employment_type: employmentType,
      description: `Sample ${roleType} job opening ${i + 1}.`,
      qualifications: `Required qualifications for sample job ${i + 1}.`,
      status: i % 5 === 0 ? "closed" : "open"
    };
  });

  const { error: jobError } = await supabase.from("job_openings").insert(jobs);
  if (jobError) throw jobError;

  const employees = Array.from({ length: 20 }, (_, i) => {
    const roleType = i % 2 === 0 ? "faculty" : "staff";
    const employmentType = i % 3 === 0 ? "part_time" : "full_time";

    return {
      id: randomUUID(),
      employee_id_code: `EMP-SAMPLE-${nowSuffix}-${String(i + 1).padStart(2, "0")}`,
      first_name: pick(firstNames, i + 2),
      middle_name: i % 4 === 0 ? "Anne" : null,
      last_name: pick(lastNames, i + 5),
      email: makeEmail("employee", i),
      phone: `0928${String(2000000 + i).padStart(7, "0")}`,
      employment_status: i % 7 === 0 ? "probationary" : "active",
      employment_type: employmentType,
      role_type: roleType,
      department_id: departments[i % departments.length].id,
      position_title: roleType === "faculty" ? `Faculty Member ${i + 1}` : `Staff Member ${i + 1}`,
      hire_date: new Date(Date.now() - i * 86400000 * 15).toISOString().slice(0, 10),
      campus: i % 2 === 0 ? "Main Campus" : "North Campus",
      address: `Employee Address ${i + 1}`,
      is_active: true
    };
  });

  const { error: empError } = await supabase.from("employees").insert(employees);
  if (empError) throw empError;

  const facultyProfiles = employees
    .filter((e) => e.role_type === "faculty")
    .map((e, i) => ({
      employee_id: e.id,
      academic_rank: i % 2 === 0 ? "Assistant Professor" : "Instructor",
      highest_education: i % 3 === 0 ? "PhD" : "Master's Degree",
      specialization: `Specialization ${i + 1}`,
      teaching_status: "full_load",
      tenure_status: i % 4 === 0 ? "tenured" : "probationary"
    }));

  const staffProfiles = employees
    .filter((e) => e.role_type === "staff")
    .map((e, i) => ({
      employee_id: e.id,
      staff_category: i % 2 === 0 ? "Administrative" : "Technical",
      office_assignment: `Office ${i + 1}`
    }));

  const { error: facError } = await supabase.from("faculty_profiles").insert(facultyProfiles);
  if (facError) throw facError;

  const { error: staffError } = await supabase.from("staff_profiles").insert(staffProfiles);
  if (staffError) throw staffError;

  console.log("Inserted sample data:");
  console.log("- Applicants:", applicants.length);
  console.log("- Job Openings:", jobs.length);
  console.log("- Employees:", employees.length);
  console.log("- Faculty Profiles:", facultyProfiles.length);
  console.log("- Staff Profiles:", staffProfiles.length);
}

main().catch((error) => {
  console.error("Failed to seed sample data:", error);
  process.exit(1);
});
