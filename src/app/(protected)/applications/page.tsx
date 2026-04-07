import { FileStack } from "lucide-react";

import { ApplicationsClient } from "@/components/applications/applications-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QueryPagination } from "@/components/ui/query-pagination";
import { Select } from "@/components/ui/select";
import { listApplicationsPaginated } from "@/features/applications/service";
import { listDepartments } from "@/features/departments/service";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const PAGE_SIZE = 10;

function toPositiveInt(value: string | string[] | undefined, fallback: number): number {
  if (typeof value !== "string") return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export default async function ApplicationsPage({ searchParams }: Props) {
  const query = await searchParams;
  const q = typeof query.q === "string" ? query.q : "";
  const status = typeof query.status === "string" ? query.status : "";
  const departmentId = typeof query.departmentId === "string" ? query.departmentId : "";
  const roleType = typeof query.roleType === "string" ? query.roleType : "";
  const page = toPositiveInt(query.page, 1);

  const [{ items: applications, total }, departments] = await Promise.all([
    listApplicationsPaginated({ q, status, departmentId, roleType }, page, PAGE_SIZE),
    listDepartments()
  ]);

  return (
    <div className="space-y-6">
      <h2 className="flex items-center gap-2 text-2xl font-semibold text-[#061b31]"><FileStack className="h-6 w-6" />Applications</h2>

      <form className="grid gap-2 rounded-lg border border-[#e5edf5] bg-[#f6f9fc] p-4 md:grid-cols-4">
        <Input defaultValue={q} name="q" placeholder="Search applicant/email" />
        <Select defaultValue={status} name="status">
          <option value="">All statuses</option>
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
        <Select defaultValue={departmentId} name="departmentId">
          <option value="">All departments</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.department_name}
            </option>
          ))}
        </Select>
        <Select defaultValue={roleType} name="roleType">
          <option value="">All roles</option>
          <option value="faculty">Faculty</option>
          <option value="staff">Staff</option>
        </Select>
        <Button type="submit" size="sm">Apply Filters</Button>
      </form>

      <div className="overflow-hidden rounded-lg border border-[#e5edf5] bg-[#f6f9fc]">
        <ApplicationsClient applications={applications} />
        <QueryPagination page={page} pageSize={PAGE_SIZE} total={total} />
      </div>
    </div>
  );
}

