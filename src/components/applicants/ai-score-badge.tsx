"use client";

import { cn } from "@/lib/utils/cn";

interface AIScoreBadgeProps {
  score: number;
  className?: string;
}

export function AIScoreBadge({ score, className }: AIScoreBadgeProps) {
  const getScoreTier = (s: number) => {
    if (s >= 90) return { color: "bg-emerald-500", label: "Excellent Match" };
    if (s >= 75) return { color: "bg-blue-500", label: "Strong Match" };
    if (s >= 60) return { color: "bg-amber-500", label: "Good Match" };
    return { color: "bg-slate-400", label: "Review Needed" };
  };

  const tier = getScoreTier(score);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-white",
        tier.color,
        className
      )}
      title={tier.label}
    >
      <span>{score}%</span>
      <span className="hidden sm:inline">MATCH</span>
    </div>
  );
}
