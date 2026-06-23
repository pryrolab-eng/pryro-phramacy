import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { listAuditLogsForPharmacyFromDb } from "@/lib/db/audit-logs";
import { prisma } from "@/lib/db/prisma";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import { getEnableAuditLogs } from "@/lib/platform-settings";
import {
  entitlementRouteResponse,
  guardReportsAccessForUser,
} from "@/lib/subscription/route-guards";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await getEnableAuditLogs())) {
      return NextResponse.json(
        {
          error: "audit_logs_disabled",
          message: "Platform audit logging is disabled in Admin → Settings.",
        },
        { status: 403 },
      );
    }

    try {
      await guardReportsAccessForUser(user.id);
    } catch (entErr) {
      const res = entitlementRouteResponse(entErr);
      if (res) return res;
      throw entErr;
    }

    const pharmacyId = await requireUserPharmacyId(user.id);
    const rows = await listAuditLogsForPharmacyFromDb(pharmacyId, 50, 0);

    const userIds = Array.from(
      new Set(rows.map((r) => r.user_id).filter((id): id is string => Boolean(id))),
    );
    const profiles =
      userIds.length > 0
        ? await prisma.public_users.findMany({
            where: { id: { in: userIds } },
            select: { id: true, email: true, name: true },
          })
        : [];
    const profileById = new Map(profiles.map((p) => [p.id, p]));

    const auditLogs = rows.map((row) => {
      const profile = row.user_id ? profileById.get(row.user_id) : null;
      return {
        id: row.id,
        user: profile?.email ?? profile?.name ?? row.user_id ?? "system",
        action: row.action,
        details: [row.table_name, row.record_id].filter(Boolean).join(" · ") || row.action,
        timestamp: row.created_at?.toISOString() ?? null,
      };
    });

    return NextResponse.json(auditLogs);
  } catch (error) {
    console.error("GET /api/reports/audit", error);
    return NextResponse.json(
      { error: "Failed to fetch audit log" },
      { status: 500 },
    );
  }
}
