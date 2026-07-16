export type RedisConnectionConfig = {
  host: string;
  port: number;
  password?: string;
  tls?: object;
};

export function getRedisConnection(): RedisConnectionConfig {
  // Prefer REDIS_URL (supports rediss:// for TLS/Upstash)
  if (process.env.REDIS_URL) {
    const url = new URL(process.env.REDIS_URL);
    const isTLS = url.protocol === "rediss:";
    return {
      host: url.hostname,
      port: Number(url.port || (isTLS ? 6380 : 6379)),
      password: url.password || undefined,
      tls: isTLS ? {} : undefined,
    };
  }
  const host = process.env.REDIS_HOST ?? "127.0.0.1";
  const port = Number(process.env.REDIS_PORT ?? 6379);
  const password = process.env.REDIS_PASSWORD || undefined;
  return { host, port, password };
}

export function isRedisConfigured(): boolean {
  return Boolean(process.env.REDIS_URL || process.env.REDIS_HOST);
}
