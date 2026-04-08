import Link from "next/link";
import { redirect } from "next/navigation";
import { Briefcase, LogOut, UserRound } from "lucide-react";

import { signOutAction } from "@/features/auth/actions";
import { getCurrentUser, getCurrentUserRole } from "@/features/auth/service";
import { listCurrentUserApplications } from "@/features/profile/service";
import { isAdminRole } from "@/lib/utils/constants";

function toLabel(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function ApplicantProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/profile");
  }

  const role = await getCurrentUserRole();

  if (isAdminRole(role)) {
    redirect("/dashboard");
  }

  const applications = await listCurrentUserApplications(user.id);
  const displayRole = role ? toLabel(role) : "User";

  return (
    <div className="min-h-screen bg-[#f6f9fc] px-4 py-8 lg:px-8 lg:py-10">
      <section className="rounded-xl border border-[#d6d9fc] bg-gradient-to-br from-white via-[#f8f9ff] to-[#eef2ff] p-6 shadow-[0_18px_45px_-30px_rgba(83,58,253,0.35)] lg:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="code-label text-[11px] uppercase tracking-[0.12em] text-[#64748d]">Applicant Profile</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#061b31] lg:text-4xl">Welcome, {user.user_metadata.full_name ?? "Applicant"}</h1>
            <p className="mt-2 text-sm text-[#273951]">Manage your account and track your submitted applications.</p>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-[#d6d9fc] bg-white px-3 py-2 text-sm text-[#273951]">
            <UserRound className="h-4 w-4 text-[#533afd]" />
            {displayRole}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            className="inline-flex items-center gap-2 rounded-md bg-[#533afd] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4434d4]"
            href="/apply"
          >
            <Briefcase className="h-4 w-4" />
            Browse Open Roles
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-md border border-[#d6d9fc] bg-white px-4 py-2 text-sm font-medium text-[#4434d4] transition-colors hover:bg-[#f4f6ff]"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-[#e5edf5] bg-white p-6 shadow-[0_18px_34px_-34px_rgba(6,27,49,0.65)] lg:p-8">
        <h2 className="text-xl font-semibold text-[#061b31]">My Applications</h2>
        <p className="mt-1 text-sm text-[#64748d]">Applications submitted from your account.</p>

        {applications.length === 0 ? (
          <div className="mt-5 rounded-lg border border-[#e5edf5] bg-[#f8fafc] p-6 text-center">
            <p className="text-sm text-[#64748d]">You have not submitted any applications yet.</p>
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto rounded-lg border border-[#e5edf5]">
            <table className="w-full text-sm">
              <thead className="bg-[#f8fafc] text-left text-[#64748d]">
                <tr>
                  <th className="px-3 py-2">Job Title</th>
                  <th className="px-3 py-2">Organization</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((application) => (
                  <tr key={application.application_id} className="border-t border-[#e5edf5]">
                    <td className="px-3 py-2 text-[#061b31]">{application.job_title}</td>
                    <td className="px-3 py-2 text-[#273951]">{application.organization_name ?? "-"}</td>
                    <td className="px-3 py-2 text-[#273951]">
                      {application.role_type ? toLabel(application.role_type) : "-"}
                      {application.employment_type ? ` - ${toLabel(application.employment_type)}` : ""}
                    </td>
                    <td className="px-3 py-2 text-[#273951]">{toLabel(application.status)}</td>
                    <td className="px-3 py-2 text-[#273951]">{new Date(application.submitted_at).toLocaleDateString()}</td>
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
