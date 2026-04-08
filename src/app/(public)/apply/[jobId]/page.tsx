import Link from "next/link";

import { MultiStepApplyForm } from "@/components/applications/multi-step-form";
import { getPublicJobOpeningDetails } from "@/features/jobs/service";
import { resolvePublicOrganization } from "@/features/organizations/service";

type Props = {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PublicJobApplyPage({ params, searchParams }: Props) {
  const { jobId } = await params;
  const query = await searchParams;

  const orgSlug = typeof query.org === "string" ? query.org : undefined;
  const organization = await resolvePublicOrganization(orgSlug);

  const isSuccess = query.success === "1";
  const errorMessage = typeof query.error === "string" ? query.error : null;

  const job = await getPublicJobOpeningDetails(jobId, organization.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-4">
        <Link className="text-sm text-[#533afd] hover:text-[#4434d4]" href={`/apply?org=${organization.slug}`}>
          Back to job listings
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <aside className="rounded-xl border border-[#e5edf5] bg-white p-6 lg:col-span-2">
          <p className="text-xs uppercase tracking-wide text-[#64748d]">{organization.name}</p>
          <h1 className="mt-2 text-2xl font-semibold text-[#061b31]">{job.job_title}</h1>
          <p className="mt-2 text-sm text-[#64748d]">
            {job.department_name ?? "General"} � {job.role_type} � {job.employment_type.replace("_", " ")}
          </p>

          <div className="mt-6 space-y-4 text-sm text-[#273951]">
            <div>
              <h2 className="font-medium text-[#061b31]">Description</h2>
              <p className="mt-1 whitespace-pre-wrap">{job.description ?? "No description provided."}</p>
            </div>
            <div>
              <h2 className="font-medium text-[#061b31]">Qualifications</h2>
              <p className="mt-1 whitespace-pre-wrap">{job.qualifications ?? "No qualification details provided."}</p>
            </div>
          </div>
        </aside>

        <section className="rounded-xl border border-[#e5edf5] bg-[#f6f9fc] p-6 shadow-sm lg:col-span-3">
          <h2 className="text-xl font-semibold text-[#061b31]">Application Form</h2>
          <p className="mt-1 text-sm text-[#64748d]">Complete all required details to submit your application.</p>

          <div className="mt-6">
            <MultiStepApplyForm
              jobs={[
                {
                  id: job.id,
                  job_title: job.job_title,
                  department_name: job.department_name,
                  role_type: job.role_type
                }
              ]}
              fixedJobId={job.id}
              returnPath={`/apply/${job.id}?org=${organization.slug}`}
              isSuccess={isSuccess}
              errorMessage={errorMessage}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
