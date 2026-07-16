import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaUrl: string | undefined;
};

function resolveDatasourceUrl(): string | undefined {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) return undefined;

  try {
    const url = new URL(raw);
    if (!url.searchParams.has("connection_limit")) {
      const isServerless = Boolean(process.env.VERCEL);
      url.searchParams.set(
        "connection_limit",
        isServerless ? "1" : process.env.NODE_ENV === "development" ? "10" : "10",
      );
    }
    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", "20");
    }
    if (!url.searchParams.has("pgbouncer")) {
      url.searchParams.set("pgbouncer", "true");
    }
    return url.toString();
  } catch {
    return raw;
  }
}

function createPrisma(): PrismaClient {
  const datasourceUrl = resolveDatasourceUrl();
  // Store so we can detect stale caches if DATABASE_URL changes
  globalForPrisma.prismaUrl = datasourceUrl;

  return new PrismaClient({
    ...(datasourceUrl ? { datasourceUrl } : {}),
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });
}

// If the URL changed (e.g. .env re-loaded after restart) disconnect stale pool
const currentUrl = resolveDatasourceUrl();
if (globalForPrisma.prisma && globalForPrisma.prismaUrl !== currentUrl) {
  globalForPrisma.prisma.$disconnect();
  globalForPrisma.prisma = undefined;
}

export const prisma = globalForPrisma.prisma ?? createPrisma();
globalForPrisma.prisma = prisma;
