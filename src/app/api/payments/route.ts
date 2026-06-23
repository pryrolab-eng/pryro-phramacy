import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
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
 * Legacy plan checkout — prefer POST /api/subscriptions/upgrade and /api/polar/checkout.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: "deprecated_endpoint",
      message:
        "Use POST /api/subscriptions/upgrade followed by /api/polar/checkout.",
    },
    { status: 410 },
  );
}
