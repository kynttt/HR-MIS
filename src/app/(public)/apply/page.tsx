import Link from "next/link";

import { listOpenJobOpenings } from "@/features/jobs/service";
import { resolvePublicOrganization } from "@/features/organizations/service";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PublicApplyPage({ searchParams }: Props) {
  const query = await searchParams;
  const orgSlug = typeof query.org === "string" ? query.org : undefined;
  const organization = await resolvePublicOrganization(orgSlug);
  const jobs = await listOpenJobOpenings({ organizationId: organization.id });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="rounded-xl border border-[#e5edf5] bg-[#f6f9fc] p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[#061b31]">Career Opportunities</h1>
          <p className="mt-1 text-sm text-[#64748d]">Apply to open roles at {organization.name}.</p>
        </div>

        {jobs.length === 0 ? (
          <p className="rounded-md border border-[#e5edf5] bg-white p-4 text-sm text-[#64748d]">No open positions are available right now.</p>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div key={job.id} className="rounded-lg border border-[#e5edf5] bg-white p-4">
                <h2 className="text-lg text-[#061b31]">{job.job_title}</h2>
                <p className="mt-1 text-sm text-[#64748d]">
                  {job.department_name ?? "General"} � {job.role_type} � {job.employment_type.replace("_", " ")}
                </p>
                <div className="mt-3">
                  <Link
                    className="inline-flex rounded-md bg-[#533afd] px-4 py-2 text-sm font-medium text-white hover:bg-[#4434d4]"
                    href={`/apply/${job.id}?org=${organization.slug}`}
                  >
                    View Details & Apply
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
