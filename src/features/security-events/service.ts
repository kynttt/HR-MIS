import { createClient as createServerClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

export type SecurityEventItem = {
  id: string;
  event: string;
  scope: string;
  key_hash: string;
  retry_after_ms: number;
  remaining: number;
  metadata: Json;
  created_at: string;
};

export type SecurityEventFilters = {
  q?: string;
  scope?: string;
};

export type PaginatedSecurityEventsResult = {
  items: SecurityEventItem[];
  total: number;
  notice?: string;
};

function isMissingSecurityEventsTableError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeError = error as { code?: unknown; message?: unknown };
  const message = typeof maybeError.message === "string" ? maybeError.message.toLowerCase() : "";

  return (
    maybeError.code === "42P01" ||
    message.includes("could not find the table public.security_events in schema cache") ||
    (message.includes("security_events") && message.includes("schema cache"))
  );
}

export async function listSecurityEventsPaginated(
  filters: SecurityEventFilters,
  page: number,
  pageSize: number
): Promise<PaginatedSecurityEventsResult> {
  const supabase = await createServerClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("security_events")
    .select("id, event, scope, key_hash, retry_after_ms, remaining, metadata, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  const keyword = filters.q?.trim() ?? "";
  if (keyword) {
    query = query.or(`scope.ilike.%${keyword}%,event.ilike.%${keyword}%`);
  }

  if (filters.scope) {
    query = query.eq("scope", filters.scope);
  }

  const { data, error, count } = await query;

  if (error) {
    if (isMissingSecurityEventsTableError(error)) {
      return {
        items: [],
        total: 0,
        notice: "Security event storage is not ready yet. Apply the migration to view events."
      };
    }

    throw new Error((error as { message?: string }).message ?? "Failed to load security events.");
  }

  const items = (data ?? []).map((item) => ({
    id: item.id,
    event: item.event,
    scope: item.scope,
    key_hash: item.key_hash,
    retry_after_ms: item.retry_after_ms,
    remaining: item.remaining,
    metadata: item.metadata ?? {},
    created_at: item.created_at
  }));

  return { items, total: count ?? 0 };
}
