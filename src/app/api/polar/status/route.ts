import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { getPolarClient, isPolarConfigured } from "@/lib/polar/client";
import {
  fulfillPolarSubscription,
  parsePolarMetadata,
} from "@/lib/polar/fulfillment";
import { storeFindMembershipAtPharmacy } from "@/lib/db/pharmacy-users-store";
import { storeFindPaymentTransactionByPolarCheckoutId } from "@/lib/db/payment-transactions-store";

export async function GET(request: NextRequest) {
  const checkoutId = request.nextUrl.searchParams.get("checkoutId");

  if (!checkoutId) {
    return NextResponse.json({ error: "checkoutId is required" }, { status: 400 });
  }

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tx = await storeFindPaymentTransactionByPolarCheckoutId(checkoutId);

  if (!tx) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  if (!tx.pharmacy_id) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  const member = await storeFindMembershipAtPharmacy(user.id, tx.pharmacy_id);
  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (tx.status === "completed") {
    return NextResponse.json({
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
          checkout.metadata as Record<string, unknown>,
        );
        await fulfillPolarSubscription(
          {
            ...meta,
            subscription_id: meta.subscription_id || tx.subscription_id || undefined,
            pharmacy_id: meta.pharmacy_id || tx.pharmacy_id || undefined,
          },
          checkoutId,
        );
        return NextResponse.json({
          status: "completed",
          transaction: { id: tx.id, status: "completed" },
        });
      }
      return NextResponse.json({
        status: status || "pending",
        transaction: { id: tx.id, status: tx.status },
      });
    } catch (e) {
      console.error("Polar status poll:", e);
    }
  }

  return NextResponse.json({
    status: tx.status,
    transaction: { id: tx.id, status: tx.status },
  });
}
