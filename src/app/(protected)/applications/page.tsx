import { FileStack } from "lucide-react";

import { ApplicationsClient } from "@/components/applications/applications-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QueryPagination } from "@/components/ui/query-pagination";
import { Select } from "@/components/ui/select";
import { listApplicationsPaginated } from "@/features/applications/service";
import { listDepartments } from "@/features/departments/service";
import type { ApplicationStatus, RoleType } from "@/types/domain";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const PAGE_SIZE = 10;
const ROLE_TYPES: readonly RoleType[] = ["faculty", "staff"];
const APPLICATION_STATUSES: readonly ApplicationStatus[] = [
  "submitted",
  "under_review",
  "shortlisted",
  "interview_scheduled",
  "interviewed",
  "for_requirements",
  "accepted",
  "rejected",
  "withdrawn"
];

function parseEnumValue<T extends string>(value: string | string[] | undefined, allowed: readonly T[]): T | undefined {
  if (typeof value !== "string") return undefined;
  return allowed.includes(value as T) ? (value as T) : undefined;
}

function toPositiveInt(value: string | string[] | undefined, fallback: number): number {
  if (typeof value !== "string") return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export default async function ApplicationsPage({ searchParams }: Props) {
  const query = await searchParams;
  const q = typeof query.q === "string" ? query.q : "";
  const status = parseEnumValue(query.status, APPLICATION_STATUSES);
  const departmentId = typeof query.departmentId === "string" ? query.departmentId : undefined;
  const roleType = parseEnumValue(query.roleType, ROLE_TYPES);
  const page = toPositiveInt(query.page, 1);

  const filters = { q, status, departmentId, roleType };
  const departments = await listDepartments();

  let paginated = await listApplicationsPaginated(filters, page, PAGE_SIZE);

  const totalPages = Math.max(1, Math.ceil(paginated.total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  if (currentPage !== page) {
    paginated = await listApplicationsPaginated(filters, currentPage, PAGE_SIZE);
  }

  const { items: applications, total } = paginated;

  return (
    <div className="space-y-6">
      <h2 className="flex items-center gap-2 text-2xl font-semibold text-[#061b31]"><FileStack className="h-6 w-6" />Applications</h2>

      <form className="grid gap-2 rounded-lg border border-[#e5edf5] bg-[#f6f9fc] p-4 md:grid-cols-4">
        <Input defaultValue={q} name="q" placeholder="Search applicant/email" />
        <Select defaultValue={status ?? ""} name="status">
          <option value="">All application statuses</option>
          <option value="submitted">Submitted</option>
          <option value="under_review">Under review</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="interview_scheduled">Interview scheduled</option>
          <option value="interviewed">Interviewed</option>
          <option value="for_requirements">For requirements</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="withdrawn">Withdrawn</option>
        </Select>
        <Select defaultValue={departmentId ?? ""} name="departmentId">
          <option value="">All departments</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.department_name}
            </option>
          ))}
        </Select>
        <Select defaultValue={roleType ?? ""} name="roleType">
          <option value="">All role types</option>
          <option value="faculty">Faculty</option>
          <option value="staff">Staff</option>
        </Select>
        <Button type="submit" size="sm">Apply Filters</Button>
      </form>

      <div className="overflow-hidden rounded-lg border border-[#e5edf5] bg-[#f6f9fc]">
        <ApplicationsClient applications={applications} />
        <QueryPagination page={currentPage} pageSize={PAGE_SIZE} total={total} />
      </div>
    </div>
  );
}

