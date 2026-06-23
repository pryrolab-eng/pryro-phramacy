import { prisma } from "@/lib/db/prisma";

export type AuditLogRow = {
  id: string;
  action: string;
  table_name: string | null;
  record_id: string | null;
  old_values: unknown;
  new_values: unknown;
  user_id: string | null;
  created_at: Date | null;
};

export async function listAuditLogsForPharmacyFromDb(
  pharmacyId: string,
  limit: number,
  offset: number,
): Promise<AuditLogRow[]> {
  return prisma.audit_logs.findMany({
    where: { pharmacy_id: pharmacyId },
    orderBy: { created_at: "desc" },
    skip: offset,
    take: limit,
    select: {
      id: true,
      action: true,
      table_name: true,
      record_id: true,
      old_values: true,
      new_values: true,
      user_id: true,
      created_at: true,
    },
  });
}

export async function writeAuditLog(input: {
  pharmacyId: string | null;
  userId: string | null;
  action: string;
  tableName?: string;
  recordId?: string;
  oldValues?: unknown;
  newValues?: unknown;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  const { getEnableAuditLogs } = await import("@/lib/platform-settings");
  if (!(await getEnableAuditLogs())) return;

  try {
    const ipAddress = input.ipAddress?.trim() || null;
    await prisma.audit_logs.create({
      data: {
        pharmacy_id: input.pharmacyId,
        user_id: input.userId,
        action: input.action,
        table_name: input.tableName ?? null,
        record_id: input.recordId ?? null,
        old_values:
          input.oldValues !== undefined ? (input.oldValues as any) : null,
        new_values:
          input.newValues !== undefined ? (input.newValues as any) : null,
        ip_address: ipAddress,
        user_agent: input.userAgent ?? null,
      },
    });
  } catch (error) {
    console.error("writeAuditLog error:", error);
  }
}

export function auditRequestMetadata(request: {
  headers: Pick<Headers, "get">;
}): { ipAddress?: string; userAgent?: string } {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ipAddress =
    forwardedFor?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    undefined;

  return {
    ipAddress,
    userAgent: request.headers.get("user-agent") ?? undefined,
  };
}
