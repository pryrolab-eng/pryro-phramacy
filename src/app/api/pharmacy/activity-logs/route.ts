import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import {
  entitlementRouteResponse,
  guardReportsAccessForUser,
} from "@/lib/subscription/route-guards";
import {
  countAuditLogsForPharmacyFromDb,
  getAuditLogStatsForPharmacyFromDb,
  listAuditLogFacetsForPharmacyFromDb,
  listAuditLogsForPharmacyFromDb,
  type AuditLogListFilters,
} from "@/lib/db/audit-logs";
import { findPublicUserByIdFromDb } from "@/lib/db/public-users";
import { formatAuditSummary } from "@/lib/audit/format-activity-log";
import { getEnableAuditLogs } from "@/lib/platform-settings";

function parseFilters(url: URL): AuditLogListFilters {
  return {
    action: url.searchParams.get("action") ?? undefined,
    table: url.searchParams.get("table") ?? undefined,
    userId: url.searchParams.get("userId") ?? undefined,
    search: url.searchParams.get("q") ?? undefined,
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
  };
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
        { items: [], total: 0, error: "audit_logs_disabled" },
        { status: 403 },
      );
    }

    const url = new URL(request.url);
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") ?? "25", 10),
      100,
    );
    const offset = Math.max(parseInt(url.searchParams.get("offset") ?? "0", 10), 0);
    const filters = parseFilters(url);
    const includeFacets = url.searchParams.get("facets") === "1";

    const [logs, total, stats, facets] = await Promise.all([
      listAuditLogsForPharmacyFromDb(pharmacyId, limit, offset, filters),
      countAuditLogsForPharmacyFromDb(pharmacyId, filters),
      getAuditLogStatsForPharmacyFromDb(pharmacyId, filters),
      includeFacets
        ? listAuditLogFacetsForPharmacyFromDb(pharmacyId)
        : Promise.resolve(null),
    ]);

    const userIds = Array.from(
      new Set([
        ...logs.map((l) => l.user_id).filter(Boolean),
        ...(facets?.userIds ?? []),
      ]),
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

    const facetUsers = facets
      ? [
          { id: "system", label: "System" },
          ...facets.userIds.map((id) => ({
            id,
            label: userLabels[id] ?? "User",
          })),
        ]
      : undefined;

    return NextResponse.json({
      items,
      total,
      limit,
      offset,
      stats: {
        total: stats.total,
        inserts: stats.byAction.INSERT ?? 0,
        updates: stats.byAction.UPDATE ?? 0,
        deletes: stats.byAction.DELETE ?? 0,
      },
      facets: facets
        ? {
            tables: facets.tables,
            actions: facets.actions,
            users: facetUsers,
          }
        : undefined,
    });
  } catch (error) {
    console.error("GET /api/pharmacy/activity-logs", error);
    return NextResponse.json(
      { items: [], total: 0, error: "Failed to load activity" },
      { status: 500 },
    );
  }
}
