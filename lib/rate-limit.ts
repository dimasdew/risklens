type RateLimitConfig = {
  windowMs: number;
  maxRequests: number;
};

const configs: Record<string, RateLimitConfig> = {
  scan: { windowMs: 60_000, maxRequests: 6 },
  api: { windowMs: 60_000, maxRequests: 30 },
  auth: { windowMs: 300_000, maxRequests: 5 },
  default: { windowMs: 60_000, maxRequests: 10 },
};

type Entry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, Entry>();

let lastCleanup = Date.now();
const cleanupInterval = 5 * 60_000;

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < cleanupInterval) return;
  lastCleanup = now;

  for (const [key, entry] of store) {
    if (now >= entry.resetAt) {
      store.delete(key);
    }
  }
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterMs: number;
};

export function checkRateLimit(identifier: string, route: string = "default"): RateLimitResult {
  cleanup();

  const config = configs[route] ?? configs.default;
  const key = `${route}:${identifier}`;
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || now >= existing.resetAt) {
    const entry: Entry = { count: 1, resetAt: now + config.windowMs };
    store.set(key, entry);
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: entry.resetAt, retryAfterMs: 0 };
  }

  if (existing.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt, retryAfterMs: existing.resetAt - now };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, config.maxRequests - existing.count),
    resetAt: existing.resetAt,
    retryAfterMs: 0,
  };
}

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
    ...(result.retryAfterMs > 0 ? { "Retry-After": String(Math.ceil(result.retryAfterMs / 1000)) } : {}),
  };
}
