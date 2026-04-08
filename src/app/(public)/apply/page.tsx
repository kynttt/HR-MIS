import Link from "next/link";
import { ArrowRight, Briefcase, Building2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { listOpenJobOpenings } from "@/features/jobs/service";
import { resolvePublicOrganization } from "@/features/organizations/service";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function toLabel(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function PublicApplyPage({ searchParams }: Props) {
  const query = await searchParams;
  const orgSlug = typeof query.org === "string" ? query.org : undefined;
  const organization = await resolvePublicOrganization(orgSlug);
  const jobs = await listOpenJobOpenings({ organizationId: organization.id });

  return (
    <div className="px-4 py-8 lg:px-8 lg:py-10">
      <section className="overflow-hidden rounded-xl border border-[#d6d9fc] bg-gradient-to-br from-white via-[#f8f9ff] to-[#eef2ff] p-6 shadow-[0_18px_45px_-30px_rgba(83,58,253,0.35)] lg:p-8">
        <p className="code-label text-[11px] uppercase tracking-[0.12em] text-[#64748d]">Open Roles</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-[#061b31] lg:text-4xl">Join {organization.name}</h1>
            <p className="max-w-3xl text-sm text-[#273951] lg:text-base">
              Explore active openings and submit your application through our secure recruitment workflow.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-[#d6d9fc] bg-white px-3 py-2 text-sm text-[#273951]">
            <Briefcase className="h-4 w-4 text-[#533afd]" />
            <span>{jobs.length} open {jobs.length === 1 ? "position" : "positions"}</span>
          </div>
        </div>
      </section>

      <section className="mt-6">
        {jobs.length === 0 ? (
          <div className="rounded-xl border border-[#e5edf5] bg-white p-8 text-center shadow-[0_14px_30px_-30px_rgba(6,27,49,0.35)]">
            <h2 className="text-xl font-medium text-[#061b31]">No open positions right now</h2>
            <p className="mt-2 text-sm text-[#64748d]">Please check back later for upcoming opportunities.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {jobs.map((job) => (
              <article
                key={job.id}
                className="group flex h-full flex-col rounded-xl border border-[#e5edf5] bg-white p-5 shadow-[0_18px_36px_-34px_rgba(6,27,49,0.55)] transition-shadow hover:shadow-[0_24px_44px_-30px_rgba(83,58,253,0.35)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="line-clamp-2 text-lg font-medium text-[#061b31]">{job.job_title}</h2>
                    <p className="mt-1 flex items-center gap-1 text-sm text-[#64748d]">
                      <Building2 className="h-4 w-4" />
                      {job.department_name ?? "General Department"}
                    </p>
                  </div>
                  <Badge variant="success">Open</Badge>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-md border border-[#d6d9fc] bg-[#f4f6ff] px-2.5 py-1 text-[#4434d4]">{toLabel(job.role_type)}</span>
                  <span className="rounded-md border border-[#e5edf5] bg-[#f8fafc] px-2.5 py-1 text-[#273951]">{toLabel(job.employment_type)}</span>
                </div>

                <div className="mt-auto pt-5">
                  <Link
                    className="inline-flex items-center gap-2 rounded-md bg-[#533afd] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4434d4]"
                    href={`/apply/${job.id}?org=${organization.slug}`}
                  >
                    View details and apply
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
