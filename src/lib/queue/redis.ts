export type RedisConnectionConfig = {
  host: string;
  port: number;
  password?: string;
};

export function getRedisConnection(): RedisConnectionConfig {
  const host = process.env.REDIS_HOST ?? "127.0.0.1";
  const port = Number(process.env.REDIS_PORT ?? 6379);
  const password = process.env.REDIS_PASSWORD || undefined;
  return { host, port, password };
}

export function isRedisConfigured(): boolean {
  return Boolean(process.env.REDIS_URL || process.env.REDIS_HOST);
}
