import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { prisma } from "@/lib/db/prisma";
import { requireSessionPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireSessionPharmacyId(user.id);
    const loyalty = await prisma.customer_loyalty.findMany({
      where: { pharmacy_id: pharmacyId },
      include: { customers: { select: { name: true } } },
      orderBy: { points: "desc" },
    });

    const formattedLoyalty = loyalty.map((l) => ({
      id: l.id,
      customerId: l.customer_id,
      name: l.customers?.name || "Unknown",
      points: l.points,
      tier: l.tier,
      totalSpent: l.total_spent,
    }));

    return NextResponse.json(formattedLoyalty);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch loyalty data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireSessionPharmacyId(user.id);
    const { customerId, points, action } = await request.json();

    const loyalty = await prisma.customer_loyalty.findFirst({
      where: { customer_id: customerId },
    });

    if (!loyalty) {
      return NextResponse.json({ error: "Loyalty record not found" }, { status: 404 });
    }

    const newPoints = loyalty.points + (action === "add" ? points : -points);
    const newTier =
      newPoints >= 500 ? "Gold" : newPoints >= 200 ? "Silver" : "Bronze";

    const updated = await prisma.customer_loyalty.update({
      where: { id: loyalty.id },
      data: { points: newPoints, tier: newTier },
    });

    return NextResponse.json({ success: true, customer: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update loyalty points" }, { status: 500 });
  }
}
