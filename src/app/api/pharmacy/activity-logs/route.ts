import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import {
  entitlementRouteResponse,
  guardReportsAccessForUser,
} from "@/lib/subscription/route-guards";
import { listAuditLogsForPharmacyFromDb } from "@/lib/db/audit-logs";
import { findPublicUserByIdFromDb } from "@/lib/db/public-users";
import { getEnableAuditLogs } from "@/lib/platform-settings";

function formatAuditSummary(
  action: string,
  tableName: string | null,
  newValues: unknown,
  oldValues: unknown,
): string {
  const table = tableName ?? "record";
  if (action === "INSERT") return `Created ${table}`;
  if (action === "DELETE") return `Deleted ${table}`;
  if (action === "UPDATE") {
    const nv = newValues as Record<string, unknown> | null;
    const name = nv?.name ?? nv?.customer_name ?? nv?.receipt_number;
    if (name) return `Updated ${table}: ${String(name)}`;
    return `Updated ${table}`;
  }
  if (oldValues || newValues) return `${action} on ${table}`;
  return `${action} ${table}`;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      await guardReportsAccessForUser(user.id);
    } catch (entErr) {
      const res = entitlementRouteResponse(entErr);
      if (res) return res;
      throw entErr;
    }

    const pharmacyId = await requireUserPharmacyId(user.id);
    if (!(await getEnableAuditLogs())) {
      return NextResponse.json(
        { items: [], error: "audit_logs_disabled" },
        { status: 403 },
      );
    }

    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10), 200);
    const offset = Math.max(parseInt(url.searchParams.get("offset") ?? "0", 10), 0);

    const logs = await listAuditLogsForPharmacyFromDb(pharmacyId, limit, offset);

    const userIds = Array.from(
      new Set(logs.map((l) => l.user_id).filter(Boolean)),
    ) as string[];

    const userLabels: Record<string, string> = {};
    await Promise.all(
      userIds.map(async (uid) => {
        const profile = await findPublicUserByIdFromDb(uid);
        if (profile) {
          userLabels[uid] =
            profile.full_name ||
            profile.name ||
            profile.email?.split("@")[0] ||
            "User";
        }
      }),
    );

    const items = logs.map((log) => ({
      id: log.id,
      action: log.action,
      tableName: log.table_name,
      recordId: log.record_id,
      userId: log.user_id,
      userLabel: log.user_id ? (userLabels[log.user_id] ?? "User") : "System",
      createdAt: log.created_at?.toISOString() ?? null,
      summary: formatAuditSummary(
        log.action,
        log.table_name,
        log.new_values,
        log.old_values,
      ),
    }));

    return NextResponse.json({ items, limit, offset });
  } catch (error) {
    console.error("GET /api/pharmacy/activity-logs", error);
    return NextResponse.json(
      { items: [], error: "Failed to load activity" },
      { status: 500 },
    );
  }
}
