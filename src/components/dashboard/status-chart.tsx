import { Skeleton } from "@/components/ui/skeleton";

interface StatusChartProps {
  data: Record<string, number>;
  loading?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  new: "#533afd",
  screening: "#60a5fa",
  interview: "#fbbf24",
  offer: "#a78bfa",
  accepted: "#34d399",
  rejected: "#f87171",
  withdrawn: "#9ca3af"
};

function StatusChart({ data, loading }: StatusChartProps) {
  if (loading) {
    return (
      <div className="rounded-lg border border-[#e5edf5] bg-[#ffffff] p-5">
        <Skeleton className="mb-4 h-4 w-40" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const total = Object.values(data).reduce((sum, v) => sum + v, 0);
  const sortedEntries = Object.entries(data).sort(([, a], [, b]) => b - a);

  return (
    <div className="rounded-lg border border-[#e5edf5] bg-[#ffffff] p-5">
      <h3 className="font-display text-lg font-medium text-[#061b31]">Applications by Status</h3>
      <p className="mt-1 text-xs text-[#64748d]">Distribution across the hiring pipeline.</p>
      <div className="mt-5 space-y-3">
        {sortedEntries.map(([status, count]) => {
          const pct = total > 0 ? (count / total) * 100 : 0;
          const color = STATUS_COLORS[status.toLowerCase()] ?? "#533afd";
          return (
            <div key={status} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="capitalize text-[#273951]">{status.replaceAll("_", " ")}</span>
                <span className="font-medium text-[#061b31]">{count}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#edf2f8]">
                <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%`, backgroundColor: color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { StatusChart };



