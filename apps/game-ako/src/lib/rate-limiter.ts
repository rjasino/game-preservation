interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}, 60_000);

function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return "127.0.0.1";
}

/**
 * Check if a request is rate limited.
 * Returns true if the request should be blocked.
 */
export function checkRateLimit(request: Request): boolean {
  const ip = getClientIP(request);
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now > entry.resetAt) {
    // First attempt or window expired — reset
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count++;

  if (entry.count > MAX_ATTEMPTS) {
    // Over limit — set lockout
    entry.resetAt = now + LOCKOUT_MS;
    return true;
  }

  return false;
}

/**
 * Reset rate limit for an IP (e.g., after successful login).
 */
export function resetRateLimit(request: Request): void {
  const ip = getClientIP(request);
  store.delete(ip);
}

/**
 * Get remaining attempts for an IP.
 */
export function getRemainingAttempts(request: Request): number {
  const ip = getClientIP(request);
  const entry = store.get(ip);
  if (!entry) return MAX_ATTEMPTS;
  return Math.max(0, MAX_ATTEMPTS - entry.count);
}
