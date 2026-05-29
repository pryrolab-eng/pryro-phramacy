import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../supabase/server";
import { requireSessionPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
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

type RouteParams = { params: Promise<{ id: string }> };

async function getPharmacyContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const pharmacyId = await requireSessionPharmacyId(supabase, user.id);
  return { supabase, pharmacyId };
}

async function loadCustomer(
  supabase: Awaited<ReturnType<typeof createClient>>,
  pharmacyId: string,
  id: string,
) {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .eq("pharmacy_id", pharmacyId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const ctx = await getPharmacyContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const customer = await loadCustomer(ctx.supabase, ctx.pharmacyId, id);
    if (!customer) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const saleRows = await fetchPharmacySaleTotals(ctx.supabase, ctx.pharmacyId);
    const totalsIndex = buildSalesTotalsIndex(saleRows);
    const totalPurchases = lookupCustomerTotal(
      totalsIndex,
      customer.name,
      customer.phone,
    );
    const recentSales = await fetchRecentSalesForCustomer(
      ctx.supabase,
      ctx.pharmacyId,
      customer.name,
      customer.phone,
    );

    return NextResponse.json({
      customer: formatCustomerRow(customer, { totalPurchases }),
      recentSales,
    });
  } catch (error) {
    console.error("Customer GET error:", error);
    return NextResponse.json({ error: "Failed to load customer" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const ctx = await getPharmacyContext();
    if (!ctx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await loadCustomer(ctx.supabase, ctx.pharmacyId, id);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = String(body.name).trim();
    if (body.phone !== undefined) updates.phone = String(body.phone).trim();
    if (body.email !== undefined) updates.email = body.email || null;
    if (body.dateOfBirth !== undefined) {
      updates.date_of_birth = body.dateOfBirth || null;
    }
    if (body.allergies !== undefined) {
      updates.allergies = parseAllergiesInput(body.allergies);
    }
    if (body.insurance !== undefined) {
      updates.insurance_number = body.insurance || null;
    }
    if (body.status !== undefined) {
      updates.is_active = body.status !== "inactive";
    }

    const { data: updated, error } = await ctx.supabase
      .from("customers")
      .update(updates)
      .eq("id", id)
      .eq("pharmacy_id", ctx.pharmacyId)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const saleRows = await fetchPharmacySaleTotals(ctx.supabase, ctx.pharmacyId);
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
    console.error("Customer PATCH error:", error);
    return NextResponse.json({ success: false, error: "Failed to update customer" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const ctx = await getPharmacyContext();
    if (!ctx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { error } = await ctx.supabase
      .from("customers")
      .delete()
      .eq("id", id)
      .eq("pharmacy_id", ctx.pharmacyId);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Customer DELETE error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete customer" }, { status: 500 });
  }
}
