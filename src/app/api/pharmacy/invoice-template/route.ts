import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import { storeFindMembershipAtPharmacy } from "@/lib/db/pharmacy-users-store";
import { isPharmacyOwnerRole } from "@/lib/rbac/pharmacy-roles";
import {
  DEFAULT_INVOICE_TEMPLATE,
  getPharmacyInvoiceTemplateFromDb,
  upsertPharmacyInvoiceTemplateFromDb,
  type InvoiceTemplateConfig,
} from "@/lib/db/pharmacy-invoice-template";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireUserPharmacyId(user.id);
    const template = await getPharmacyInvoiceTemplateFromDb(pharmacyId);
    return NextResponse.json(template);
  } catch (error) {
    console.error("GET /api/pharmacy/invoice-template", error);
    return NextResponse.json(DEFAULT_INVOICE_TEMPLATE);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireUserPharmacyId(user.id);
    const membership = await storeFindMembershipAtPharmacy(user.id, pharmacyId);
    if (!membership || !isPharmacyOwnerRole(membership.role)) {
      return NextResponse.json(
        { error: "Only the pharmacy owner can update invoice templates" },
        { status: 403 },
      );
    }

    const template = (await request.json()) as InvoiceTemplateConfig;
    const saved = await upsertPharmacyInvoiceTemplateFromDb(pharmacyId, template);

    return NextResponse.json({ success: true, template: saved });
  } catch (error) {
    console.error("PUT /api/pharmacy/invoice-template", error);
    return NextResponse.json(
      { success: false, error: "Failed to update template" },
      { status: 500 },
    );
  }
}
