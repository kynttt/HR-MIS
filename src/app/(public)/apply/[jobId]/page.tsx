import Link from "next/link";
import { ArrowLeft, Building2, Briefcase, CircleDot } from "lucide-react";

import { MultiStepApplyForm } from "@/components/applications/multi-step-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getPublicJobOpeningDetails } from "@/features/jobs/service";
import { resolvePublicOrganization } from "@/features/organizations/service";

type Props = {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function toLabel(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function PublicJobApplyPage({ params, searchParams }: Props) {
  const { jobId } = await params;
  const query = await searchParams;

  const orgSlug = typeof query.org === "string" ? query.org : undefined;
  const organization = await resolvePublicOrganization(orgSlug);

  const isSuccess = query.success === "1";
  const errorMessage = typeof query.error === "string" ? query.error : null;

  const job = await getPublicJobOpeningDetails(jobId, organization.id);

  return (
    <div className="px-4 py-8 lg:px-8 lg:py-10">
      <div className="mb-5">
        <Link
          className="inline-flex items-center gap-2 text-sm text-[#533afd] transition-colors hover:text-[#4434d4]"
          href={`/apply?org=${organization.slug}`}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to job listings
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <aside className="space-y-5 xl:col-span-4">
          <Card className="rounded-xl border border-[#e5edf5] bg-white p-6 shadow-[0_18px_40px_-34px_rgba(6,27,49,0.55)] xl:sticky xl:top-24">
            <p className="code-label text-[11px] uppercase tracking-[0.12em] text-[#64748d]">{organization.name}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#061b31]">{job.job_title}</h1>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge variant="success">Open</Badge>
              <span className="rounded-md border border-[#d6d9fc] bg-[#f4f6ff] px-2.5 py-1 text-xs text-[#4434d4]">{toLabel(job.role_type)}</span>
              <span className="rounded-md border border-[#e5edf5] bg-[#f8fafc] px-2.5 py-1 text-xs text-[#273951]">{toLabel(job.employment_type)}</span>
            </div>

            <div className="mt-5 space-y-2 text-sm text-[#273951]">
              <p className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#64748d]" />
                {job.department_name ?? "General Department"}
              </p>
              <p className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-[#64748d]" />
                Application workflow: 3 steps
              </p>
            </div>

            <div className="mt-6 space-y-4 text-sm text-[#273951]">
              <div>
                <h2 className="text-xs uppercase tracking-wide text-[#64748d]">Description</h2>
                <p className="mt-1 whitespace-pre-wrap leading-relaxed text-[#273951]">{job.description ?? "No description provided."}</p>
              </div>
              <div>
                <h2 className="text-xs uppercase tracking-wide text-[#64748d]">Qualifications</h2>
                <p className="mt-1 whitespace-pre-wrap leading-relaxed text-[#273951]">{job.qualifications ?? "No qualification details provided."}</p>
              </div>
            </div>
          </Card>
        </aside>

        <section className="xl:col-span-8">
          <Card className="rounded-xl border border-[#d6d9fc] bg-gradient-to-br from-white via-[#f9faff] to-[#f3f6ff] p-6 shadow-[0_22px_50px_-34px_rgba(83,58,253,0.35)] lg:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-[#061b31]">Application Form</h2>
                <p className="mt-1 text-sm text-[#64748d]">Complete all required details. Your submission is reviewed by the HR team.</p>
              </div>
              <div className="flex items-center gap-1 rounded-md border border-[#d6d9fc] bg-white px-3 py-1.5 text-xs text-[#4434d4]">
                <CircleDot className="h-3.5 w-3.5" />
                Secure submission
              </div>
            </div>

            <div className="mt-7">
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
          </Card>
        </section>
      </div>
    </div>
  );
}
