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
