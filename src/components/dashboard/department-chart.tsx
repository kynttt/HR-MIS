import { Skeleton } from "@/components/ui/skeleton";

interface DepartmentChartProps {
  data: { name: string; count: number }[];
  loading?: boolean;
}

const DEPT_COLORS = ["#533afd", "#60a5fa", "#fbbf24", "#a78bfa", "#34d399", "#f87171", "#9ca3af"];

function DepartmentDonut({ data, loading }: DepartmentChartProps) {
  if (loading) {
    return (
      <div className="rounded-lg border border-[#e5edf5] bg-[#ffffff] p-5">
        <Skeleton className="mb-4 h-4 w-40" />
        <div className="flex items-center gap-6">
          <Skeleton className="h-32 w-32 rounded-full" />
          <div className="flex-1 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.count, 0);

  const conicGradient =
    data.length > 0
      ? `conic-gradient(${data
          .map((d, i) => {
            const pct = total > 0 ? (d.count / total) * 100 : 0;
            const prevPct = data
              .slice(0, i)
              .reduce((s, x) => s + (total > 0 ? (x.count / total) * 100 : 0), 0);
            return `${DEPT_COLORS[i % DEPT_COLORS.length]} ${prevPct}% ${prevPct + pct}%`;
          })
          .join(", ")})`
      : "conic-gradient(#e5edf5 0% 100%)";

  return (
    <div className="rounded-lg border border-[#e5edf5] bg-[#ffffff] p-5">
      <h3 className="font-display text-lg font-medium text-[#061b31]">Employees by Department</h3>
      <p className="mt-1 text-xs text-[#64748d]">Department-level distribution of active employees.</p>
      <div className="mt-5 flex items-center gap-6">
        <div className="h-32 w-32 shrink-0 rounded-full border border-[#e5edf5]" style={{ background: conicGradient }} />
        <div className="flex-1 space-y-2">
          {data.slice(0, 6).map((d, i) => (
            <div key={d.name} className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: DEPT_COLORS[i % DEPT_COLORS.length] }} />
              <span className="flex-1 truncate text-xs text-[#64748d]">{d.name}</span>
              <span className="text-xs font-medium text-[#061b31]">{d.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export { DepartmentDonut };



