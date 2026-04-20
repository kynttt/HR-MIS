import Link from "next/link";
import { format } from "date-fns";
import { Briefcase, Plus, Users } from "lucide-react";

import { JobsPageToast } from "@/components/jobs/jobs-page-toast";
import { JobsPageClient } from "@/components/jobs/jobs-page-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QueryPagination } from "@/components/ui/query-pagination";
import { Select } from "@/components/ui/select";
import { SortHeader } from "@/components/ui/sort-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listDepartments } from "@/features/departments/service";
import { setJobOpeningStatusAction } from "@/features/jobs/actions";
import { listJobOpeningsPaginated, type JobSortKey, type JobStatus } from "@/features/jobs/service";
import type { RoleType } from "@/types/domain";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const PAGE_SIZE = 10;
const ROLE_TYPES: readonly RoleType[] = ["faculty", "staff"];
const JOB_STATUSES: readonly JobStatus[] = ["open", "closed"];
const JOB_SORTS: readonly JobSortKey[] = ["title", "department", "status", "created"];

type SortOrder = "asc" | "desc";

function parseEnumValue<T extends string>(value: string | string[] | undefined, allowed: readonly T[]): T | undefined {
  if (typeof value !== "string") return undefined;
  return allowed.includes(value as T) ? (value as T) : undefined;
}

function parseSort(value: string | string[] | undefined): JobSortKey | undefined {
  if (typeof value !== "string") return undefined;

  if (value === "job_title") return "title";
  if (value === "department_name") return "department";
  if (value === "created_at") return "created";

  return parseEnumValue(value, JOB_SORTS);
}

function parseSortOrder(value: string | string[] | undefined): SortOrder {
  return value === "asc" || value === "desc" ? value : "desc";
}

function toPositiveInt(value: string | string[] | undefined, fallback: number): number {
  if (typeof value !== "string") return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export default async function JobsPage({ searchParams }: Props) {
  const query = await searchParams;
  const q = typeof query.q === "string" ? query.q : "";
  const status = parseEnumValue(query.status, JOB_STATUSES);
  const departmentId = typeof query.departmentId === "string" ? query.departmentId : undefined;
  const roleType = parseEnumValue(query.roleType, ROLE_TYPES);
  const sort = parseSort(query.sort);
  const order = parseSortOrder(query.order);
  const page = toPositiveInt(query.page, 1);
  const updated = query.updated === "1";
  const created = query.created === "1";

  let paginated = await listJobOpeningsPaginated({ q, status, departmentId, roleType, sort, order }, page, PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(paginated.total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  if (currentPage !== page) {
    paginated = await listJobOpeningsPaginated({ q, status, departmentId, roleType, sort, order }, currentPage, PAGE_SIZE);
  }

  const { items: jobs, total } = paginated;
  const departments = await listDepartments();

  return (
    <JobsPageClient jobs={jobs}>
      {({ onViewApplicants }) => (
        <div className="space-y-6">
          <JobsPageToast created={created} updated={updated} />

          <section className="rounded-xl border border-[#d6d9fc] bg-gradient-to-br from-white via-[#f8f9ff] to-[#eef2ff] p-5 shadow-[0_18px_45px_-34px_rgba(83,58,253,0.35)] lg:p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="code-label text-[11px] uppercase tracking-[0.12em] text-[#64748d]">Recruitment</p>
                <h2 className="mt-1 flex items-center gap-2 text-2xl font-semibold tracking-tight text-[#061b31]">
                  <Briefcase className="h-6 w-6" />
                  Job Openings
                </h2>
                <p className="mt-1 text-sm text-[#273951]">Manage active and closed positions across departments.</p>
              </div>

              <div className="flex items-center gap-3">
                <span className="rounded-md border border-[#d6d9fc] bg-white px-3 py-2 text-sm text-[#273951]">{total} total records</span>
                <Button asChild>
                  <Link href="/jobs/create">
                    <Plus className="mr-1 h-4 w-4" />
                    Create Job Opening
                  </Link>
                </Button>
              </div>
            </div>
          </section>

          <form className="grid gap-3 rounded-xl border border-[#e5edf5] bg-white p-4 shadow-[0_15px_32px_-34px_rgba(6,27,49,0.55)] lg:grid-cols-12 lg:p-5">
            <div className="lg:col-span-3">
              <Input defaultValue={q} name="q" placeholder="Search by title" />
            </div>
            <div className="lg:col-span-3">
              <Select defaultValue={status ?? ""} name="status">
                <option value="">All job statuses</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </Select>
            </div>
            <div className="lg:col-span-3">
              <Select defaultValue={departmentId ?? ""} name="departmentId">
                <option value="">All departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.department_name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="lg:col-span-2">
              <Select defaultValue={roleType ?? ""} name="roleType">
                <option value="">All role types</option>
                <option value="faculty">Faculty</option>
                <option value="staff">Staff</option>
              </Select>
            </div>
            <div className="lg:col-span-1">
              <Button className="w-full" type="submit" size="sm">
                Apply
              </Button>
            </div>
          </form>

          <div className="overflow-hidden rounded-xl border border-[#e5edf5] bg-white shadow-[0_20px_40px_-38px_rgba(6,27,49,0.65)]">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortHeader name="title" label="Title" currentSort={sort ?? ""} currentOrder={order} />
                    <SortHeader name="department" label="Department" currentSort={sort ?? ""} currentOrder={order} />
                    <TableHead>Role</TableHead>
                    <TableHead>Type</TableHead>
                    <SortHeader name="status" label="Status" currentSort={sort ?? ""} currentOrder={order} />
                    <SortHeader name="created" label="Posted" currentSort={sort ?? ""} currentOrder={order} />
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-[#64748d]">
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
                          <Badge variant={job.status === "open" ? "success" : "muted"}>{job.status}</Badge>
                        </TableCell>
                        <TableCell className="text-[#64748d]">{format(new Date(job.created_at), "MMM d, yyyy")}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            <Link
                              href={`/jobs/${job.id}/edit` as any}
                              className="text-xs text-brand-700 hover:text-brand-500"
                            >
                              Edit
                            </Link>
                            <span className="text-[#e5edf5]">|</span>
                            <form action={setJobOpeningStatusAction.bind(null, job.id, job.status === "open" ? "closed" : "open")}>
                              <button className="text-xs text-[#64748d] hover:text-[#061b31]" type="submit">
                                {job.status === "open" ? "Close" : "Open"}
                              </button>
                            </form>
                            <span className="text-[#e5edf5]">|</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto gap-1 p-0 text-xs text-[#533afd] hover:text-[#4434d4]"
                              onClick={() => onViewApplicants(job)}
                            >
                              <Users className="h-3 w-3" />
                              View Applicants
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <QueryPagination page={currentPage} pageSize={PAGE_SIZE} total={total} />
          </div>
        </div>
      )}
    </JobsPageClient>
  );
}
