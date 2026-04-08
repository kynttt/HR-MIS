import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Building2, CalendarDays, CircleDot, Layers3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/features/auth/service";
import { getCurrentUserApplicationDetails } from "@/features/profile/service";

type Props = {
  params: Promise<{ id: string }>;
};

function toLabel(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getStatusVariant(status: string): "default" | "success" | "warning" | "danger" | "muted" {
  if (status === "accepted") return "success";
  if (status === "rejected" || status === "withdrawn") return "danger";
  if (status === "submitted" || status === "under_review") return "default";
  if (status === "shortlisted" || status === "interview_scheduled" || status === "interviewed" || status === "for_requirements") return "warning";
  return "muted";
}

export default async function ApplicantApplicationDetailsPage({ params }: Props) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/profile/applications");
  }

  const { id } = await params;
  const application = await getCurrentUserApplicationDetails(user.id, id);

  if (!application) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#dde7f5] bg-white p-5 shadow-[0_16px_34px_-34px_rgba(15,23,42,0.7)]">
        <div>
          <p className="code-label text-[11px] uppercase tracking-[0.12em] text-[#5e7490]">Application Detail</p>
          <h2 className="mt-1 text-2xl font-semibold text-[#071b33]">{application.job_title}</h2>
        </div>
        <Badge variant={getStatusVariant(application.status)}>{toLabel(application.status)}</Badge>
      </div>

      <section className="rounded-xl border border-[#dde7f5] bg-white p-6 shadow-[0_16px_34px_-34px_rgba(15,23,42,0.7)] lg:p-7">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-[#e6edf8] bg-[#f9fbff] p-3">
            <p className="flex items-center gap-1 text-xs uppercase tracking-[0.08em] text-[#6d829c]">
              <Building2 className="h-3.5 w-3.5" />
              Organization
            </p>
            <p className="mt-1 text-sm text-[#0f213b]">{application.organization_name ?? "-"}</p>
          </div>
          <div className="rounded-lg border border-[#e6edf8] bg-[#f9fbff] p-3">
            <p className="flex items-center gap-1 text-xs uppercase tracking-[0.08em] text-[#6d829c]">
              <Layers3 className="h-3.5 w-3.5" />
              Department
            </p>
            <p className="mt-1 text-sm text-[#0f213b]">{application.department_name ?? "-"}</p>
          </div>
          <div className="rounded-lg border border-[#e6edf8] bg-[#f9fbff] p-3">
            <p className="flex items-center gap-1 text-xs uppercase tracking-[0.08em] text-[#6d829c]">
              <CircleDot className="h-3.5 w-3.5" />
              Role Type
            </p>
            <p className="mt-1 text-sm text-[#0f213b]">{application.role_type ? toLabel(application.role_type) : "-"}</p>
          </div>
          <div className="rounded-lg border border-[#e6edf8] bg-[#f9fbff] p-3">
            <p className="flex items-center gap-1 text-xs uppercase tracking-[0.08em] text-[#6d829c]">
              <CircleDot className="h-3.5 w-3.5" />
              Employment Type
            </p>
            <p className="mt-1 text-sm text-[#0f213b]">{application.employment_type ? toLabel(application.employment_type) : "-"}</p>
          </div>
          <div className="rounded-lg border border-[#e6edf8] bg-[#f9fbff] p-3">
            <p className="flex items-center gap-1 text-xs uppercase tracking-[0.08em] text-[#6d829c]">
              <CalendarDays className="h-3.5 w-3.5" />
              Submitted
            </p>
            <p className="mt-1 text-sm text-[#0f213b]">{new Date(application.submitted_at).toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-[#e6edf8] bg-[#f9fbff] p-3">
            <p className="flex items-center gap-1 text-xs uppercase tracking-[0.08em] text-[#6d829c]">
              <CalendarDays className="h-3.5 w-3.5" />
              Last Updated
            </p>
            <p className="mt-1 text-sm text-[#0f213b]">{new Date(application.updated_at).toLocaleString()}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-[#dde7f5] bg-white p-6 shadow-[0_16px_34px_-34px_rgba(15,23,42,0.7)]">
          <h3 className="text-lg font-semibold text-[#071b33]">Job Description</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#31465f]">{application.description ?? "No description available for this role."}</p>
        </article>

        <article className="rounded-xl border border-[#dde7f5] bg-white p-6 shadow-[0_16px_34px_-34px_rgba(15,23,42,0.7)]">
          <h3 className="text-lg font-semibold text-[#071b33]">Qualifications</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#31465f]">{application.qualifications ?? "No qualification details available for this role."}</p>
        </article>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          className="inline-flex items-center gap-1 rounded-md border border-[#cfdaf0] bg-white px-4 py-2 text-sm font-medium text-[#31465f] transition-colors hover:bg-[#f4f8ff]"
          href="/profile/applications"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to my applications
        </Link>
        <Link className="rounded-md bg-[#4f46e5] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#3730a3]" href="/apply">
          Browse open roles
        </Link>
      </div>
    </div>
  );
}
