import { redirect } from "next/navigation";
import { Building2, LogOut, ShieldCheck } from "lucide-react";

import { signOutAction } from "@/features/auth/actions";
import { getCurrentUser, getCurrentUserRole } from "@/features/auth/service";
import { ProfileShellNav } from "@/features/profile/profile-shell-nav";
import { isAdminRole } from "@/lib/utils/constants";

export default async function ApplicantProfileLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/profile");
  }

  const role = await getCurrentUserRole();

  if (isAdminRole(role)) {
    redirect("/dashboard");
  }

  const fullName = user.user_metadata.full_name ?? "Applicant";
  const email = user.email ?? "";

  return (
    <div className="min-h-screen bg-[#f6f9fc] text-[#061b31]">
      <header className="sticky top-0 z-20 border-b border-[#e5edf5] bg-white/90 backdrop-blur">
        <div className="flex w-full items-center justify-between gap-4 px-4 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-brand-100 bg-brand-50 text-brand-500">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="code-label text-[11px] text-[#64748d]">University HRMIS</p>
              <h1 className="font-display text-lg font-normal tracking-tight text-[#061b31]">Applicant Workspace</h1>
              <p className="truncate text-xs text-[#64748d]">{fullName} • {email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 rounded-md border border-brand-100 bg-brand-50 px-2.5 py-1 text-xs uppercase tracking-[0.08em] text-brand-500">
              <ShieldCheck className="h-3.5 w-3.5" />
              User Account
            </span>
            <form action={signOutAction}>
              <button
                suppressHydrationWarning
                type="submit"
                className="inline-flex items-center gap-2 rounded-md border border-[#d6d9fc] bg-white px-4 py-2 text-sm font-medium text-[#533afd] transition-colors hover:bg-[#f4f7ff]"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="grid w-full grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[248px_1fr] lg:px-8">
        <aside className="surface-panel h-fit p-3 lg:sticky lg:top-24">
          <p className="code-label px-3 pb-2 text-[11px] text-[#64748d]">Navigation</p>
          <ProfileShellNav />
        </aside>
        <main className="min-w-0 page-enter">{children}</main>
      </div>
    </div>
  );
}
