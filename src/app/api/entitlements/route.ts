import { NextResponse } from "next/server";
import { createClient } from "../../../../supabase/server";
import { createServiceClient } from "../../../../supabase/service";
import {
  resolvePharmacyEntitlements,
  toEntitlementsSnapshot,
} from "@/lib/subscription/lifecycle/entitlements";
import { getRequestPharmacyId } from "@/lib/subscription/api-guard";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await getRequestPharmacyId(supabase, user.id);
    if (!pharmacyId) {
      return NextResponse.json({ error: "Pharmacy not found" }, { status: 404 });
    }

    const admin = createServiceClient();
    const ent = await resolvePharmacyEntitlements(admin, pharmacyId);
    const snapshot = await toEntitlementsSnapshot(admin, ent);
    return NextResponse.json(snapshot);
  } catch (error) {
    console.error("GET /api/entitlements", error);
    return NextResponse.json(
      { error: "Failed to load entitlements" },
      { status: 500 },
    );
  }
}
