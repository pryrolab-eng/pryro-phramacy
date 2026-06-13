import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import { storeFindMembershipAtPharmacy } from "@/lib/db/pharmacy-users-store";
import {
  createPendingPharmacyInvoiceFromDb,
  updatePharmacyLegacyPlanFromDb,
} from "@/lib/db/billing";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireUserPharmacyId(user.id);
    const sales = await prisma.sales.findMany({
      where: { pharmacy_id: pharmacyId },
      select: {
        id: true,
        total_amount: true,
        payment_method: true,
        status: true,
        created_at: true,
      },
      orderBy: { created_at: "desc" },
      take: 50,
    });

    const payments = sales.map((s) => ({
      id: s.id,
      amount: Number(s.total_amount ?? 0),
      method: s.payment_method,
      status: s.status === "completed" ? "completed" : "pending",
      date: s.created_at?.toISOString() ?? null,
    }));

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Payments fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 },
    );
  }
}

/**
 * Legacy plan checkout — prefer POST /api/subscriptions/upgrade and /api/kpay/initiate.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { plan, useKPay = false } = body;

    const pharmacyId = await requireUserPharmacyId(user.id);
    const membership = await storeFindMembershipAtPharmacy(user.id, pharmacyId);

    if (!["pharmacy_owner", "admin"].includes(membership?.role ?? "")) {
      return NextResponse.json(
        { error: "Only pharmacy owners can manage subscriptions" },
        { status: 403 },
      );
    }

    if (useKPay) {
      return NextResponse.json(
        {
          error:
            "Use POST /api/subscriptions/upgrade then /api/kpay/initiate for paid checkout.",
          deprecated: true,
        },
        { status: 410 },
      );
    }

    const planPrices: Record<string, number> = {
      trial: 0,
      standard: 50000,
      premium: 120000,
    };

    const planMap: Record<string, string> = {
      free: "trial",
      standard: "standard",
      premium: "premium",
    };

    const dbPlan = planMap[String(plan ?? "").toLowerCase()] || "trial";
    const amount = planPrices[dbPlan] ?? 0;
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await updatePharmacyLegacyPlanFromDb({
      pharmacyId,
      subscriptionPlan: dbPlan,
      expiresAt,
    });

    await createPendingPharmacyInvoiceFromDb({
      pharmacyId,
      amount,
      status: amount === 0 ? "paid" : "pending",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      planName: String(plan ?? dbPlan),
    });

    return NextResponse.json({ success: true, plan: dbPlan });
  } catch (error) {
    console.error("Payment error:", error);
    return NextResponse.json({ error: "Payment failed" }, { status: 500 });
  }
}
