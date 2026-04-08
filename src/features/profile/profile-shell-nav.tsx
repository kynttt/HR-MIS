"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import { Briefcase, FileText, LayoutGrid, Settings } from "lucide-react";

import { cn } from "@/lib/utils/cn";

const navItems: Array<{ href: Route; label: string; icon: ComponentType<{ className?: string }> }> = [
  { href: "/profile", label: "Overview", icon: LayoutGrid },
  { href: "/profile/applications", label: "My Applications", icon: FileText },
  { href: "/profile/settings", label: "Settings", icon: Settings },
  { href: "/apply", label: "Browse Roles", icon: Briefcase }
];

function isItemActive(pathname: string, href: Route): boolean {
  if (href === "/profile") {
    return pathname === "/profile";
  }

  if (href === "/apply") {
    return pathname === "/apply" || pathname.startsWith("/apply/");
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ProfileShellNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const ItemIcon = item.icon;
        const active = isItemActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
              active
                ? "border-[#cfd5ff] bg-[#eef2ff] text-[#2b1ea8] shadow-sm"
                : "border-transparent text-[#273951] hover:border-[#d6d9fc] hover:bg-[#f4f7ff] hover:text-[#061b31]"
            )}
          >
            <ItemIcon className={cn("h-4 w-4 shrink-0", active ? "text-[#4f46e5]" : "text-current")} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
