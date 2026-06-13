import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import {
  buildPlatformAdminEntitlementsSnapshot,
  resolvePharmacyEntitlements,
  toEntitlementsSnapshot,
} from "@/lib/subscription/lifecycle/entitlements";
import { getRequestPharmacyId } from "@/lib/subscription/api-guard";
import { resolveIsAppPlatformAdmin } from "@/lib/platform-admin";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await getRequestPharmacyId(user.id);
    if (!pharmacyId) {
      const isPlatformAdmin = await resolveIsAppPlatformAdmin(user.id);
      if (isPlatformAdmin) {
        const snapshot = await buildPlatformAdminEntitlementsSnapshot();
        return NextResponse.json(snapshot);
      }
      return NextResponse.json({ error: "Pharmacy not found" }, { status: 404 });
    }

    const ent = await resolvePharmacyEntitlements(pharmacyId);
    const snapshot = await toEntitlementsSnapshot(ent);
    return NextResponse.json(snapshot);
  } catch (error) {
    console.error("GET /api/entitlements", error);
    return NextResponse.json(
      { error: "Failed to load entitlements" },
      { status: 500 },
    );
  }
}
