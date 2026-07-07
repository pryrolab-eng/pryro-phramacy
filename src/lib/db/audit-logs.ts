import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";

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

export type AuditLogListFilters = {
  action?: string;
  table?: string;
  userId?: string;
  search?: string;
  from?: string;
  to?: string;
};

function buildAuditLogWhere(
  pharmacyId: string,
  filters: AuditLogListFilters,
): Prisma.audit_logsWhereInput {
  const where: Prisma.audit_logsWhereInput = { pharmacy_id: pharmacyId };

  if (filters.action && filters.action !== "all") {
    where.action = filters.action;
  }

  if (filters.table && filters.table !== "all") {
    where.table_name = filters.table;
  }

  if (filters.userId && filters.userId !== "all") {
    if (filters.userId === "system") {
      where.user_id = null;
    } else {
      where.user_id = filters.userId;
    }
  }

  if (filters.from || filters.to) {
    where.created_at = {};
    if (filters.from) {
      const from = new Date(filters.from);
      if (!Number.isNaN(from.getTime())) {
        where.created_at.gte = from;
      }
    }
    if (filters.to) {
      const to = new Date(filters.to);
      if (!Number.isNaN(to.getTime())) {
        to.setHours(23, 59, 59, 999);
        where.created_at.lte = to;
      }
    }
  }

  const q = filters.search?.trim();
  if (q) {
    const or: Prisma.audit_logsWhereInput[] = [
      { table_name: { contains: q, mode: "insensitive" } },
      { action: { contains: q, mode: "insensitive" } },
    ];
    const uuidLike =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(q);
    if (uuidLike) {
      or.push({ record_id: q });
    }
    where.OR = or;
  }

  return where;
}

export async function listAuditLogsForPharmacyFromDb(
  pharmacyId: string,
  limit: number,
  offset: number,
  filters: AuditLogListFilters = {},
): Promise<AuditLogRow[]> {
  return prisma.audit_logs.findMany({
    where: buildAuditLogWhere(pharmacyId, filters),
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

export async function countAuditLogsForPharmacyFromDb(
  pharmacyId: string,
  filters: AuditLogListFilters = {},
): Promise<number> {
  return prisma.audit_logs.count({
    where: buildAuditLogWhere(pharmacyId, filters),
  });
}

export async function getAuditLogStatsForPharmacyFromDb(
  pharmacyId: string,
  filters: AuditLogListFilters = {},
): Promise<{ total: number; byAction: Record<string, number> }> {
  const where = buildAuditLogWhere(pharmacyId, filters);
  const [total, groups] = await Promise.all([
    prisma.audit_logs.count({ where }),
    prisma.audit_logs.groupBy({
      by: ["action"],
      where,
      _count: { _all: true },
    }),
  ]);

  const byAction: Record<string, number> = {};
  for (const row of groups) {
    byAction[row.action] = row._count._all;
  }

  return { total, byAction };
}

export async function listAuditLogFacetsForPharmacyFromDb(pharmacyId: string): Promise<{
  tables: string[];
  actions: string[];
  userIds: string[];
}> {
  const baseWhere = { pharmacy_id: pharmacyId };

  const [tables, actions, users] = await Promise.all([
    prisma.audit_logs.findMany({
      where: { ...baseWhere, table_name: { not: null } },
      distinct: ["table_name"],
      select: { table_name: true },
      orderBy: { table_name: "asc" },
    }),
    prisma.audit_logs.findMany({
      where: baseWhere,
      distinct: ["action"],
      select: { action: true },
      orderBy: { action: "asc" },
    }),
    prisma.audit_logs.findMany({
      where: { ...baseWhere, user_id: { not: null } },
      distinct: ["user_id"],
      select: { user_id: true },
    }),
  ]);

  return {
    tables: tables
      .map((r) => r.table_name)
      .filter((t): t is string => Boolean(t)),
    actions: actions.map((r) => r.action),
    userIds: users
      .map((r) => r.user_id)
      .filter((id): id is string => Boolean(id)),
  };
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
