import { NextResponse } from "next/server";
import { requirePlatformAdminApi } from "@/lib/admin/require-platform-admin";
import { recordSubscriptionPayment } from "@/lib/billing/record-subscription-payment";
import { prisma } from "@/lib/db/prisma";

/** Create invoices + payment rows for completed transactions missing billing records. */
export async function POST() {
  try {
    const auth = await requirePlatformAdminApi();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const completed = await prisma.payment_transactions.findMany({
      where: { status: "completed" },
      orderBy: { created_at: "desc" },
      take: 100,
      select: { id: true },
    });

    let synced = 0;
    let skipped = 0;

    for (const row of completed) {
      const result = await recordSubscriptionPayment(row.id);
      if (result.recorded) synced++;
      else skipped++;
    }

    return NextResponse.json({ success: true, synced, skipped });
  } catch (error) {
    console.error("POST /api/admin/transactions/backfill", error);
    return NextResponse.json({ error: "Backfill failed" }, { status: 500 });
  }
}
