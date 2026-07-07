import { isPrismaConfigured } from "@/lib/db/is-prisma-configured";
import { consumeFromRedis, useRedisRateLimitStore } from "@/lib/rate-limit/redis-store";

export type ConsumeRateLimitInput = {
  bucketKey: string;
  max: number;
  windowMs: number;
};

export type ConsumeRateLimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; retryAfterSec: number };

const memoryBuckets = new Map<
  string,
  { windowStart: number; hitCount: number }
>();

function consumeInMemory(input: ConsumeRateLimitInput): ConsumeRateLimitResult {
  const now = Date.now();
  const existing = memoryBuckets.get(input.bucketKey);

  if (!existing || now - existing.windowStart >= input.windowMs) {
    memoryBuckets.set(input.bucketKey, { windowStart: now, hitCount: 1 });
    return { allowed: true, remaining: Math.max(0, input.max - 1) };
  }

  if (existing.hitCount >= input.max) {
    const retryAfterSec = Math.ceil(
      (input.windowMs - (now - existing.windowStart)) / 1000,
    );
    return { allowed: false, retryAfterSec: Math.max(1, retryAfterSec) };
  }

  existing.hitCount += 1;
  return {
    allowed: true,
    remaining: Math.max(0, input.max - existing.hitCount),
  };
}

async function consumeFromDb(
  input: ConsumeRateLimitInput,
): Promise<ConsumeRateLimitResult> {
  const { prisma } = await import("@/lib/db/prisma");
  const now = new Date();

  const row = await prisma.rate_limit_buckets.findUnique({
    where: { bucket_key: input.bucketKey },
    select: { window_start: true, hit_count: true },
  });

  if (!row) {
    await prisma.rate_limit_buckets.create({
      data: {
        bucket_key: input.bucketKey,
        window_start: now,
        hit_count: 1,
        updated_at: now,
      },
    });
    return { allowed: true, remaining: Math.max(0, input.max - 1) };
  }

  const windowStartMs = row.window_start.getTime();
  const elapsed = now.getTime() - windowStartMs;

  if (elapsed >= input.windowMs) {
    await prisma.rate_limit_buckets.update({
      where: { bucket_key: input.bucketKey },
      data: {
        window_start: now,
        hit_count: 1,
        updated_at: now,
      },
    });
    return { allowed: true, remaining: Math.max(0, input.max - 1) };
  }

  if (row.hit_count >= input.max) {
    const retryAfterSec = Math.ceil((input.windowMs - elapsed) / 1000);
    return { allowed: false, retryAfterSec: Math.max(1, retryAfterSec) };
  }

  const nextCount = row.hit_count + 1;
  await prisma.rate_limit_buckets.update({
    where: { bucket_key: input.bucketKey },
    data: { hit_count: nextCount, updated_at: now },
  });

  return {
    allowed: true,
    remaining: Math.max(0, input.max - nextCount),
  };
}

function useDbRateLimitStore(): boolean {
  if (process.env.RATE_LIMIT_STORE === "postgres") return true;
  if (process.env.RATE_LIMIT_STORE === "memory") return false;
  // Postgres rate limits hit the DB on every API request — avoid as a silent
  // default on serverless (Vercel + small Supabase session pools). Use Redis
  // (REDIS_URL) for distributed limits, or memory per isolate otherwise.
  if (process.env.VERCEL) return false;
  return isPrismaConfigured() && process.env.NODE_ENV === "production";
}

/** Returns false when the request should be rejected (429). */
export async function consumeRateLimit(
  input: ConsumeRateLimitInput,
): Promise<ConsumeRateLimitResult> {
  if (input.max <= 0) {
    return { allowed: true, remaining: input.max };
  }

  if (useRedisRateLimitStore()) {
    try {
      const redisResult = await consumeFromRedis(input);
      if (redisResult) return redisResult;
    } catch (error) {
      console.error("consumeRateLimit redis fallback:", error);
    }
  }

  if (useDbRateLimitStore()) {
    try {
      return await consumeFromDb(input);
    } catch (error) {
      console.error("consumeRateLimit db fallback:", error);
    }
  }

  return consumeInMemory(input);
}
