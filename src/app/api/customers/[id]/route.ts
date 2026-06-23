import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import {
  formatCustomerRow,
  parseAllergiesInput,
} from "@/lib/customers/format-customer";
import {
  buildSalesTotalsIndex,
  fetchPharmacySaleTotals,
  fetchRecentSalesForCustomer,
  lookupCustomerTotal,
} from "@/lib/customers/customer-sales";
import {
  storeDeleteCustomer,
  storeFindCustomer,
  storeUpdateCustomer,
} from "@/lib/db/customers-store";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireUserPharmacyId(user.id);
    const { id } = await params;
    const customer = await storeFindCustomer(pharmacyId, id);
    if (!customer) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const saleRows = await fetchPharmacySaleTotals(pharmacyId);
    const totalsIndex = buildSalesTotalsIndex(saleRows);
    const totalPurchases = lookupCustomerTotal(
      totalsIndex,
      customer.name,
      customer.phone,
    );
    const recentSales = await fetchRecentSalesForCustomer(
      pharmacyId,
      customer.name,
      customer.phone ?? null,
    );

    return NextResponse.json({
      customer: formatCustomerRow(customer, { totalPurchases }),
      recentSales,
    });
  } catch (error) {
    console.error("GET /api/customers/[id]", error);
    return NextResponse.json({ error: "Failed to load customer" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireUserPharmacyId(user.id);
    const { id } = await params;
    const body = await request.json();

    const existing = await storeFindCustomer(pharmacyId, id);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    const updates: {
      name?: string;
      phone?: string;
      email?: string | null;
      dateOfBirth?: string | null;
      allergies?: string[];
      insuranceNumber?: string | null;
      isActive?: boolean;
    } = {};

    if (body.name !== undefined) updates.name = String(body.name).trim();
    if (body.phone !== undefined) updates.phone = String(body.phone).trim();
    if (body.email !== undefined) updates.email = body.email || null;
    if (body.dateOfBirth !== undefined) updates.dateOfBirth = body.dateOfBirth || null;
    if (body.allergies !== undefined) updates.allergies = parseAllergiesInput(body.allergies);
    if (body.insurance !== undefined) updates.insuranceNumber = body.insurance || null;
    if (body.status !== undefined) updates.isActive = body.status !== "inactive";

    const updated = await storeUpdateCustomer({
      pharmacyId,
      customerId: id,
      updates,
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: "Update failed" }, { status: 500 });
    }

    const saleRows = await fetchPharmacySaleTotals(pharmacyId);
    const totalPurchases = lookupCustomerTotal(
      buildSalesTotalsIndex(saleRows),
      updated.name,
      updated.phone,
    );

    return NextResponse.json({
      success: true,
      customer: formatCustomerRow(updated, { totalPurchases }),
    });
  } catch (error) {
    console.error("PATCH /api/customers/[id]", error);
    return NextResponse.json({ success: false, error: "Failed to update customer" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireUserPharmacyId(user.id);
    const { id } = await params;
    await storeDeleteCustomer({ pharmacyId, customerId: id });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/customers/[id]", error);
    return NextResponse.json({ success: false, error: "Failed to delete customer" }, { status: 500 });
  }
}
