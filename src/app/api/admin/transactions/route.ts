import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "../../../../../supabase/server";
import { resolveIsAppPlatformAdmin } from "@/lib/platform-admin";

export async function GET() {
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
      return NextResponse.json(
        { error: "Forbidden: platform admin access required" },
        { status: 403 }
      );
    }

    const db = createServiceClient();

    const { data: transactions, error } = await db
      .from("payment_transactions")
      .select(
        `
        id,
        pharmacy_id,
        subscription_id,
        amount,
        currency,
        status,
        payment_method,
        payment_provider,
        payment_details,
        customer_name,
        customer_email,
        customer_phone,
        kpay_refid,
        polar_checkout_id,
        completed_at,
        created_at,
        pharmacies ( id, name, email )
      `
      )
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw error;

    const { data: subscriptions } = await db
      .from("subscriptions")
      .select("id, pharmacy_id, plan, is_active, expires_at, payment_method")
      .order("created_at", { ascending: false })
      .limit(200);

    return NextResponse.json({
      transactions: transactions ?? [],
      subscriptions: subscriptions ?? [],
    });
  } catch (error) {
    console.error("GET /api/admin/transactions", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
