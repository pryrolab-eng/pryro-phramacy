import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import { storeBatchImportCustomers } from "@/lib/db/customers-store";
import { MAX_IMPORT_ROWS } from "@/lib/import/types";

type ImportBody = {
  rows?: Array<{
    name: string;
    phone: string;
    email?: string;
    dateOfBirth?: string;
    allergies?: string;
    insurance?: string;
  }>;
};

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" });
    }

    const pharmacyId = await requireUserPharmacyId(user.id);
    const body = (await request.json()) as ImportBody;
    const rows = body.rows ?? [];

    if (rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No rows to import",
      });
    }

    if (rows.length > MAX_IMPORT_ROWS) {
      return NextResponse.json({
        success: false,
        error: `Import limited to ${MAX_IMPORT_ROWS} rows per batch`,
      });
    }

    const result = await storeBatchImportCustomers({
      pharmacyId,
      rows: rows.map((row) => ({
        name: String(row.name ?? "").trim(),
        phone: String(row.phone ?? "").trim(),
        email: String(row.email ?? "").trim() || undefined,
        dateOfBirth: String(row.dateOfBirth ?? "").trim() || undefined,
        allergies: String(row.allergies ?? "").trim() || undefined,
        insurance: String(row.insurance ?? "").trim() || undefined,
      })),
    });

    return NextResponse.json({
      success: result.failures.length === 0,
      ...result,
    });
  } catch (error) {
    console.error("POST /api/customers/import", error);
    return NextResponse.json({
      success: false,
      error: "Failed to import customers",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
