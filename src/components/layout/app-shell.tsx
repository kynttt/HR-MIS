"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type Route } from "next";
import { type ComponentType, type ReactNode } from "react";
import { Briefcase, Building2, LayoutDashboard, ShieldCheck, Users, UserCog, FileStack } from "lucide-react";

import { signOutAction } from "@/features/auth/actions";
import { type AdminRole } from "@/lib/utils/constants";

type NavIcon = ComponentType<{ className?: string }>;

const baseNavItems: Array<{ href: Route; label: string; icon: NavIcon }> = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/applications", label: "Applications", icon: FileStack },
  { href: "/jobs", label: "Job Openings", icon: Briefcase },
  { href: "/departments", label: "Departments", icon: Building2 },
  { href: "/employees", label: "Employees", icon: Users }
];

const superAdminItems: Array<{ href: Route; label: string; icon: NavIcon }> = [
  { href: "/users", label: "User Management", icon: UserCog }
];

export function AppShell({ children, role }: { children: ReactNode; role: AdminRole }) {
  const pathname = usePathname();
  const navItems = role === "super_admin" ? [...baseNavItems, ...superAdminItems] : baseNavItems;
  const hideSidebar = pathname === "/applications/pipeline";

  return (
    <div className="min-h-screen bg-[#f6f9fc] text-[#061b31]">
      <header className="sticky top-0 z-20 border-b border-[#e5edf5] bg-white/90 backdrop-blur">
        <div className="flex w-full items-center justify-between gap-4 px-4 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-brand-100 bg-brand-50 text-brand-500">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="code-label text-[11px] text-[#64748d]">University HRMIS</p>
              <h1 className="font-display text-lg font-normal tracking-tight text-[#061b31]">Recruitment and Employee Records</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 rounded-md border border-brand-100 bg-brand-50 px-2.5 py-1 text-xs uppercase tracking-[0.08em] text-brand-500">
              <ShieldCheck className="h-3.5 w-3.5" />
              {role.replace("_", " ")}
            </span>
            <form action={signOutAction}>
              <button
                suppressHydrationWarning
                type="submit"
                className="rounded-md border border-[#d6d9fc] bg-white px-4 py-2 text-sm font-medium text-[#533afd] transition-colors hover:bg-[#f4f7ff]"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className={hideSidebar ? "w-full px-4 py-6 lg:px-8" : "grid w-full grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[248px_1fr] lg:px-8"}>
        {hideSidebar ? null : (
          <aside className="surface-panel h-fit p-3 lg:sticky lg:top-24">
            <p className="code-label px-3 pb-2 text-[11px] text-[#64748d]">Navigation</p>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const ItemIcon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2 rounded-md border border-transparent px-3 py-2 text-sm text-[#273951] transition-colors hover:border-[#d6d9fc] hover:bg-[#f4f7ff] hover:text-[#061b31]"
                  >
                    <ItemIcon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        )}
        <main className="min-w-0 page-enter">{children}</main>
      </div>
    </div>
  );
}



