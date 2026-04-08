import { ShieldAlert } from "lucide-react";

import { Input } from "@/components/ui/input";
import { QueryPagination } from "@/components/ui/query-pagination";
import { Select } from "@/components/ui/select";
import { requireAdminRole } from "@/features/auth/service";
import { listSecurityEventsPaginated, type SecurityEventItem } from "@/features/security-events/service";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const PAGE_SIZE = 25;

function toPositiveInt(value: string | string[] | undefined, fallback: number): number {
  if (typeof value !== "string") return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function toScope(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function toQuery(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

function formatMetadata(metadata: SecurityEventItem["metadata"]): string {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return "{}";
  }

  return JSON.stringify(metadata);
}

export default async function SecurityEventsPage({ searchParams }: Props) {
  await requireAdminRole(["super_admin", "hr_admin"]);

  const query = await searchParams;
  const q = toQuery(query.q);
  const scope = toScope(query.scope);
  const page = toPositiveInt(query.page, 1);

  let result = await listSecurityEventsPaginated({ q, scope }, page, PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  if (currentPage !== page) {
    result = await listSecurityEventsPaginated({ q, scope }, currentPage, PAGE_SIZE);
  }

  const { items, total, notice } = result;
  const availableScopes = Array.from(new Set(items.map((item) => item.scope))).sort();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-semibold text-[#061b31]"><ShieldAlert className="h-6 w-6" />Security Events</h2>
        <p className="text-sm text-[#64748d]">Rate-limit and abuse-related security telemetry for super admins.</p>
      </div>

      {notice ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
          {notice}
        </div>
      ) : null}

      <form className="grid gap-2 rounded-lg border border-[#e5edf5] bg-[#f6f9fc] p-4 md:grid-cols-4">
        <Input defaultValue={q} name="q" placeholder="Search event/scope" />
        <Select defaultValue={scope ?? ""} name="scope">
          <option value="">All event scopes</option>
          {availableScopes.map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
        </Select>
        <button className="rounded-md border border-[#d6d9fc] bg-white px-4 py-2 text-sm font-medium text-[#533afd] hover:bg-[#f4f7ff]" type="submit">
          Apply Filters
        </button>
      </form>

      <div className="overflow-hidden rounded-lg border border-[#e5edf5] bg-[#f6f9fc]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#ffffff] text-left text-[#64748d]">
              <tr>
                <th className="px-3 py-2">Timestamp</th>
                <th className="px-3 py-2">Event</th>
                <th className="px-3 py-2">Scope</th>
                <th className="px-3 py-2">Retry (ms)</th>
                <th className="px-3 py-2">Key Hash</th>
                <th className="px-3 py-2">Metadata</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td className="px-3 py-6 text-center text-[#64748d]" colSpan={6}>{notice ? "No persisted security events are available yet." : "No security events found."}</td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-t border-[#e5edf5]">
                    <td className="px-3 py-2 text-[#061b31]">{new Date(item.created_at).toLocaleString()}</td>
                    <td className="px-3 py-2 text-[#273951]">{item.event}</td>
                    <td className="px-3 py-2 text-[#273951]">{item.scope}</td>
                    <td className="px-3 py-2 text-[#273951]">{item.retry_after_ms}</td>
                    <td className="px-3 py-2 font-mono text-xs text-[#273951]">{item.key_hash}</td>
                    <td className="max-w-[360px] truncate px-3 py-2 font-mono text-xs text-[#64748d]" title={formatMetadata(item.metadata)}>
                      {formatMetadata(item.metadata)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <QueryPagination page={currentPage} pageSize={PAGE_SIZE} total={total} />
      </div>
    </div>
  );
}

