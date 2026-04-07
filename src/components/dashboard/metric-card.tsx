import { cn } from "@/lib/utils/cn";
import { Skeleton } from "@/components/ui/skeleton";

interface MetricCardProps {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
  trend?: {
    value: number;
    positive: boolean;
  };
  loading?: boolean;
  className?: string;
}

function MetricCard({ icon, label, value, trend, loading, className }: MetricCardProps) {
  if (loading) {
    return (
      <div className={cn("rounded-lg border border-[#e5edf5] bg-[#ffffff] p-5", className)}>
        <Skeleton className="mb-3 h-4 w-24" />
        <Skeleton className="mb-2 h-8 w-16" />
        <Skeleton className="h-3 w-20" />
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border border-[#e5edf5] bg-[#ffffff] p-5", className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#64748d]">{label}</p>
        {icon ? <div className="rounded-lg border border-brand-500/30 bg-brand-500/10 p-2 text-brand-100">{icon}</div> : null}
      </div>
      <p className="mt-3 font-display text-3xl font-medium tracking-tight text-[#061b31]">{value}</p>
      {trend ? (
        <p className={cn("mt-1 text-xs", trend.positive ? "text-emerald-300" : "text-rose-300")}>
          {trend.positive ? "Up" : "Down"} {Math.abs(trend.value)}% vs last month
        </p>
      ) : null}
    </div>
  );
}

export { MetricCard };



