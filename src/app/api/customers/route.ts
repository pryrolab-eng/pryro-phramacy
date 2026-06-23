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
  lookupCustomerTotal,
} from "@/lib/customers/customer-sales";
import {
  storeCreateCustomer,
  storeListCustomers,
  storeSearchCustomers,
} from "@/lib/db/customers-store";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() || "";

    const user = await getAuthUser();
    if (!user) return NextResponse.json([]);

    const pharmacyId = await requireUserPharmacyId(user.id);

    if (query.length > 0) {
      const customers = await storeSearchCustomers({ pharmacyId, query, limit: 5 });
      return NextResponse.json(customers);
    }

    const customers = await storeListCustomers(pharmacyId);
    const saleRows = await fetchPharmacySaleTotals(pharmacyId);
    const totalsIndex = buildSalesTotalsIndex(saleRows);

    const formattedCustomers = customers.map((c) =>
      formatCustomerRow(c, {
        totalPurchases: lookupCustomerTotal(totalsIndex, c.name, c.phone),
      }),
    );

    return NextResponse.json(formattedCustomers);
  } catch (error) {
    console.error("GET /api/customers", error);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireUserPharmacyId(user.id);

    const newCustomer = await storeCreateCustomer({
      pharmacyId,
      name: body.name || body.patientName || "",
      phone: body.phone || body.phoneNumber || "",
      email: body.email || "",
      dateOfBirth: body.dateOfBirth || null,
      allergies: parseAllergiesInput(body.allergies),
      insuranceNumber: body.insurance || body.insuranceNumber || "",
    });

    return NextResponse.json({
      success: true,
      customer: {
        id: newCustomer.id,
        name: newCustomer.name,
        phone: newCustomer.phone,
        insurance_number: newCustomer.insurance_number,
      },
      message: "Customer added to database successfully",
    });
  } catch (error) {
    console.error("POST /api/customers", error);
    return NextResponse.json({ success: false, error: "Failed to add customer" });
  }
}
