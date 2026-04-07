import * as React from "react";

import { cn } from "@/lib/utils/cn";

type BadgeProps = {
  children: React.ReactNode;
  variant?: "default" | "success" | "danger" | "muted" | "outline" | "warning";
  className?: string;
};

const variantClasses: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "border border-brand-100 bg-brand-50 text-brand-900",
  success: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  danger: "border border-rose-200 bg-rose-50 text-rose-700",
  muted: "border border-[#e5edf5] bg-[#ffffff] text-[#64748d]",
  outline: "border border-[#d6d9fc] bg-transparent text-[#533afd]",
  warning: "border border-amber-200 bg-amber-50 text-amber-700"
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return <span className={cn("inline-flex rounded-md px-2 py-0.5 text-xs font-medium", variantClasses[variant], className)}>{children}</span>;
}
