import { NextRequest, NextResponse } from "next/server";
import { payment_method, Prisma } from "@prisma/client";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { prisma } from "@/lib/db/prisma";
import { requireSessionPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import {
  parseSalesListQuery,
  paymentMethodsMatchingQuery,
  salesListDateRange,
} from "@/lib/sales/list-query";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({
        sales: [],
        stats: { todayTotal: 0, weekTotal: 0, monthTotal: 0, totalSales: 0 },
      });
    }

    const pharmacyId = await requireSessionPharmacyId(user.id);
    const listQuery = parseSalesListQuery(new URL(request.url).searchParams);
    const { from, to } = salesListDateRange(listQuery);

    const where: Prisma.salesWhereInput = { pharmacy_id: pharmacyId };
    if (from || to) {
      where.created_at = {
        ...(from ? { gte: from } : {}),
        ...(to ? { lte: to } : {}),
      };
    }

    if (listQuery.q) {
      const methods = paymentMethodsMatchingQuery(listQuery.q);
      where.OR = [
        {
          customer_name: {
            contains: listQuery.q,
            mode: "insensitive",
          },
        },
        ...(methods.length > 0
          ? [
              {
                payment_method: {
                  in: methods as payment_method[],
                },
              },
            ]
          : []),
      ];
    }

    const sales = await prisma.sales.findMany({
      where,
      orderBy: { created_at: "desc" },
      take: listQuery.limit,
    });

    const saleIds = sales.map((sale) => sale.id);
    const itemCountRows =
      saleIds.length > 0
        ? await prisma.sale_items.groupBy({
            by: ["sale_id"],
            where: { sale_id: { in: saleIds } },
            _count: { _all: true },
          })
        : [];
    const itemCountBySaleId = new Map(
      itemCountRows.map((row) => [row.sale_id, row._count._all]),
    );

    const formattedSales = sales.map((sale) => ({
      id: sale.id,
      customer: sale.customer_name || "Walk-in Customer",
      amount: sale.total_amount,
      items: itemCountBySaleId.get(sale.id) ?? 0,
      date: sale.created_at?.toISOString().split("T")[0] ?? "",
      paymentMethod: sale.payment_method,
      status: sale.status,
    }));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [todaySales, weekSales, monthSales] = await Promise.all([
      prisma.sales.findMany({
        where: { pharmacy_id: pharmacyId, created_at: { gte: today } },
        select: { total_amount: true },
      }),
      prisma.sales.findMany({
        where: { pharmacy_id: pharmacyId, created_at: { gte: weekAgo } },
        select: { total_amount: true },
      }),
      prisma.sales.findMany({
        where: { pharmacy_id: pharmacyId, created_at: { gte: monthAgo } },
        select: { total_amount: true },
      }),
    ]);

    const sum = (rows: { total_amount: unknown }[]) =>
      rows.reduce((acc, sale) => acc + Number(sale.total_amount ?? 0), 0);

    const stats = {
      todayTotal: sum(todaySales),
      weekTotal: sum(weekSales),
      monthTotal: sum(monthSales),
      totalSales: formattedSales.length,
    };

    return NextResponse.json({ sales: formattedSales, stats });
  } catch (error) {
    console.error("GET /api/sales", error);
    return NextResponse.json({
      sales: [],
      stats: { todayTotal: 0, weekTotal: 0, monthTotal: 0, totalSales: 0 },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireSessionPharmacyId(user.id);
    const body = await request.json();
    const { sale, items } = body;

    const newSale = await prisma.sales.create({
      data: {
        pharmacy_id: pharmacyId,
        customer_name: sale.customer_name || "Walk-in Customer",
        subtotal: sale.subtotal,
        insurance_amount: sale.insurance_amount || 0,
        customer_amount: sale.customer_amount,
        total_amount: sale.total_amount,
        payment_method: sale.payment_method,
        status: sale.status,
        receipt_number: `RCP-${Date.now()}`,
      },
    });

    if (items && items.length > 0) {
      await prisma.sale_items.createMany({
        data: items.map((item: {
          inventory_id: string;
          medication_name: string;
          quantity: number;
          unit_price: number;
          total_price: number;
        }) => ({
          sale_id: newSale.id,
          inventory_id: item.inventory_id,
          medication_name: item.medication_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
        })),
      });

      for (const item of items) {
        const inv = await prisma.inventory.findUnique({
          where: { id: item.inventory_id },
          select: { quantity_in_stock: true },
        });
        if (inv) {
          await prisma.inventory.update({
            where: { id: item.inventory_id },
            data: {
              quantity_in_stock: Number(inv.quantity_in_stock) - item.quantity,
            },
          });
        }
      }
    }

    return NextResponse.json({ success: true, sale: newSale });
  } catch (error) {
    console.error("Sale error:", error);
    return NextResponse.json({ success: false, error: "Failed to process sale" });
  }
}
