import { NextRequest } from "next/server";
import { createRouteHandlerClient } from "../../../../../supabase/route-handler";
import { createServiceClient } from "../../../../../supabase/service";
import { getPolarClient, isPolarConfigured } from "@/lib/polar/client";
import {
  fulfillPolarSubscription,
  parsePolarMetadata,
} from "@/lib/polar/fulfillment";

export async function GET(request: NextRequest) {
  const { supabase, json } = createRouteHandlerClient(request);
  const checkoutId = request.nextUrl.searchParams.get("checkoutId");

  if (!checkoutId) {
    return json({ error: "checkoutId is required" }, { status: 400 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createServiceClient();
  const { data: tx } = await admin
    .from("payment_transactions")
    .select("id, status, subscription_id, pharmacy_id, polar_checkout_id")
    .eq("polar_checkout_id", checkoutId)
    .maybeSingle();

  if (!tx) {
    return json({ error: "Transaction not found" }, { status: 404 });
  }

  const { data: member } = await admin
    .from("pharmacy_users")
    .select("pharmacy_id")
    .eq("user_id", user.id)
    .eq("pharmacy_id", tx.pharmacy_id)
    .eq("is_active", true)
    .maybeSingle();

  if (!member) {
    return json({ error: "Forbidden" }, { status: 403 });
  }

  if (tx.status === "completed") {
    return json({
      status: "completed",
      transaction: { id: tx.id, status: tx.status },
    });
  }

  if (isPolarConfigured()) {
    try {
      const polar = getPolarClient();
      const checkout = await polar.checkouts.get({ id: checkoutId });
      const status = String(checkout.status ?? "");
      if (status === "succeeded" || status === "confirmed") {
        const meta = parsePolarMetadata(
          checkout.metadata as Record<string, unknown>
        );
        await fulfillPolarSubscription(admin, {
          ...meta,
          subscription_id: meta.subscription_id || tx.subscription_id,
          pharmacy_id: meta.pharmacy_id || tx.pharmacy_id,
        }, checkoutId);
        return json({
          status: "completed",
          transaction: { id: tx.id, status: "completed" },
        });
      }
      return json({
        status: status || "pending",
        transaction: { id: tx.id, status: tx.status },
      });
    } catch (e) {
      console.error("Polar status poll:", e);
    }
  }

  return json({
    status: tx.status,
    transaction: { id: tx.id, status: tx.status },
  });
}
