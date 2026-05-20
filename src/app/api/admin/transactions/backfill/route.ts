import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "../../../../../../supabase/server";
import { resolveIsAppPlatformAdmin } from "@/lib/platform-admin";
import { recordSubscriptionPayment } from "@/lib/billing/record-subscription-payment";

/** Create invoices + payment rows for completed transactions missing billing records. */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowed = await resolveIsAppPlatformAdmin(supabase, user.id, null);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const db = createServiceClient();

    const { data: completed } = await db
      .from("payment_transactions")
      .select("id")
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(100);

    let synced = 0;
    let skipped = 0;

    for (const row of completed ?? []) {
      const result = await recordSubscriptionPayment(db, row.id as string);
      if (result.recorded) synced++;
      else skipped++;
    }

    return NextResponse.json({ success: true, synced, skipped });
  } catch (error) {
    console.error("POST /api/admin/transactions/backfill", error);
    return NextResponse.json({ error: "Backfill failed" }, { status: 500 });
  }
}
