import "server-only";

import { createHash } from "crypto";

import { createClient } from "@supabase/supabase-js";

type RateLimitBlockedLogInput = {
  scope: string;
  key: string;
  retryAfterMs: number;
  remaining: number;
  metadata?: Record<string, string | number | boolean | null | undefined>;
};

function hashKey(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

function normalizeMetadata(metadata: RateLimitBlockedLogInput["metadata"]): Record<string, string | number | boolean | null> {
  const source = metadata ?? {};
  const normalized: Record<string, string | number | boolean | null> = {};

  for (const [key, value] of Object.entries(source)) {
    normalized[key] = value ?? null;
  }

  return normalized;
}

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

function createSecurityEventClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn("Security event logging is disabled because the Supabase service role variables are missing.");
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export async function logRateLimitBlockedEvent(input: RateLimitBlockedLogInput) {
  const payload = {
    event: "security.rate_limit.blocked",
    scope: input.scope,
    key_hash: hashKey(input.key),
    retry_after_ms: input.retryAfterMs,
    remaining: input.remaining,
    metadata: normalizeMetadata(input.metadata),
    timestamp: new Date().toISOString()
  };

  console.warn(JSON.stringify(payload));

  try {
    const supabase = createSecurityEventClient();

    if (!supabase) {
      return;
    }

    const { error } = await supabase.from("security_events").insert({
      event: payload.event,
      scope: payload.scope,
      key_hash: payload.key_hash,
      retry_after_ms: payload.retry_after_ms,
      remaining: payload.remaining,
      metadata: payload.metadata
    });

    if (error) {
      if (isMissingSecurityEventsTableError(error)) {
        console.warn("Security events table is not available yet; skipping persistence.");
        return;
      }

      console.error("Failed to persist security event", error);
    }
  } catch (error) {
    if (isMissingSecurityEventsTableError(error)) {
      console.warn("Security events table is not available yet; skipping persistence.");
      return;
    }

    console.error("Failed to persist security event", error);
  }
}
