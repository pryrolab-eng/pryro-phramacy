import { createClient, RedisClientType } from "redis";

let redisClient: RedisClientType | null = null;
let connectPromise: Promise<RedisClientType> | null = null;

function normalizeRedisUrl(url: string): string {
  // Upstash requires TLS (rediss://). Auto-convert if host looks like Upstash.
  if (url.startsWith("redis://") && url.includes("upstash.io")) {
    return url.replace("redis://", "rediss://");
  }
  return url;
}

export async function getRedis(): Promise<RedisClientType | null> {
  if (redisClient?.isOpen) return redisClient;

  if (!connectPromise) {
    connectPromise = (async () => {
      const rawUrl = process.env.REDIS_URL;
      if (!rawUrl) return null as any;

      const url = normalizeRedisUrl(rawUrl.trim());

      const client = createClient({ url });
      client.on("error", (err) => console.error("Redis error:", err));
      await client.connect();
      return client;
    })();
  }

  try {
    redisClient = await connectPromise;
    return redisClient;
  } catch {
    connectPromise = null;
    return null;
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = await getRedis();
  if (!redis) return null;

  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 600): Promise<void> {
  const redis = await getRedis();
  if (!redis) return;

  try {
    await redis.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch {
    // ignore cache errors
  }
}

export async function cacheDel(pattern: string): Promise<void> {
  const redis = await getRedis();
  if (!redis) return;

  try {
    const keys = await redis.keys(pattern);
    if (keys.length) await redis.del(keys);
  } catch {
    // ignore
  }
}

export async function cacheDelByPrefix(prefix: string): Promise<void> {
  await cacheDel(`${prefix}:*`);
}