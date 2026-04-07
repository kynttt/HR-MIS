import { createClient } from "@/lib/supabase/server";
import type { ApplicationStatus } from "@/types/domain";

export async function getDashboardMetrics() {
  const supabase = await createClient();

  const [{ count: applicationCount }, { count: employeeCount }, { count: facultyCount }, { count: staffCount }, { count: openJobsCount }] = await Promise.all([
    supabase.from("applications").select("id", { count: "exact", head: true }),
    supabase.from("employees").select("id", { count: "exact", head: true }),
    supabase.from("employees").select("id", { count: "exact", head: true }).eq("role_type", "faculty"),
    supabase.from("employees").select("id", { count: "exact", head: true }).eq("role_type", "staff"),
    supabase.from("job_openings").select("id", { count: "exact", head: true }).eq("status", "open")
  ]);

  const { data: statusRows } = await supabase.from("applications").select("status");

  const byStatus: Record<ApplicationStatus, number> = {
    submitted: 0,
    under_review: 0,
    shortlisted: 0,
    interview_scheduled: 0,
    interviewed: 0,
    for_requirements: 0,
    accepted: 0,
    rejected: 0,
    withdrawn: 0
  };

  const isApplicationStatus = (value: string): value is ApplicationStatus => value in byStatus;

  statusRows?.forEach((row) => {
    if (isApplicationStatus(row.status)) {
      byStatus[row.status] += 1;
    }
  });

  return {
    applicationCount: applicationCount ?? 0,
    employeeCount: employeeCount ?? 0,
    facultyCount: facultyCount ?? 0,
    staffCount: staffCount ?? 0,
    openJobsCount: openJobsCount ?? 0,
    byStatus
  };
}

export async function getRecentActivity() {
  const supabase = await createClient();

  const [{ data: recentApplications }, { data: recentEmployees }] = await Promise.all([
    supabase
      .from("applications")
      .select(`
        id,
        status,
        submitted_at,
        applicants(first_name, last_name, email),
        job_openings(job_title)
      `)
      .order("submitted_at", { ascending: false })
      .limit(5),
    supabase
      .from("employees")
      .select(`
        id,
        created_at,
        first_name,
        last_name,
        email,
        departments(department_name)
      `)
      .order("created_at", { ascending: false })
      .limit(5)
  ]);

  return { recentApplications, recentEmployees };
}

export async function getDepartmentChart() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("employees")
    .select("departments(department_name)");

  const counts: Record<string, number> = {};
  data?.forEach((row) => {
    const dept = (row.departments as unknown as { department_name: string } | null)?.department_name;
    if (dept) {
      counts[dept] = (counts[dept] ?? 0) + 1;
    }
  });

  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}
