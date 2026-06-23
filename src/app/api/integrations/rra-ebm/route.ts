import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { submitPharmacySaleToEbm } from "@/lib/ebm/submit-sale";
import { requireSessionPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireSessionPharmacyId(user.id);
    const body = await request.json();
    const invoice =
      typeof body.invoice === "string"
        ? body.invoice
        : typeof body.receiptNumber === "string"
          ? body.receiptNumber
          : `RCP-${Date.now()}`;
    const items = Array.isArray(body.items) ? body.items : [];
    const saleId =
      typeof body.saleId === "string" ? body.saleId : `manual-${Date.now()}`;

    const normalizedItems = items.map(
      (item: { name?: string; quantity?: number; price?: number }) => ({
        name: String(item.name ?? "Item"),
        quantity: Number(item.quantity ?? 1),
        unitPrice: Number(item.price ?? 0),
      }),
    );

    const subtotal = normalizedItems.reduce(
      (sum: number, item: { quantity: number; unitPrice: number }) =>
        sum + item.quantity * item.unitPrice,
      0,
    );

    const submission = await submitPharmacySaleToEbm({
      pharmacyId,
      saleId,
      receiptNumber: invoice,
      customerName:
        typeof body.customerName === "string" ? body.customerName : null,
      paymentMethod:
        typeof body.paymentMethod === "string" ? body.paymentMethod : null,
      subtotal,
      items: normalizedItems,
    });

    if (!submission.ok) {
      return NextResponse.json(
        { error: submission.error ?? "RRA EBM submission failed", submission },
        { status: submission.mode === "disabled" ? 400 : 502 },
      );
    }

    return NextResponse.json({ success: true, submission });
  } catch (error) {
    console.error("POST /api/integrations/rra-ebm", error);
    return NextResponse.json({ error: "RRA EBM submission failed" }, { status: 500 });
  }
}
