import Link from "next/link";
import { type ReactNode } from "react";
import { Briefcase, Building2, LayoutDashboard, UserRound } from "lucide-react";

import { signOutAction } from "@/features/auth/actions";
import { getCurrentUser, getCurrentUserRole } from "@/features/auth/service";
import { isAdminRole } from "@/lib/utils/constants";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  const role = user ? await getCurrentUserRole() : null;
  const isAdmin = isAdminRole(role);

  return (
    <div className="min-h-screen bg-[#f6f9fc]">
      <header className="sticky top-0 z-20 border-b border-[#e5edf5] bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-4 py-3 lg:px-8">
          <Link className="flex items-center gap-2 text-[#061b31]" href={isAdmin ? "/dashboard" : "/apply"}>
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-brand-100 bg-brand-50 text-brand-500">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <p className="code-label text-[11px] text-[#64748d]">University HRMIS</p>
              <p className="text-sm font-medium">Open Roles Portal</p>
            </div>
          </Link>

          <nav className="flex items-center gap-2">
            <Link
              className="inline-flex items-center gap-1 rounded-md border border-[#d6d9fc] bg-white px-3 py-2 text-sm font-medium text-[#273951] transition-colors hover:bg-[#f4f7ff]"
              href="/apply"
            >
              <Briefcase className="h-4 w-4" />
              Open Roles
            </Link>

            {user ? (
              <>
                <Link
                  className="inline-flex items-center gap-1 rounded-md border border-[#d6d9fc] bg-white px-3 py-2 text-sm font-medium text-[#273951] transition-colors hover:bg-[#f4f7ff]"
                  href={isAdmin ? "/dashboard" : "/profile"}
                >
                  {isAdmin ? <LayoutDashboard className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}
                  {isAdmin ? "Dashboard" : "Profile"}
                </Link>
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="rounded-md border border-[#d6d9fc] bg-white px-3 py-2 text-sm font-medium text-[#533afd] transition-colors hover:bg-[#f4f7ff]"
                  >
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  className="rounded-md border border-[#d6d9fc] bg-white px-3 py-2 text-sm font-medium text-[#273951] transition-colors hover:bg-[#f4f7ff]"
                  href="/login"
                >
                  Sign in
                </Link>
                <Link
                  className="rounded-md bg-[#533afd] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4434d4]"
                  href="/register"
                >
                  Create account
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <div className="page-enter">{children}</div>
    </div>
  );
}
