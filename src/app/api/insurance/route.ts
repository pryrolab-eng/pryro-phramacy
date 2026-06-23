import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { resolveIsAppPlatformAdmin } from "@/lib/platform-admin";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import { resolveActivePharmacyContext } from "@/lib/pharmacy/active-pharmacy";
import {
  storeCreateInsuranceProvider,
  storeListAllInsuranceProviders,
  storeListGlobalInsuranceProviders,
  storeListPharmacyInsuranceProviders,
} from "@/lib/db/insurance-store";

export async function GET(_request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      const providers = await storeListGlobalInsuranceProviders();
      return NextResponse.json(providers);
    }

    const isSuperAdmin = await resolveIsAppPlatformAdmin(user.id);

    if (isSuperAdmin) {
      const providers = await storeListAllInsuranceProviders();
      return NextResponse.json(providers);
    }

    const pharmacyId = await requireUserPharmacyId(user.id);
    const providers = await storeListPharmacyInsuranceProviders(pharmacyId);
    return NextResponse.json(providers);
  } catch (error) {
    console.error("GET /api/insurance", error);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Please login" },
        { status: 401 },
      );
    }

    const isSuperAdmin = await resolveIsAppPlatformAdmin(user.id);

    let pharmacyId: string | null = null;

    if (!isSuperAdmin) {
      const ctx = await resolveActivePharmacyContext(user.id);

      if (!ctx.activePharmacyId) {
        return NextResponse.json(
          { success: false, error: "User not associated with any pharmacy" },
          { status: 403 },
        );
      }

      if (!["pharmacy_owner", "admin"].includes(ctx.role ?? "")) {
        return NextResponse.json(
          { success: false, error: "Insufficient permissions" },
          { status: 403 },
        );
      }

      pharmacyId = ctx.activePharmacyId;
    }

    if (!body.name || !body.coverage_percentage) {
      return NextResponse.json(
        { success: false, error: "Name and coverage percentage are required" },
        { status: 400 },
      );
    }

    const coveragePct = parseFloat(body.coverage_percentage);
    const newInsurance = await storeCreateInsuranceProvider({
      pharmacyId,
      name: body.name.trim(),
      coveragePercentage: coveragePct,
      contactEmail: body.contact_email?.trim() || null,
      contactPhone: body.contact_phone?.trim() || null,
      policyNumber: body.policy_number?.trim() || null,
      invoiceTemplate: body.invoice_template || "default",
      templateConfig: body.template_config || {},
    });

    return NextResponse.json({
      success: true,
      insurance: newInsurance,
      message: "Insurance provider added successfully",
    });
  } catch (error) {
    console.error("POST /api/insurance", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to add insurance",
    });
  }
}
