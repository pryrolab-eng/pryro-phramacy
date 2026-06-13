import type { AdminReportsSummary, ExportableReport } from "@/lib/http/admin/reports";
import { prisma } from "@/lib/db/prisma";
import { storeCountPublicUsers } from "@/lib/db/public-users-store";
import {
  localUploadFileUrl,
  UPLOAD_CATEGORIES,
} from "@/lib/storage/local-files";

/** Platform admin dashboard metrics (payments, MRR estimate, exportable reports). */
export async function buildAdminReportsSummary(): Promise<AdminReportsSummary> {
  const [payments, completedTx, pendingTx] = await Promise.all([
    prisma.payments.findMany({
      where: { status: "completed" },
      select: {
        amount: true,
        created_at: true,
        pharmacy_id: true,
        payment_reference: true,
      },
    }),
    prisma.payment_transactions.findMany({
      where: { status: "completed" },
      select: {
        id: true,
        amount: true,
        created_at: true,
        completed_at: true,
        pharmacy_id: true,
      },
    }),
    prisma.payment_transactions.findMany({
      where: { status: { in: ["pending", "processing"] } },
      select: { id: true },
    }),
  ]);

  const linkedTxIds = new Set(
    payments
      .map((p) => p.payment_reference)
      .filter((ref): ref is string => Boolean(ref)),
  );

  type RevenueRow = {
    amount: number;
    created_at: string;
    pharmacy_id: string | null;
  };

  const revenueRows: RevenueRow[] = [];

  payments.forEach((row) => {
    if (!row.created_at) return;
    revenueRows.push({
      amount: Number(row.amount ?? 0),
      created_at: row.created_at.toISOString(),
      pharmacy_id: row.pharmacy_id,
    });
  });

  completedTx.forEach((row) => {
    if (linkedTxIds.has(row.id)) return;
    const at = row.completed_at ?? row.created_at;
    if (!at) return;
    revenueRows.push({
      amount: Number(row.amount ?? 0),
      created_at: at.toISOString(),
      pharmacy_id: row.pharmacy_id,
    });
  });

  const totalRevenue = revenueRows.reduce((sum, r) => sum + r.amount, 0);

  const activePharmacyCount = await prisma.pharmacies.count({
    where: { status: { in: ["active", "trial"] } },
  });

  const userCount = await storeCountPublicUsers();

  const monthlyData = new Map<
    string,
    { revenue: number; pharmacies: Set<string> }
  >();

  revenueRows.forEach((row) => {
    const d = new Date(row.created_at);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyData.has(ym)) {
      monthlyData.set(ym, { revenue: 0, pharmacies: new Set() });
    }
    const agg = monthlyData.get(ym)!;
    agg.revenue += row.amount;
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

  const [subscriptions, planRows, reportRows] = await Promise.all([
    prisma.subscriptions.findMany({
      where: { is_active: true },
      select: { plan: true, pharmacy_id: true },
    }),
    prisma.subscription_plans.findMany({
      select: { name: true, price: true },
    }),
    prisma.platform_admin_reports.findMany({
      orderBy: { generated_at: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        generated_at: true,
        storage_bucket: true,
        storage_object_path: true,
      },
    }),
  ]);

  const planData: Record<string, { count: number; revenue: number }> = {};

  subscriptions.forEach((s) => {
    const key = String(s.plan ?? "unknown");
    if (!planData[key]) {
      planData[key] = { count: 0, revenue: 0 };
    }
    planData[key].count++;
  });

  const planBreakdown = Object.entries(planData).map(([plan_name, data]) => {
    const plan = planRows.find(
      (p) => p.name.toLowerCase() === plan_name.toLowerCase(),
    );
    const price = Number(plan?.price ?? 0);
    return {
      plan_name,
      subscribers: data.count,
      revenue: data.count * price,
    };
  });

  const exportableReports: ExportableReport[] = reportRows.map((row) => {
    const downloadUrl =
      row.storage_bucket === UPLOAD_CATEGORIES.platformReports &&
      row.storage_object_path
        ? localUploadFileUrl(
            UPLOAD_CATEGORIES.platformReports,
            row.storage_object_path,
          )
        : null;
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category,
      lastGenerated: new Date(row.generated_at).toLocaleString(),
      downloadUrl,
    };
  });

  const estimatedMrr = planBreakdown.reduce((sum, p) => sum + p.revenue, 0);

  return {
    totalRevenue,
    estimatedMrr,
    completedPaymentCount: revenueRows.length,
    pendingPaymentCount: pendingTx.length,
    activePharmacies: activePharmacyCount,
    totalUsers: userCount ?? 0,
    revenueData,
    planBreakdown,
    exportableReports,
  };
}
