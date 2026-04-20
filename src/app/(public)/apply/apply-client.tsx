"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Briefcase, Building2, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { OpenJobListItem, PublicJobOpeningDetails } from "@/features/jobs/service";
import type { OrganizationContext } from "@/features/organizations/service";
import type { EmploymentType, RoleType } from "@/types/domain";

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

function toLabel(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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

interface JobApplyClientProps {
  organization: OrganizationContext | null;
  jobs: OpenJobListItem[];
  initialSelectedJob: OpenJobListItem | null;
  initialJobDetails: PublicJobOpeningDetails | null;
  userAppliedJobIds: Set<string>;
  user: { email: string | null } | null;
}

export function JobApplyClient({
  organization,
  jobs,
  initialSelectedJob,
  initialJobDetails,
  userAppliedJobIds,
  user
}: JobApplyClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [selectedJob, setSelectedJob] = useState<OpenJobListItem | null>(initialSelectedJob);
  const [selectedJobDetails, setSelectedJobDetails] = useState<PublicJobOpeningDetails | null>(initialJobDetails);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const q = searchParams.get("q") ?? "";
  const roleType = searchParams.get("roleType") as RoleType | null;
  const employmentType = searchParams.get("employmentType") as EmploymentType | null;
  const appliedJobId = searchParams.get("applied_job") ?? undefined;

  const organizationCount = new Set(jobs.map((job) => job.organization_slug)).size;
  const hasFilters = Boolean(q || roleType || employmentType);
  const alreadyApplied = selectedJob ? userAppliedJobIds.has(selectedJob.id) : false;

  const handleJobSelect = async (job: OpenJobListItem) => {
    if (selectedJob?.id === job.id) return;

    // Optimistically update UI
    setSelectedJob(job);
    setIsLoadingDetails(true);

    // Update URL without page reload
    const newHref = buildApplyHref({
      orgSlug: organization?.slug ?? undefined,
      q: q || undefined,
      roleType: roleType || undefined,
      employmentType: employmentType || undefined,
      jobId: job.id,
      appliedJobId
    });

    startTransition(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.push(newHref as any, { scroll: false });
    });

    // Fetch job details client-side
    try {
      const response = await fetch(`/api/jobs/${job.id}/public`);
      if (response.ok) {
        const details = await response.json();
        setSelectedJobDetails(details);
      }
    } catch {
      // Keep existing details if fetch fails
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleFilterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newQ = formData.get("q") as string;
    const newRoleType = formData.get("roleType") as RoleType;
    const newEmploymentType = formData.get("employmentType") as EmploymentType;

    const newHref = buildApplyHref({
      orgSlug: organization?.slug ?? undefined,
      q: newQ || undefined,
      roleType: newRoleType || undefined,
      employmentType: newEmploymentType || undefined,
      jobId: selectedJob?.id,
      appliedJobId
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.push(newHref as any);
  };

  const handleClearFilters = () => {
    const newHref = buildApplyHref({
      orgSlug: organization?.slug ?? undefined,
      appliedJobId
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.push(newHref as any);
  };

  const applyPath = selectedJob
    ? (organization ? `/apply/${selectedJob.id}?org=${organization.slug}` : `/apply/${selectedJob.id}`)
    : "/apply";

  const buildLoginHref = (nextPath: string): string => {
    const query = new URLSearchParams();
    query.set("next", nextPath);
    return `/login?${query.toString()}`;
  };

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

      <form onSubmit={handleFilterSubmit} className="mt-6 grid gap-3 rounded-xl border border-[#e5edf5] bg-white p-4 shadow-[0_15px_32px_-34px_rgba(6,27,49,0.55)] lg:grid-cols-12 lg:p-5">
        {organization ? <input type="hidden" name="org" value={organization.slug} /> : null}
        <div className="lg:col-span-5">
          <Input name="q" defaultValue={q} placeholder="Search by job title" />
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
            <Button type="button" variant="secondary" className="flex-1" onClick={handleClearFilters}>
              Clear
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
                const isSelected = selectedJob?.id === job.id;
                const jobAlreadyApplied = userAppliedJobIds.has(job.id);

                return (
                  <button
                    key={job.id}
                    onClick={() => handleJobSelect(job)}
                    disabled={isPending}
                    className={`w-full text-left block rounded-xl border bg-white p-4 transition-shadow ${
                      isSelected
                        ? "border-[#533afd] shadow-[0_18px_38px_-30px_rgba(83,58,253,0.45)]"
                        : "border-[#e5edf5] shadow-[0_16px_34px_-34px_rgba(6,27,49,0.55)] hover:shadow-[0_20px_40px_-32px_rgba(6,27,49,0.45)]"
                    } ${isPending ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
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
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <aside className="xl:col-span-7">
          <Card className="rounded-xl border border-[#d6d9fc] bg-gradient-to-br from-white via-[#f9faff] to-[#f3f6ff] p-6 shadow-[0_22px_50px_-34px_rgba(83,58,253,0.35)] lg:p-8 xl:sticky xl:top-24">
            {isLoadingDetails ? (
              <div className="space-y-4">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-3/4" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
                <div className="mt-6 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                </div>
              </div>
            ) : selectedJobDetails ? (
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
