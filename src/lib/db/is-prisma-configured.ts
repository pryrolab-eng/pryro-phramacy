/** True when Prisma can connect (DATABASE_URL set). */
export function isPrismaConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}
