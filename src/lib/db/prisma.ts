import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function resolveDatasourceUrl(): string | undefined {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) return undefined;

  try {
    const url = new URL(raw);
    if (!url.searchParams.has("connection_limit")) {
      // Serverless: one connection per isolate. Session poolers (e.g. Supabase :5432)
      // have a small max pool — many lambdas × N connections exhaust it quickly.
      const isServerless = Boolean(process.env.VERCEL);
      url.searchParams.set(
        "connection_limit",
        isServerless ? "1" : process.env.NODE_ENV === "development" ? "5" : "3",
      );
    }
    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", "20");
    }
    return url.toString();
  } catch {
    return raw;
  }
}

const datasourceUrl = resolveDatasourceUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(datasourceUrl ? { datasourceUrl } : {}),
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

globalForPrisma.prisma = prisma;
