import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import { getEffectiveSubscriptionLabel } from "@/lib/subscription/effective-plan";
import { isPharmacyOwnerRole } from "@/lib/rbac/pharmacy-roles";
import { prisma } from "@/lib/db/prisma";
import {
  getPharmacyLocaleFromDb,
  upsertPharmacyLocaleFromDb,
} from "@/lib/db/pharmacy-locale";
import { storeFindMembershipAtPharmacy } from "@/lib/db/pharmacy-users-store";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireUserPharmacyId(user.id);

    const pharmacy = await prisma.pharmacies.findUnique({
      where: { id: pharmacyId },
      select: {
        name: true,
        license_number: true,
        city: true,
        province: true,
        phone: true,
        email: true,
        subscription_plan: true,
        subscription_expires_at: true,
      },
    });

    if (!pharmacy) {
      return NextResponse.json({ error: "Pharmacy not found" }, { status: 404 });
    }

    const subscription = await getEffectiveSubscriptionLabel(pharmacyId,
      pharmacy.subscription_plan,
    );

    const locale = await getPharmacyLocaleFromDb(pharmacyId);

    return NextResponse.json({
      name: pharmacy.name,
      license: pharmacy.license_number,
      location: [pharmacy.city, pharmacy.province].filter(Boolean).join(", "),
      phone: pharmacy.phone,
      email: pharmacy.email,
      subscription,
      subscriptionExpiresAt: pharmacy.subscription_expires_at ?? null,
      currency: locale.currency,
      language: locale.language,
    });
  } catch (error) {
    console.error("Settings fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
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
        { error: "Only the pharmacy owner can update business settings" },
        { status: 403 },
      );
    }

    const body = await request.json();

    if (!body.name || !body.phone || !body.email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const locationParts = String(body.location ?? "")
      .split(",")
      .map((part: string) => part.trim());

    await prisma.pharmacies.update({
      where: { id: pharmacyId },
      data: {
        name: body.name,
        phone: body.phone,
        email: body.email,
        city: locationParts[0] || null,
        province: locationParts[1] || null,
      },
    });

    if (body.currency || body.language) {
      await upsertPharmacyLocaleFromDb(pharmacyId, {
        currency: body.currency,
        language: body.language,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
