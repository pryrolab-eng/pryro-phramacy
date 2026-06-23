import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { buildAccountingSummary } from "@/lib/db/accounting";
import { requireSessionPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";

function monthStart(offset: number): Date {
  const date = new Date();
  date.setUTCDate(1);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCMonth(date.getUTCMonth() + offset);
  return date;
}

function monthLabel(date: Date): string {
  return date.toLocaleString("en", { month: "short" });
}

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireSessionPharmacyId(user.id);
    const start = monthStart(-2);
    const nextMonth = monthStart(1);
    const summary = await buildAccountingSummary({
      pharmacyId,
      range: { from: start, to: nextMonth },
    });

    const monthlyBreakdown = await Promise.all(
      [-2, -1, 0].map(async (offset) => {
        const from = monthStart(offset);
        const to = monthStart(offset + 1);
        const month = await buildAccountingSummary({
          pharmacyId,
          range: { from, to },
        });
        return {
          month: monthLabel(from),
          revenue: month.revenue,
          expenses: month.expenses,
          profit: month.profit,
          expenseSource:
            month.expenses > 0 ? "purchase_orders_and_salary_estimate" : "live_or_unavailable",
        };
      }),
    );

    return NextResponse.json({
      revenue: summary.revenue,
      expenses: summary.expenses,
      profit: summary.profit,
      profitMargin: summary.profitMargin,
      monthlyBreakdown,
      expenseCategories: summary.categoryBreakdown,
      sources: summary.sources,
      paymentSummary: summary.paymentSummary,
      cashFlow: summary.cashFlow,
    });
  } catch (error) {
    console.error("GET /api/accounting", error);
    return NextResponse.json(
      { error: "Failed to fetch accounting data" },
      { status: 500 },
    );
  }
}
