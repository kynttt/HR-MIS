import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface RecentActivityProps {
  recentApplications?: {
    id: string;
    status: string;
    submitted_at: string;
    applicants: { first_name: string; last_name: string; email: string } | null;
    job_openings: { job_title: string } | null;
  }[];
  recentEmployees?: {
    id: string;
    created_at: string;
    first_name: string;
    last_name: string;
    email: string;
    departments: { department_name: string } | null;
  }[];
  loading?: boolean;
}

const STATUS_BADGE_VARIANT: Record<string, "success" | "warning" | "danger" | "default" | "muted"> = {
  submitted: "default",
  under_review: "default",
  shortlisted: "success",
  interview_scheduled: "warning",
  interviewed: "warning",
  for_requirements: "warning",
  accepted: "success",
  rejected: "danger",
  withdrawn: "muted"
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function RecentActivity({ recentApplications, recentEmployees, loading }: RecentActivityProps) {
  if (loading) {
    return (
      <div className="rounded-lg border border-[#e5edf5] bg-[#ffffff] p-5">
        <h3 className="font-display text-lg font-medium text-[#061b31]">Recent Activity</h3>
        <div className="mt-4 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1">
                <Skeleton className="mb-1 h-3 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const allActivity = [
    ...(recentApplications ?? []).map((app) => ({
      id: app.id,
      type: "application" as const,
      name: app.applicants ? `${app.applicants.first_name} ${app.applicants.last_name}` : "Unknown Applicant",
      email: app.applicants?.email ?? "",
      detail: app.job_openings?.job_title ?? "Unknown Position",
      status: app.status,
      time: app.submitted_at
    })),
    ...(recentEmployees ?? []).map((emp) => ({
      id: emp.id,
      type: "employee" as const,
      name: `${emp.first_name} ${emp.last_name}`,
      email: emp.email,
      detail: emp.departments?.department_name ?? "Unassigned Department",
      status: "hired" as const,
      time: emp.created_at
    }))
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 6);

  if (allActivity.length === 0) {
    return (
      <div className="rounded-lg border border-[#e5edf5] bg-[#ffffff] p-5">
        <h3 className="font-display text-lg font-medium text-[#061b31]">Recent Activity</h3>
        <p className="py-6 text-center text-sm text-[#64748d]">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#e5edf5] bg-[#ffffff] p-5">
      <h3 className="font-display text-lg font-medium text-[#061b31]">Recent Activity</h3>
      <p className="mt-1 text-xs text-[#64748d]">Latest updates from applications and hires.</p>
      <div className="mt-5 space-y-4">
        {allActivity.map((item) => (
          <div key={`${item.type}-${item.id}`} className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border border-[#e5edf5]">
              <AvatarFallback className="text-xs">{getInitials(item.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Link
                  href={item.type === "application" ? `/applications/${item.id}` : `/employees/${item.id}`}
                  className="truncate text-sm font-medium text-[#061b31] transition-colors hover:text-brand-500"
                >
                  {item.name}
                </Link>
                <Badge variant={item.type === "employee" ? "success" : (STATUS_BADGE_VARIANT[item.status] ?? "muted")} className="px-1.5 py-0 text-xs">
                  {item.type === "employee" ? "Hired" : item.status.replaceAll("_", " ")}
                </Badge>
              </div>
              <p className="truncate text-xs text-[#64748d]">
                {item.detail} | {formatDistanceToNow(new Date(item.time), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
