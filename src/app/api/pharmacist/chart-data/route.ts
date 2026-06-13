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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [sales, prescriptions] = await Promise.all([
      prisma.sales.findMany({
        where: {
          pharmacy_id: pharmacyId,
          created_at: { gte: today, lt: tomorrow },
        },
        select: { created_at: true },
      }),
      prisma.prescriptions.findMany({
        where: {
          pharmacy_id: pharmacyId,
          created_at: { gte: today, lt: tomorrow },
        },
        select: { created_at: true },
      }),
    ]);

    const chartData = [];
    for (let hour = 9; hour <= 17; hour++) {
      const hourStr = `${hour}:00`;
      const salesCount = sales.filter(
        (s) => s.created_at && new Date(s.created_at).getHours() === hour,
      ).length;
      const prescCount = prescriptions.filter(
        (p) => p.created_at && new Date(p.created_at).getHours() === hour,
      ).length;

      chartData.push({
        time: hourStr,
        prescriptions: prescCount,
        customers: salesCount,
      });
    }

    return NextResponse.json(chartData);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch chart data" }, { status: 500 });
  }
}
