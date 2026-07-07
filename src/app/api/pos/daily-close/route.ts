import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import { requireUserBranchId } from "@/lib/pharmacy/get-session-branch";
import { guardPharmacyFeatureForUser } from "@/lib/subscription/api-guard";
import { fetchDailyCloseSalesFromDb } from "@/lib/db/reports";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireUserPharmacyId(user.id);
    const branchId = await requireUserBranchId(user.id);

    await guardPharmacyFeatureForUser(user.id, {
      feature: "pos.access",
      branchId,
    });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const rows = await fetchDailyCloseSalesFromDb(
      pharmacyId,
      branchId,
      startOfDay,
      endOfDay,
    );

    let cashAmount = 0;
    let cardAmount = 0;
    let mobileMoneyAmount = 0;
    let insuranceAmount = 0;
    let mixedAmount = 0;
    let totalSales = 0;

    for (const sale of rows) {
      const amount = sale.total_amount;
      totalSales += amount;
      switch (sale.payment_method) {
        case "cash":
          cashAmount += amount;
          break;
        case "card":
          cardAmount += amount;
          break;
        case "mobile_money":
          mobileMoneyAmount += amount;
          break;
        case "insurance":
          insuranceAmount += amount;
          break;
        case "mixed":
          mixedAmount += amount;
          break;
        default:
          cashAmount += amount;
      }
    }

    const dailyClose = {
      id: `${branchId}-${startOfDay.toISOString().slice(0, 10)}`,
      date: startOfDay.toISOString().slice(0, 10),
      branchId,
      totalSales,
      totalTransactions: rows.length,
      cashAmount,
      cardAmount,
      mobileMoneyAmount,
      insuranceAmount,
      mixedAmount,
      closedBy: user.id,
      closedAt: new Date().toISOString(),
    };

    await prisma.daily_closes.upsert({
      where: {
        branch_id_close_date: {
          branch_id: branchId,
          close_date: startOfDay,
        },
      },
      update: {
        total_sales: totalSales,
        total_transactions: rows.length,
        cash_amount: cashAmount,
        card_amount: cardAmount,
        mobile_money_amount: mobileMoneyAmount,
        insurance_amount: insuranceAmount,
        mixed_amount: mixedAmount,
        closed_by: user.id,
        closed_at: new Date(),
      },
      create: {
        pharmacy_id: pharmacyId,
        branch_id: branchId,
        close_date: startOfDay,
        total_sales: totalSales,
        total_transactions: rows.length,
        cash_amount: cashAmount,
        card_amount: cardAmount,
        mobile_money_amount: mobileMoneyAmount,
        insurance_amount: insuranceAmount,
        mixed_amount: mixedAmount,
        closed_by: user.id,
      },
    });

    return NextResponse.json({ success: true, dailyClose });
  } catch (error) {
    console.error("Daily close error:", error);
    return NextResponse.json({ error: "Failed to close day" }, { status: 500 });
  }
}
