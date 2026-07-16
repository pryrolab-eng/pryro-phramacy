import type { ConsumeRateLimitInput, ConsumeRateLimitResult } from "./buckets";

type RedisClient = import("redis").RedisClientType;

let client: RedisClient | null = null;
let connectPromise: Promise<RedisClient | null> | null = null;

function normalizeRedisUrl(url: string): string {
  if (url.startsWith("redis://") && url.includes("upstash.io")) {
    return url.replace("redis://", "rediss://");
  }
  return url;
}

async function getRedisClient(): Promise<RedisClient | null> {
  const rawUrl = process.env.REDIS_URL?.trim();
  if (!rawUrl) return null;
  const url = normalizeRedisUrl(rawUrl);

  if (client?.isOpen) return client;

  if (!connectPromise) {
    connectPromise = (async () => {
      try {
        const { createClient } = await import("redis");
        const next = createClient({ url });
        next.on("error", (error) => {
          console.error("rate-limit redis:", error);
        });
        await next.connect();
        client = next;
        return next;
      } catch (error) {
        console.error("rate-limit redis connect:", error);
        client = null;
        return null;
      } finally {
        connectPromise = null;
      }
    })();
  }

  return connectPromise;
}

export function useRedisRateLimitStore(): boolean {
  if (process.env.RATE_LIMIT_STORE === "redis") return Boolean(process.env.REDIS_URL);
  if (process.env.RATE_LIMIT_STORE === "memory") return false;
  if (process.env.RATE_LIMIT_STORE === "postgres") return false;
  return Boolean(process.env.REDIS_URL);
}

export async function consumeFromRedis(
  input: ConsumeRateLimitInput,
): Promise<ConsumeRateLimitResult | null> {
  const redis = await getRedisClient();
  if (!redis) return null;

  const key = `rl:${input.bucketKey}`;

  try {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.pExpire(key, input.windowMs);
    }

    const ttlMs = await redis.pTTL(key);
    const windowRemainingMs = ttlMs > 0 ? ttlMs : input.windowMs;

    if (count > input.max) {
      return {
        allowed: false,
        retryAfterSec: Math.max(1, Math.ceil(windowRemainingMs / 1000)),
      };
    }

    return { allowed: true, remaining: Math.max(0, input.max - count) };
  } catch (error) {
    console.error("consumeFromRedis:", error);
    return null;
  }
}
