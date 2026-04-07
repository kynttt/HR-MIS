import { type ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("surface-card p-4", className)}>{children}</div>;
}
