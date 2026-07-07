import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import { seedPharmacyDemo } from "@/lib/seed/seed-pharmacy-demo";

function isDemoSeedAllowed(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.SEED_DEMO_ENABLED === "true"
  );
}

export async function POST() {
  if (!isDemoSeedAllowed()) {
    return NextResponse.json(
      { success: false, error: "Demo seed is disabled in this environment" },
      { status: 403 },
    );
  }

  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireUserPharmacyId(user.id);
    const result = await seedPharmacyDemo(pharmacyId);

    return NextResponse.json({ success: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to seed demo data";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
