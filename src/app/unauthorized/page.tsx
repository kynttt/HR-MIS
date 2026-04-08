import Link from "next/link";

import { getCurrentUser, getCurrentUserRole } from "@/features/auth/service";
import { isAdminRole } from "@/lib/utils/constants";

export default async function UnauthorizedPage() {
  const user = await getCurrentUser();
  const role = user ? await getCurrentUserRole() : null;
  const fallbackHref = isAdminRole(role) ? "/dashboard" : "/profile";
  const fallbackLabel = isAdminRole(role) ? "Back to dashboard" : "Back to profile";

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-3xl text-[#061b31]">Unauthorized</h1>
      <p className="mt-3 text-sm text-[#64748d]">Your account does not currently have access to this page.</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link href={fallbackHref} className="rounded-md bg-[#0f172a] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e293b]">
          {fallbackLabel}
        </Link>
        <Link href="/apply" className="rounded-md border border-[#d6d9fc] bg-white px-4 py-2 text-sm font-medium text-[#273951] hover:bg-[#f4f7ff]">
          Browse open roles
        </Link>
      </div>
    </main>
  );
}
