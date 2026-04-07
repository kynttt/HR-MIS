import Link from "next/link";
import { format } from "date-fns";
import { Briefcase, Plus } from "lucide-react";

import { JobsPageToast } from "@/components/jobs/jobs-page-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QueryPagination } from "@/components/ui/query-pagination";
import { Select } from "@/components/ui/select";
import { SortHeader } from "@/components/ui/sort-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listDepartments } from "@/features/departments/service";
import { setJobOpeningStatusAction } from "@/features/jobs/actions";
import { listJobOpeningsPaginated } from "@/features/jobs/service";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const PAGE_SIZE = 10;

function toPositiveInt(value: string | string[] | undefined, fallback: number): number {
  if (typeof value !== "string") return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export default async function JobsPage({ searchParams }: Props) {
  const query = await searchParams;
  const q = typeof query.q === "string" ? query.q : "";
  const status = typeof query.status === "string" ? query.status : "";
  const departmentId = typeof query.departmentId === "string" ? query.departmentId : "";
  const roleType = typeof query.roleType === "string" ? query.roleType : "";
  const sort = typeof query.sort === "string" ? query.sort : "";
  const order = typeof query.order === "string" ? (query.order as "asc" | "desc") : "desc";
  const page = toPositiveInt(query.page, 1);
  const updated = query.updated === "1";
  const created = query.created === "1";

  const [{ items: jobs, total }, departments] = await Promise.all([
    listJobOpeningsPaginated({ q, status, departmentId, roleType, sort, order }, page, PAGE_SIZE),
    listDepartments()
  ]);

  return (
    <div className="space-y-6">
      <JobsPageToast created={created} updated={updated} />

      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-2xl font-semibold text-[#061b31]">
          <Briefcase className="h-6 w-6" />
          Job Openings
        </h2>
        <Button asChild>
          <Link href="/jobs/create">
            <Plus className="mr-1 h-4 w-4" />
            Create Job Opening
          </Link>
        </Button>
      </div>

      <form className="grid gap-2 rounded-lg border border-[#e5edf5] bg-[#f6f9fc] p-4 md:grid-cols-4">
        <Input defaultValue={q} name="q" placeholder="Search by title" />
        <Select defaultValue={status} name="status">
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </Select>
        <Select defaultValue={departmentId} name="departmentId">
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.department_name}</option>
          ))}
        </Select>
        <Select defaultValue={roleType} name="roleType">
          <option value="">All roles</option>
          <option value="faculty">Faculty</option>
          <option value="staff">Staff</option>
        </Select>
        <Button type="submit" size="sm">Apply</Button>
      </form>

      <div className="overflow-hidden rounded-lg border border-[#e5edf5] bg-[#f6f9fc]">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <SortHeader name="title" label="Title" currentSort={sort} currentOrder={order} />
                <SortHeader name="department" label="Department" currentSort={sort} currentOrder={order} />
                <TableHead>Role</TableHead>
                <TableHead>Type</TableHead>
                <SortHeader name="status" label="Status" currentSort={sort} currentOrder={order} />
                <SortHeader name="created" label="Posted" currentSort={sort} currentOrder={order} />
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-6 text-center text-[#64748d]">
                    No job openings found.
                  </TableCell>
                </TableRow>
              ) : (
                jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium text-[#061b31]">{job.job_title}</TableCell>
                    <TableCell className="text-[#64748d]">{job.department_name ?? "-"}</TableCell>
                    <TableCell className="capitalize text-[#64748d]">{job.role_type}</TableCell>
                    <TableCell className="capitalize text-[#64748d]">{job.employment_type.replace("_", " ")}</TableCell>
                    <TableCell>
                      <Badge variant={job.status === "open" ? "success" : "muted"}>
                        {job.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[#64748d]">
                      {format(new Date(job.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        <Link href={`/jobs/${job.id}/edit` as any} className="text-xs text-brand-700 hover:text-brand-500">
                          Edit
                        </Link>
                        <span className="text-[#e5edf5]">|</span>
                        <form action={setJobOpeningStatusAction.bind(null, job.id, job.status === "open" ? "closed" : "open")}>
                          <button suppressHydrationWarning className="text-xs text-[#64748d] hover:text-[#061b31]" type="submit">
                            {job.status === "open" ? "Close" : "Open"}
                          </button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <QueryPagination page={page} pageSize={PAGE_SIZE} total={total} />
      </div>
    </div>
  );
}
