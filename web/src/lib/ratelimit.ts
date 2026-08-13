import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { headers } from "next/headers";

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const redis = getRedis();

if (!redis && process.env.NODE_ENV === "production") {
  // eslint-disable-next-line no-console
  console.warn(
    "[ratelimit] UPSTASH_REDIS_REST_URL/TOKEN not configured — rate limiting is DISABLED in this production deployment."
  );
}

function makeLimiter(prefix: string, limit: number, window: string) {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    prefix,
    limiter: Ratelimit.slidingWindow(limit, window as "1 m" | "10 m" | "1 h"),
    analytics: true,
  });
}

export const limiters = {
  magicLink: makeLimiter("ml", 5, "1 h"),
  magicLinkIp: makeLimiter("ml-ip", 20, "1 h"),
  booking: makeLimiter("bk", 10, "10 m"),
  message: makeLimiter("msg", 30, "10 m"),
  cron: makeLimiter("cron", 60, "1 m"),
  stripeWebhook: makeLimiter("wh-stripe", 200, "1 m"),
};

export async function getClientIp(): Promise<string> {
  const h = await headers();
  const xff = h.get("x-forwarded-for") || "";
  return xff.split(",")[0].trim() || "unknown";
}

/**
 * Check a rate limit. If Upstash is not configured (e.g. local dev), returns
 * `{ ok: true }` so the app remains functional without a Redis instance.
 */
export async function checkLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<{ ok: boolean; remaining: number }> {
  if (!limiter) return { ok: true, remaining: Infinity };
  const { success, remaining } = await limiter.limit(identifier);
  return { ok: success, remaining };
}