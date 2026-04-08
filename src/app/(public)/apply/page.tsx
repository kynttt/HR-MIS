import { notFound } from "next/navigation";
import { ArrowRight, Briefcase, Building2, Search } from "lucide-react";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { listAppliedJobIdsForUser } from "@/features/applications/public-service";
import { getCurrentUser } from "@/features/auth/service";
import { getPublicJobOpeningDetails, listOpenJobOpenings } from "@/features/jobs/service";
import { resolvePublicOrganization } from "@/features/organizations/service";
import type { EmploymentType, RoleType } from "@/types/domain";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const ROLE_TYPES: Array<{ value: RoleType; label: string }> = [
  { value: "faculty", label: "Faculty" },
  { value: "staff", label: "Staff" }
];

const EMPLOYMENT_TYPES: Array<{ value: EmploymentType; label: string }> = [
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "contractual", label: "Contractual" },
  { value: "job_order", label: "Job Order" }
];

const orgSlugSchema = z.string().trim().toLowerCase().min(1).max(64).regex(/^[a-z0-9-]+$/);
const roleTypeSchema = z.enum(["faculty", "staff"]);
const employmentTypeSchema = z.enum(["full_time", "part_time", "contractual", "job_order"]);
const jobIdSchema = z.string().uuid();

function toLabel(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function readSingleValue(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function parseSearchText(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const parsed = z.string().trim().min(1).max(100).safeParse(value);
  return parsed.success ? parsed.data : undefined;
}

function buildApplyHref(params: {
  orgSlug?: string;
  q?: string;
  roleType?: RoleType;
  employmentType?: EmploymentType;
  jobId?: string;
  appliedJobId?: string;
}): string {
  const query = new URLSearchParams();

  if (params.orgSlug) {
    query.set("org", params.orgSlug);
  }
  if (params.q) {
    query.set("q", params.q);
  }
  if (params.roleType) {
    query.set("roleType", params.roleType);
  }
  if (params.employmentType) {
    query.set("employmentType", params.employmentType);
  }
  if (params.jobId) {
    query.set("job", params.jobId);
  }
  if (params.appliedJobId) {
    query.set("applied_job", params.appliedJobId);
  }

  const queryString = query.toString();
  return queryString ? `/apply?${queryString}` : "/apply";
}

function buildLoginHref(nextPath: string): string {
  const query = new URLSearchParams();
  query.set("next", nextPath);
  return `/login?${query.toString()}`;
}

export default async function PublicApplyPage({ searchParams }: Props) {
  const query = await searchParams;

  const rawOrg = query.org;
  if (rawOrg !== undefined && typeof rawOrg !== "string") {
    notFound();
  }

  let organization: Awaited<ReturnType<typeof resolvePublicOrganization>> | null = null;
  if (typeof rawOrg === "string") {
    const parsedOrg = orgSlugSchema.safeParse(rawOrg);
    if (!parsedOrg.success) {
      notFound();
    }

    try {
      organization = await resolvePublicOrganization(parsedOrg.data);
    } catch {
      notFound();
    }
  }

  const q = parseSearchText(readSingleValue(query.q));

  const rawRoleType = readSingleValue(query.roleType);
  const parsedRoleType = roleTypeSchema.safeParse(rawRoleType);
  const roleType = parsedRoleType.success ? parsedRoleType.data : undefined;

  const rawEmploymentType = readSingleValue(query.employmentType);
  const parsedEmploymentType = employmentTypeSchema.safeParse(rawEmploymentType);
  const employmentType = parsedEmploymentType.success ? parsedEmploymentType.data : undefined;

  const rawJobId = readSingleValue(query.job);
  const parsedJobId = jobIdSchema.safeParse(rawJobId);
  const requestedJobId = parsedJobId.success ? parsedJobId.data : undefined;

  const rawAppliedJobId = readSingleValue(query.applied_job);
  const parsedAppliedJobId = jobIdSchema.safeParse(rawAppliedJobId);
  const appliedJobId = parsedAppliedJobId.success ? parsedAppliedJobId.data : undefined;

  const jobs = await listOpenJobOpenings({
    organizationId: organization?.id,
    q,
    roleType,
    employmentType
  });

  const user = await getCurrentUser();
  const userAppliedJobIds = user
    ? await listAppliedJobIdsForUser({
        userId: user.id,
        organizationId: organization?.id,
        jobIds: jobs.map((job) => job.id)
      })
    : new Set<string>();

  const selectedJobSummary = jobs.find((job) => job.id === requestedJobId) ?? jobs[0] ?? null;

  let selectedJobDetails: Awaited<ReturnType<typeof getPublicJobOpeningDetails>> | null = null;
  if (selectedJobSummary) {
    try {
      selectedJobDetails = await getPublicJobOpeningDetails(selectedJobSummary.id);
    } catch {
      selectedJobDetails = null;
    }
  }

  const organizationCount = new Set(jobs.map((job) => job.organization_slug)).size;
  const clearHref = buildApplyHref({ orgSlug: organization?.slug, appliedJobId });
  const hasFilters = Boolean(q || roleType || employmentType);
  const alreadyApplied = Boolean(selectedJobSummary && userAppliedJobIds.has(selectedJobSummary.id)) || (Boolean(appliedJobId) && selectedJobSummary?.id === appliedJobId);
  const applyPath = selectedJobDetails ? (organization ? `/apply/${selectedJobDetails.id}?org=${organization.slug}` : `/apply/${selectedJobDetails.id}`) : "/apply";
  const loginHref = buildLoginHref(applyPath);
  return (
    <div className="px-4 py-8 lg:px-8 lg:py-10">
      <section className="overflow-hidden rounded-xl border border-[#d6d9fc] bg-gradient-to-br from-white via-[#f8f9ff] to-[#eef2ff] p-6 shadow-[0_18px_45px_-30px_rgba(83,58,253,0.35)] lg:p-8">
        <p className="code-label text-[11px] uppercase tracking-[0.12em] text-[#64748d]">Open Roles</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-[#061b31] lg:text-4xl">
              {organization ? `Join ${organization.name}` : "Explore Open Roles"}
            </h1>
            <p className="max-w-3xl text-sm text-[#273951] lg:text-base">
              {organization
                ? "Explore active openings and submit your application through our secure recruitment workflow."
                : "Browse active openings from all organizations and submit your application online."}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-[#d6d9fc] bg-white px-3 py-2 text-sm text-[#273951]">
            <Briefcase className="h-4 w-4 text-[#533afd]" />
            {organization ? (
              <span>{jobs.length} open {jobs.length === 1 ? "position" : "positions"}</span>
            ) : (
              <span>
                {jobs.length} open {jobs.length === 1 ? "position" : "positions"} across {organizationCount} {organizationCount === 1 ? "organization" : "organizations"}
              </span>
            )}
          </div>
        </div>
      </section>

      <form className="mt-6 grid gap-3 rounded-xl border border-[#e5edf5] bg-white p-4 shadow-[0_15px_32px_-34px_rgba(6,27,49,0.55)] lg:grid-cols-12 lg:p-5">
        {organization ? <input type="hidden" name="org" value={organization.slug} /> : null}
        {selectedJobSummary ? <input type="hidden" name="job" value={selectedJobSummary.id} /> : null}
        <div className="lg:col-span-5">
          <Input name="q" defaultValue={q ?? ""} placeholder="Search by job title" />
        </div>
        <div className="lg:col-span-3">
          <Select name="employmentType" defaultValue={employmentType ?? ""}>
            <option value="">All employment types</option>
            {EMPLOYMENT_TYPES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="lg:col-span-2">
          <Select name="roleType" defaultValue={roleType ?? ""}>
            <option value="">All roles</option>
            {ROLE_TYPES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex gap-2 lg:col-span-2">
          <Button className="flex-1" type="submit">
            <Search className="h-4 w-4" />
            Apply
          </Button>
          {hasFilters ? (
            <Button asChild variant="secondary" className="flex-1">
              <a href={clearHref}>Clear</a>
            </Button>
          ) : null}
        </div>
      </form>

      <section className="mt-6 grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-5">
          {jobs.length === 0 ? (
            <Card className="rounded-xl border border-[#e5edf5] bg-white p-8 text-center shadow-[0_14px_30px_-30px_rgba(6,27,49,0.35)]">
              <h2 className="text-xl font-medium text-[#061b31]">No open positions found</h2>
              <p className="mt-2 text-sm text-[#64748d]">
                {hasFilters ? "Try adjusting your filters to see more opportunities." : "Please check back later for upcoming opportunities."}
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => {
                const isSelected = selectedJobSummary?.id === job.id;
                const jobAlreadyApplied = userAppliedJobIds.has(job.id);
                const cardHref = buildApplyHref({
                  orgSlug: organization?.slug,
                  q,
                  roleType,
                  employmentType,
                  jobId: job.id,
                  appliedJobId
                });

                return (
                  <a
                    key={job.id}
                    href={cardHref}
                    className={`block rounded-xl border bg-white p-4 transition-shadow ${
                      isSelected
                        ? "border-[#533afd] shadow-[0_18px_38px_-30px_rgba(83,58,253,0.45)]"
                        : "border-[#e5edf5] shadow-[0_16px_34px_-34px_rgba(6,27,49,0.55)] hover:shadow-[0_20px_40px_-32px_rgba(6,27,49,0.45)]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="code-label text-[11px] uppercase tracking-[0.12em] text-[#64748d]">{job.organization_name}</p>
                        <h2 className="line-clamp-2 text-base font-medium text-[#061b31]">{job.job_title}</h2>
                        <p className="mt-1 flex items-center gap-1 text-sm text-[#64748d]">
                          <Building2 className="h-4 w-4" />
                          {job.department_name ?? "General Department"}
                        </p>
                      </div>
                      {isSelected ? (
                        <Badge variant={jobAlreadyApplied ? "warning" : "success"}>{jobAlreadyApplied ? "Applied" : "Selected"}</Badge>
                      ) : jobAlreadyApplied ? (
                        <Badge variant="warning">Applied</Badge>
                      ) : (
                        <Badge variant="muted">Open</Badge>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-md border border-[#d6d9fc] bg-[#f4f6ff] px-2.5 py-1 text-[#4434d4]">{toLabel(job.role_type)}</span>
                      <span className="rounded-md border border-[#e5edf5] bg-[#f8fafc] px-2.5 py-1 text-[#273951]">{toLabel(job.employment_type)}</span>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>

        <aside className="xl:col-span-7">
          <Card className="rounded-xl border border-[#d6d9fc] bg-gradient-to-br from-white via-[#f9faff] to-[#f3f6ff] p-6 shadow-[0_22px_50px_-34px_rgba(83,58,253,0.35)] lg:p-8 xl:sticky xl:top-24">
            {selectedJobDetails ? (
              <>
                <p className="code-label text-[11px] uppercase tracking-[0.12em] text-[#64748d]">{selectedJobDetails.organization_name}</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#061b31]">{selectedJobDetails.job_title}</h2>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Badge variant="success">Open</Badge>
                  <span className="rounded-md border border-[#d6d9fc] bg-[#f4f6ff] px-2.5 py-1 text-xs text-[#4434d4]">{toLabel(selectedJobDetails.role_type)}</span>
                  <span className="rounded-md border border-[#e5edf5] bg-[#f8fafc] px-2.5 py-1 text-xs text-[#273951]">{toLabel(selectedJobDetails.employment_type)}</span>
                </div>

                <div className="mt-5 space-y-2 text-sm text-[#273951]">
                  <p className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[#64748d]" />
                    {selectedJobDetails.department_name ?? "General Department"}
                  </p>
                  <p className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-[#64748d]" />
                    Application workflow: 3 steps
                  </p>
                </div>

                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  <div>
                    <h3 className="text-xs uppercase tracking-wide text-[#64748d]">Description</h3>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[#273951]">{selectedJobDetails.description ?? "No description provided."}</p>
                  </div>
                  <div>
                    <h3 className="text-xs uppercase tracking-wide text-[#64748d]">Qualifications</h3>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[#273951]">{selectedJobDetails.qualifications ?? "No qualification details provided."}</p>
                  </div>
                </div>

                <div className="mt-7">
                  {alreadyApplied ? (
                    <div className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800">
                      Application already submitted
                    </div>
                  ) : user ? (
                    <a
                      className="inline-flex items-center gap-2 rounded-md bg-[#533afd] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4434d4]"
                      href={applyPath}
                    >
                      Apply for this role
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  ) : (
                    <a
                      className="inline-flex items-center gap-2 rounded-md border border-[#d6d9fc] bg-white px-4 py-2 text-sm font-medium text-[#4434d4] transition-colors hover:bg-[#f4f6ff]"
                      href={loginHref}
                    >
                      Sign in to apply
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-[#e5edf5] bg-white p-6 text-center">
                <h3 className="text-lg font-medium text-[#061b31]">Select an open role</h3>
                <p className="mt-2 text-sm text-[#64748d]">Choose a role on the left to view full details here.</p>
              </div>
            )}
          </Card>
        </aside>
      </section>
    </div>
  );
}

