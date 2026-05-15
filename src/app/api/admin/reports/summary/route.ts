import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "../../../../../../supabase/server";
import { resolveIsAppPlatformAdmin } from "@/lib/platform-admin";
import type { AdminReportsSummary, ExportableReport } from "@/lib/http/admin/reports";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowed = await resolveIsAppPlatformAdmin(supabase, user.id, null);
    if (!allowed) {
      return NextResponse.json(
        { error: "Forbidden: platform admin access required" },
        { status: 403 },
      );
    }

    const db = createServiceClient();

    const { data: payments } = await db
      .from("payments")
      .select("amount, created_at, pharmacy_id")
      .eq("status", "completed");

    const totalRevenue =
      payments?.reduce((sum, p) => sum + Number((p as { amount?: unknown }).amount ?? 0), 0) ??
      0;

    const { count: activePharmacyCount } = await db
      .from("pharmacies")
      .select("*", { count: "exact", head: true })
      .in("status", ["active", "trial"]);

    const { count: userCount } = await db
      .from("users")
      .select("*", { count: "exact", head: true });

    /** Key `YYYY-MM` so months sort chronologically in the UI. */
    const monthlyData = new Map<
      string,
      { revenue: number; pharmacies: Set<string> }
    >();

    (payments ?? []).forEach((p) => {
      const row = p as {
        amount?: unknown;
        created_at?: string | null;
        pharmacy_id?: string | null;
      };
      if (!row.created_at) return;
      const d = new Date(row.created_at);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyData.has(ym)) {
        monthlyData.set(ym, { revenue: 0, pharmacies: new Set() });
      }
      const agg = monthlyData.get(ym)!;
      agg.revenue += Number(row.amount ?? 0);
      if (row.pharmacy_id) {
        agg.pharmacies.add(row.pharmacy_id);
      }
    });

    const revenueData = Array.from(monthlyData.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([ym, data]) => ({
        month: new Date(`${ym}-01`).toLocaleString("en-US", {
          month: "short",
          year: "numeric",
        }),
        revenue: data.revenue,
        pharmacies: data.pharmacies.size,
      }));

    const { data: subscriptions } = await db
      .from("subscriptions")
      .select("plan, pharmacy_id")
      .eq("is_active", true);

    const { data: planRows } = await db
      .from("subscription_plans")
      .select("name, price");

    const planData: Record<string, { count: number; revenue: number }> = {};

    (subscriptions ?? []).forEach((s) => {
      const row = s as { plan?: string | null };
      const key = String(row.plan ?? "unknown");
      if (!planData[key]) {
        planData[key] = { count: 0, revenue: 0 };
      }
      planData[key].count++;
    });

    const planBreakdown = Object.entries(planData).map(([plan_name, data]) => {
      const plan = planRows?.find(
        (p) =>
          String((p as { name?: string }).name).toLowerCase() ===
          plan_name.toLowerCase(),
      ) as { name?: string; price?: unknown } | undefined;
      const price = Number(plan?.price ?? 0);
      return {
        plan_name,
        subscribers: data.count,
        revenue: data.count * price,
      };
    });

    const { data: reportRows, error: reportsListError } = await db
      .from("platform_admin_reports")
      .select(
        "id, name, description, category, storage_bucket, storage_object_path, generated_at",
      )
      .order("generated_at", { ascending: false });

    const exportableReports: ExportableReport[] = [];
    const signTtlSec = 3600;

    if (reportsListError) {
      const missingTable =
        reportsListError.code === "PGRST205" ||
        (typeof reportsListError.message === "string" &&
          reportsListError.message.includes("platform_admin_reports"));
      if (missingTable) {
        console.warn(
          "[admin/reports/summary] platform_admin_reports not in DB yet — run Supabase migration 20250618100000_platform_admin_reports.sql (or `supabase db push`). exportableReports left empty.",
        );
      } else {
        console.error("platform_admin_reports list:", reportsListError);
      }
    } else {
      for (const row of reportRows ?? []) {
        const { data: signed, error: signError } = await db.storage
          .from(row.storage_bucket)
          .createSignedUrl(row.storage_object_path, signTtlSec);
        if (signError) {
          console.error("report signed URL", row.id, signError);
        }
        exportableReports.push({
          id: row.id,
          name: row.name,
          description: row.description,
          category: row.category,
          lastGenerated: new Date(row.generated_at).toLocaleString(),
          downloadUrl: signed?.signedUrl ?? null,
        });
      }
    }

    const payload: AdminReportsSummary = {
      totalRevenue,
      activePharmacies: activePharmacyCount ?? 0,
      totalUsers: userCount ?? 0,
      revenueData,
      planBreakdown,
      exportableReports,
    };

    return NextResponse.json(payload);
  } catch (e) {
    console.error("admin reports summary:", e);
    return NextResponse.json(
      { error: "Failed to load reports summary" },
      { status: 500 },
    );
  }
}
