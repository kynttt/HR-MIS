import Link from "next/link";
import { redirect } from "next/navigation";
import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { QueryPagination } from "@/components/ui/query-pagination";
import { Select } from "@/components/ui/select";
import { getCurrentUser } from "@/features/auth/service";
import { listCurrentUserApplications } from "@/features/profile/service";
import type { ApplicationStatus } from "@/types/domain";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const PAGE_SIZE = 10;
const STATUS_OPTIONS: Array<{ value: ApplicationStatus; label: string }> = [
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "interview_scheduled", label: "Interview Scheduled" },
  { value: "interviewed", label: "Interviewed" },
  { value: "for_requirements", label: "For Requirements" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Withdrawn" }
];

function toLabel(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getStatusVariant(status: string): "default" | "success" | "warning" | "danger" | "muted" {
  if (status === "accepted") return "success";
  if (status === "rejected" || status === "withdrawn") return "danger";
  if (status === "submitted" || status === "under_review") return "default";
  if (status === "shortlisted" || status === "interview_scheduled" || status === "interviewed" || status === "for_requirements") return "warning";
  return "muted";
}

function parsePage(value: string | string[] | undefined): number {
  if (typeof value !== "string") {
    return 1;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

function parseStatus(value: string | string[] | undefined): ApplicationStatus | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  return STATUS_OPTIONS.some((option) => option.value === value) ? (value as ApplicationStatus) : undefined;
}

function parseKeyword(value: string | string[] | undefined): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

export default async function ApplicantApplicationsPage({ searchParams }: Props) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/profile/applications");
  }

  const query = await searchParams;
  const status = parseStatus(query.status);
  const keyword = parseKeyword(query.q).toLowerCase();
  const page = parsePage(query.page);

  const allApplications = await listCurrentUserApplications(user.id);
  const byStatus = status ? allApplications.filter((item) => item.status === status) : allApplications;
  const filtered = keyword
    ? byStatus.filter((item) => `${item.job_title} ${item.organization_name ?? ""} ${item.department_name ?? ""}`.toLowerCase().includes(keyword))
    : byStatus;

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const from = (currentPage - 1) * PAGE_SIZE;
  const pagedApplications = filtered.slice(from, from + PAGE_SIZE);

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-[#dde7f5] bg-white p-5 shadow-[0_16px_34px_-34px_rgba(15,23,42,0.7)] lg:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-[#071b33]">My Applications</h2>
            <p className="mt-1 text-sm text-[#4a617d]">Review all applications submitted with your account.</p>
          </div>
          <form className="grid w-full gap-2 sm:w-auto sm:grid-cols-[220px_170px_auto]" method="get">
            <Input name="q" defaultValue={keyword} placeholder="Search title or org" />
            <Select name="status" defaultValue={status ?? ""}>
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-[#cfdaf0] bg-white px-3 py-2 text-sm font-medium text-[#31465f] transition-colors hover:bg-[#f4f8ff]"
            >
              <Search className="h-4 w-4" />
              Filter
            </button>
          </form>
        </div>
      </section>

      <section className="rounded-xl border border-[#dde7f5] bg-white shadow-[0_16px_34px_-34px_rgba(15,23,42,0.7)]">
        {pagedApplications.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#d7e2f3] bg-[#f8fbff] p-8 text-center">
            <p className="text-sm text-[#5e7490]">No applications found for the selected filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-t-xl">
            <table className="w-full text-sm">
              <thead className="bg-[#f8fbff] text-left text-[#6d829c]">
                <tr>
                  <th className="px-3 py-2">Job Title</th>
                  <th className="px-3 py-2">Organization</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Updated</th>
                  <th className="px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {pagedApplications.map((application) => (
                  <tr key={application.application_id} className="border-t border-[#e7eef9]">
                    <td className="px-3 py-2 font-medium text-[#0f213b]">{application.job_title}</td>
                    <td className="px-3 py-2 text-[#31465f]">{application.organization_name ?? "-"}</td>
                    <td className="px-3 py-2 text-[#31465f]">
                      {application.role_type ? toLabel(application.role_type) : "-"}
                      {application.employment_type ? ` - ${toLabel(application.employment_type)}` : ""}
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant={getStatusVariant(application.status)}>{toLabel(application.status)}</Badge>
                    </td>
                    <td className="px-3 py-2 text-[#31465f]">{new Date(application.updated_at).toLocaleDateString()}</td>
                    <td className="px-3 py-2">
                      <Link className="text-[#3f51d1] hover:text-[#2738b8]" href={`/profile/applications/${application.application_id}`}>
                        View details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <QueryPagination page={currentPage} pageSize={PAGE_SIZE} total={total} />
          </div>
        )}
      </section>
    </div>
  );
}
