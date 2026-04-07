import { Briefcase, Building2, GraduationCap, LayoutDashboard, User, UserCheck, Users } from "lucide-react";

import { DepartmentDonut } from "@/components/dashboard/department-chart";
import { MetricCard } from "@/components/dashboard/metric-card";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { StatusChart } from "@/components/dashboard/status-chart";
import { getDashboardMetrics, getDepartmentChart, getRecentActivity } from "@/features/dashboard/service";

export default async function DashboardPage() {
  const [metrics, activity, deptChart] = await Promise.all([getDashboardMetrics(), getRecentActivity(), getDepartmentChart()]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[#e5edf5] bg-[#ffffff] p-5 sm:p-6">
        <p className="code-label text-xs text-[#64748d]">Overview</p>
        <h2 className="mt-2 flex items-center gap-2 font-display text-3xl font-medium tracking-tight text-[#061b31]"><LayoutDashboard className="h-7 w-7" />Dashboard</h2>
        <p className="mt-2 max-w-2xl text-sm text-[#64748d]">Operational snapshot of recruitment and employee records across departments.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={<Users className="h-4 w-4" />} label="Total Applications" value={metrics.applicationCount} className="lg:col-span-1" />
        <MetricCard icon={<UserCheck className="h-4 w-4" />} label="Total Employees" value={metrics.employeeCount} className="lg:col-span-1" />
        <MetricCard icon={<Briefcase className="h-4 w-4" />} label="Open Positions" value={metrics.openJobsCount} className="lg:col-span-1" />
        <MetricCard icon={<Building2 className="h-4 w-4" />} label="Departments" value={deptChart.length} className="lg:col-span-1" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <StatusChart data={metrics.byStatus} />
        </div>
        <div>
          <RecentActivity
            recentApplications={activity.recentApplications as unknown as Parameters<typeof RecentActivity>[0]["recentApplications"]}
            recentEmployees={activity.recentEmployees as unknown as Parameters<typeof RecentActivity>[0]["recentEmployees"]}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <DepartmentDonut data={deptChart} />
        </div>
        <MetricCard icon={<GraduationCap className="h-4 w-4" />} label="Faculty" value={metrics.facultyCount} />
        <MetricCard icon={<User className="h-4 w-4" />} label="Staff" value={metrics.staffCount} />
      </div>
    </div>
  );
}
