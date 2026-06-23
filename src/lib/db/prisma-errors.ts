/** True when Prisma cannot reach the database (pooler down, network, wrong URL). */
export function isPrismaUnreachableError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { name?: string; code?: string };
  return (
    e.name === "PrismaClientInitializationError" ||
    e.code === "P1001" ||
    e.code === "P1017"
  );
}
