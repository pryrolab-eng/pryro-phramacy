import { NextResponse } from "next/server";
import { createClient } from "../../../../../supabase/server";
import { createServiceClient } from "../../../../../supabase/service";
import { resolveActivePharmacyContext } from "@/lib/pharmacy/active-pharmacy";
import {
  hasPermission,
  loadRolePermissions,
  PHARMACY_PERMISSIONS,
} from "@/lib/rbac/permissions";

export const dynamic = "force-dynamic";

/** Role-aware summary metrics for /pharmacy/staff-dashboard. */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createServiceClient();
    const ctx = await resolveActivePharmacyContext(admin, user.id);
    if (!ctx.activePharmacyId) {
      return NextResponse.json({ error: "No active pharmacy" }, { status: 404 });
    }

    const permissions = await loadRolePermissions(admin, ctx.role);
    const pharmacyId = ctx.activePharmacyId;
    const today = new Date().toISOString().split("T")[0];

    const metrics: Array<{
      key: string;
      label: string;
      value: number | string;
      hint?: string;
    }> = [];

    if (hasPermission(permissions, PHARMACY_PERMISSIONS.prescriptionsAccess)) {
      const { count: pending } = await admin
        .from("prescriptions")
        .select("id", { count: "exact", head: true })
        .eq("pharmacy_id", pharmacyId)
        .eq("status", "pending");

      const { count: todayRx } = await admin
        .from("prescriptions")
        .select("id", { count: "exact", head: true })
        .eq("pharmacy_id", pharmacyId)
        .gte("created_at", `${today}T00:00:00`);

      metrics.push(
        {
          key: "pending_prescriptions",
          label: "Pending prescriptions",
          value: pending ?? 0,
          hint: "Awaiting processing",
        },
        {
          key: "prescriptions_today",
          label: "Prescriptions today",
          value: todayRx ?? 0,
        },
      );
    }

    if (hasPermission(permissions, PHARMACY_PERMISSIONS.salesView)) {
      const { data: todaySales } = await admin
        .from("sales")
        .select("total_amount")
        .eq("pharmacy_id", pharmacyId)
        .gte("created_at", `${today}T00:00:00`);

      const todayTotal =
        todaySales?.reduce(
          (sum, row) => sum + parseFloat(String(row.total_amount ?? 0)),
          0,
        ) ?? 0;
      const todayCount = todaySales?.length ?? 0;

      metrics.push(
        {
          key: "sales_today_total",
          label: "Sales today",
          value: Math.round(todayTotal),
          hint: "RWF",
        },
        {
          key: "sales_today_count",
          label: "Transactions today",
          value: todayCount,
        },
      );
    }

    if (hasPermission(permissions, PHARMACY_PERMISSIONS.posAccess)) {
      metrics.push({
        key: "pos_ready",
        label: "Point of sale",
        value: "Ready",
        hint: "Open POS to serve customers",
      });
    }

    return NextResponse.json({
      role: ctx.role,
      metrics,
    });
  } catch (error) {
    console.error("GET /api/me/staff-dashboard", error);
    return NextResponse.json(
      { error: "Failed to load dashboard summary" },
      { status: 500 },
    );
  }
}
