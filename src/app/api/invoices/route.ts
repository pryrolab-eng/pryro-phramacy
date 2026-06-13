import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireSessionPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import { buildPharmacyBillingHistory } from "@/lib/db/billing";

export type BillingHistoryItem = {
  id: string;
  date: string;
  amount: number;
  status: string;
  planName: string;
  provider: string;
  invoiceNumber?: string;
  source: "invoice" | "transaction";
};

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireSessionPharmacyId(user.id);
    const billing = await buildPharmacyBillingHistory(pharmacyId);
    const lastPaid = billing.history.find((h) => h.status === "Paid");

    const paymentMethodLabel =
      billing.defaultPaymentMethodType ||
      (billing.activePaymentMethod === "polar"
        ? "Card (Polar)"
        : billing.activePaymentMethod
          ? String(billing.activePaymentMethod)
          : "Not set");

    return NextResponse.json({
      nextBilling:
        billing.nextPendingDueDate ||
        (billing.activeExpiresAt
          ? billing.activeExpiresAt.split("T")[0]
          : null),
      amount: billing.nextPendingAmount ?? lastPaid?.amount ?? 0,
      paymentMethod: paymentMethodLabel,
      invoices: billing.history,
      history: billing.history,
      emailReceiptsEnabled: Boolean(
        process.env.SMTP_HOST?.trim() &&
          process.env.SMTP_USER?.trim() &&
          process.env.SMTP_PASS?.trim(),
      ),
    });
  } catch (error) {
    console.error("Billing fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch billing" },
      { status: 500 },
    );
  }
}

/** Legacy stub — prefer subscription billing APIs. */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireSessionPharmacyId(user.id);
    const body = await request.json();

    return NextResponse.json(
      {
        error:
          "Manual invoice creation is deprecated. Use subscription billing or POS sales.",
        pharmacyId: body.pharmacy_id || pharmacyId,
      },
      { status: 410 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 },
    );
  }
}
