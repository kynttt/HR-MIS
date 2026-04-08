const RATE_LIMIT_STORE = new Map<string, { count: number; resetAt: number }>();

type RateLimitOptions = {
  key: string;
  max: number;
  windowMs: number;
};

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterMs: number;
};

function enforceInMemoryRateLimit(options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const existing = RATE_LIMIT_STORE.get(options.key);

  if (!existing || existing.resetAt <= now) {
    RATE_LIMIT_STORE.set(options.key, {
      count: 1,
      resetAt: now + options.windowMs
    });

    return {
      ok: true,
      remaining: Math.max(0, options.max - 1),
      retryAfterMs: 0
    };
  }

  if (existing.count >= options.max) {
    return {
      ok: false,
      remaining: 0,
      retryAfterMs: Math.max(0, existing.resetAt - now)
    };
  }

  existing.count += 1;
  RATE_LIMIT_STORE.set(options.key, existing);

  return {
    ok: true,
    remaining: Math.max(0, options.max - existing.count),
    retryAfterMs: 0
  };
}

type UpstashPipelineResult = Array<{
  result?: number | string | null;
  error?: string;
}>;

async function enforceUpstashRateLimit(options: RateLimitOptions): Promise<RateLimitResult | null> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl || !redisToken) {
    return null;
  }

  const redisKey = `ratelimit:${options.key}`;

  try {
    const response = await fetch(`${redisUrl}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${redisToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify([
        ["INCR", redisKey],
        ["PEXPIRE", redisKey, options.windowMs, "NX"],
        ["PTTL", redisKey]
      ])
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as UpstashPipelineResult;

    const countRaw = payload[0]?.result;
    const pttlRaw = payload[2]?.result;

    const count = typeof countRaw === "number" ? countRaw : Number.parseInt(String(countRaw ?? "0"), 10);
    const pttl = typeof pttlRaw === "number" ? pttlRaw : Number.parseInt(String(pttlRaw ?? "0"), 10);

    const retryAfterMs = Number.isFinite(pttl) && pttl > 0 ? pttl : options.windowMs;

    if (!Number.isFinite(count) || count <= 0) {
      return null;
    }

    if (count > options.max) {
      return {
        ok: false,
        remaining: 0,
        retryAfterMs
      };
    }

    return {
      ok: true,
      remaining: Math.max(0, options.max - count),
      retryAfterMs: 0
    };
  } catch (error) {
    console.error("Distributed rate limit backend unavailable, falling back to in-memory", error);
    return null;
  }
}

export async function enforceRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const distributedResult = await enforceUpstashRateLimit(options);
  if (distributedResult) {
    return distributedResult;
  }

  return enforceInMemoryRateLimit(options);
}
