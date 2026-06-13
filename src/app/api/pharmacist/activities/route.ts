import { NextResponse } from "next/server";
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
    const sales = await prisma.sales.findMany({
      where: { pharmacy_id: pharmacyId },
      select: { id: true, customer_name: true, total_amount: true, created_at: true },
      orderBy: { created_at: "desc" },
      take: 4,
    });

    const activities = sales.map((sale) => ({
      id: sale.id,
      type: "sale",
      description: `Sale to ${sale.customer_name || "Walk-in Customer"} - ${sale.total_amount} RWF`,
      time: sale.created_at ? new Date(sale.created_at).toLocaleTimeString() : "",
      status: "completed",
    }));

    return NextResponse.json(activities);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
  }
}
