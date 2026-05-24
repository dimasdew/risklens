const windowMs = 60_000; // 1 minute window
const maxRequests = 10; // max 10 requests per minute per IP

type Entry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, Entry>();

// Clean up expired entries periodically to avoid memory leaks
let lastCleanup = Date.now();
const cleanupInterval = 5 * 60_000; // 5 minutes

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
};

export function checkRateLimit(identifier: string): RateLimitResult {
  cleanup();

  const now = Date.now();
  const existing = store.get(identifier);

  if (!existing || now >= existing.resetAt) {
    const entry: Entry = { count: 1, resetAt: now + windowMs };
    store.set(identifier, entry);
    return { allowed: true, remaining: maxRequests - 1, resetAt: entry.resetAt };
  }

  if (existing.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - existing.count),
    resetAt: existing.resetAt
  };
}
