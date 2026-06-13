import { NextResponse } from "next/server";

import { getAuthUser } from "@/lib/auth/get-auth-user";

import { prisma } from "@/lib/db/prisma";

import { resolveActivePharmacyContext } from "@/lib/pharmacy/active-pharmacy";

import {

  hasPermission,

  loadRolePermissions,

  PHARMACY_PERMISSIONS,

} from "@/lib/rbac/permissions";



export const dynamic = "force-dynamic";



/** Role-aware summary metrics for /pharmacy/staff-dashboard. */

export async function GET() {

  try {

    const user = await getAuthUser();



    if (!user) {

      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    }



    const ctx = await resolveActivePharmacyContext(user.id);

    if (!ctx.activePharmacyId) {

      return NextResponse.json({ error: "No active pharmacy" }, { status: 404 });

    }



    const permissions = await loadRolePermissions(ctx.role);

    const pharmacyId = ctx.activePharmacyId;

    const todayStart = new Date();

    todayStart.setHours(0, 0, 0, 0);



    const metrics: Array<{

      key: string;

      label: string;

      value: number | string;

      hint?: string;

    }> = [];



    if (hasPermission(permissions, PHARMACY_PERMISSIONS.prescriptionsAccess)) {

      const [pending, todayRx] = await Promise.all([

        prisma.prescriptions.count({

          where: { pharmacy_id: pharmacyId, status: "pending" },

        }),

        prisma.prescriptions.count({

          where: {

            pharmacy_id: pharmacyId,

            created_at: { gte: todayStart },

          },

        }),

      ]);



      metrics.push(

        {

          key: "pending_prescriptions",

          label: "Pending prescriptions",

          value: pending,

          hint: "Awaiting processing",

        },

        {

          key: "prescriptions_today",

          label: "Prescriptions today",

          value: todayRx,

        },

      );

    }



    if (hasPermission(permissions, PHARMACY_PERMISSIONS.salesView)) {

      const todaySales = await prisma.sales.findMany({

        where: {

          pharmacy_id: pharmacyId,

          created_at: { gte: todayStart },

        },

        select: { total_amount: true },

      });



      const todayTotal = todaySales.reduce(

        (sum, row) => sum + Number(row.total_amount ?? 0),

        0,

      );



      metrics.push(

        {

          key: "sales_today_total",

          label: "Sales today",

          value: Math.round(todayTotal),

          hint: "RWF",

        },

        {

          key: "sales_today_count",

          label: "Transactions today",

          value: todaySales.length,

        },

      );

    }



    if (hasPermission(permissions, PHARMACY_PERMISSIONS.posAccess)) {

      metrics.push({

        key: "pos_ready",

        label: "Point of sale",

        value: "Ready",

        hint: "Open POS to serve customers",

      });

    }



    return NextResponse.json({

      role: ctx.role,

      metrics,

    });

  } catch (error) {

    console.error("GET /api/me/staff-dashboard", error);

    return NextResponse.json(

      { error: "Failed to load dashboard summary" },

      { status: 500 },

    );

  }

}

