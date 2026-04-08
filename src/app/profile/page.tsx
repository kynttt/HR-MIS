import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, Send } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/features/auth/service";
import { listCurrentUserApplications } from "@/features/profile/service";

function toLabel(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const IN_PROGRESS_STATUSES = new Set([
  "under_review",
  "shortlisted",
  "interview_scheduled",
  "interviewed",
  "for_requirements"
]);

function getStatusVariant(status: string): "default" | "success" | "warning" | "danger" | "muted" {
  if (status === "accepted") return "success";
  if (status === "rejected" || status === "withdrawn") return "danger";
  if (status === "submitted" || status === "under_review") return "default";
  if (status === "shortlisted" || status === "interview_scheduled" || status === "interviewed" || status === "for_requirements") return "warning";
  return "muted";
}

export default async function ApplicantDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const applications = await listCurrentUserApplications(user.id);
  const recentApplications = applications.slice(0, 5);

  const totalApplications = applications.length;
  const inProgressCount = applications.filter((item) => IN_PROGRESS_STATUSES.has(item.status)).length;
  const acceptedCount = applications.filter((item) => item.status === "accepted").length;

  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-[#dde7f5] bg-white p-5 shadow-[0_16px_34px_-34px_rgba(15,23,42,0.7)]">
          <p className="text-xs uppercase tracking-[0.08em] text-[#7389a4]">Submitted</p>
          <p className="mt-2 flex items-center gap-2 text-3xl font-semibold text-[#071b33]">
            <Send className="h-6 w-6 text-[#4f46e5]" />
            {totalApplications}
          </p>
          <p className="mt-1 text-sm text-[#4a617d]">Total applications sent from your account.</p>
        </article>
        <article className="rounded-xl border border-[#dde7f5] bg-white p-5 shadow-[0_16px_34px_-34px_rgba(15,23,42,0.7)]">
          <p className="text-xs uppercase tracking-[0.08em] text-[#7389a4]">In Progress</p>
          <p className="mt-2 flex items-center gap-2 text-3xl font-semibold text-[#071b33]">
            <Clock3 className="h-6 w-6 text-[#f59e0b]" />
            {inProgressCount}
          </p>
          <p className="mt-1 text-sm text-[#4a617d]">Applications currently under evaluation.</p>
        </article>
        <article className="rounded-xl border border-[#dde7f5] bg-white p-5 shadow-[0_16px_34px_-34px_rgba(15,23,42,0.7)]">
          <p className="text-xs uppercase tracking-[0.08em] text-[#7389a4]">Accepted</p>
          <p className="mt-2 flex items-center gap-2 text-3xl font-semibold text-[#071b33]">
            <CheckCircle2 className="h-6 w-6 text-[#16a34a]" />
            {acceptedCount}
          </p>
          <p className="mt-1 text-sm text-[#4a617d]">Applications that reached accepted status.</p>
        </article>
      </section>

      <section className="rounded-xl border border-[#dde7f5] bg-white p-6 shadow-[0_16px_34px_-34px_rgba(15,23,42,0.7)] lg:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-[#071b33]">Recent Applications</h2>
            <p className="mt-1 text-sm text-[#4a617d]">Your latest submissions and statuses.</p>
          </div>
          <Link className="inline-flex items-center gap-1 text-sm font-medium text-[#3f51d1] hover:text-[#2738b8]" href="/profile/applications">
            View all applications
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {recentApplications.length === 0 ? (
          <div className="mt-5 rounded-lg border border-dashed border-[#d7e2f3] bg-[#f8fbff] p-7 text-center">
            <p className="text-sm text-[#5e7490]">You have not submitted any applications yet.</p>
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto rounded-lg border border-[#e3ebf8]">
            <table className="w-full text-sm">
              <thead className="bg-[#f8fbff] text-left text-[#6d829c]">
                <tr>
                  <th className="px-3 py-2">Job Title</th>
                  <th className="px-3 py-2">Organization</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Submitted</th>
                  <th className="px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentApplications.map((application) => (
                  <tr key={application.application_id} className="border-t border-[#e7eef9]">
                    <td className="px-3 py-2 font-medium text-[#0f213b]">{application.job_title}</td>
                    <td className="px-3 py-2 text-[#31465f]">{application.organization_name ?? "-"}</td>
                    <td className="px-3 py-2">
                      <Badge variant={getStatusVariant(application.status)}>{toLabel(application.status)}</Badge>
                    </td>
                    <td className="px-3 py-2 text-[#31465f]">{new Date(application.submitted_at).toLocaleDateString()}</td>
                    <td className="px-3 py-2">
                      <Link className="text-[#3f51d1] hover:text-[#2738b8]" href={`/profile/applications/${application.application_id}`}>
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
