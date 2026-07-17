import {
  createOnboardingPharmacyFromDb,
  deleteOnboardingPharmacyFromDb,
} from "@/lib/db/onboarding";
import {
  storeCreatePharmacyMembership,
  storeFindFirstActiveMembership,
} from "@/lib/db/pharmacy-users-store";
import { storeUpsertPublicUser } from "@/lib/db/public-users-store";
import { prisma } from "@/lib/db/prisma";
import { getStockLocationTemplates } from "@/lib/stock-location-templates";
import {
  emitPlatformAdminNotification,
  PLATFORM_ADMIN_EVENT,
} from "@/lib/notifications/platform-admin";

export type CreateOnboardingPharmacyInput = {
  userId: string;
  userEmail: string | null | undefined;
  userFullName?: string | null;
  name: string;
  licenseNumber: string;
  city: string;
  address?: string | null;
  phone: string;
  email: string;
};

export type CreateOnboardingPharmacyResult =
  | { success: true; pharmacyId: string; alreadyExists: true }
  | { success: true; pharmacyId: string; alreadyExists?: false };

export async function createOnboardingPharmacy(
  input: CreateOnboardingPharmacyInput,
): Promise<CreateOnboardingPharmacyResult> {
  const existing = await storeFindFirstActiveMembership(input.userId);
  if (existing?.pharmacy_id) {
    return {
      success: true,
      pharmacyId: existing.pharmacy_id,
      alreadyExists: true,
    };
  }

  await storeUpsertPublicUser({
    userId: input.userId,
    email: input.userEmail ?? input.email,
    name: input.userFullName ?? input.name,
    fullName: input.userFullName ?? input.name,
  });

  const pharmacy = await createOnboardingPharmacyFromDb({
    name: input.name,
    licenseNumber: input.licenseNumber,
    ownerId: input.userId,
    address: input.address ?? null,
    phone: input.phone,
    email: input.email,
    city: input.city,
  });

  try {
    const templates = await getStockLocationTemplates();
    if (templates.length) {
      await prisma.stock_locations.createMany({
        data: templates
          .filter((template) => template.is_active)
          .map((template) => ({
            pharmacy_id: pharmacy.id,
            name: template.name,
            description: template.description,
            is_active: true,
          })),
      });
    }

    await storeCreatePharmacyMembership({
      pharmacyId: pharmacy.id,
      userId: input.userId,
      role: "pharmacy_owner",
      isActive: true,
    });

    // Set active pharmacy for the user
    await prisma.public_users.update({
      where: { id: input.userId },
      data: { active_pharmacy_id: pharmacy.id },
    });
  } catch (error) {
    await deleteOnboardingPharmacyFromDb(pharmacy.id);
    throw error;
  }

  void emitPlatformAdminNotification({
    eventType: PLATFORM_ADMIN_EVENT.pharmacyRegistered,
    title: "New pharmacy registered",
    message: `${input.name} joined the platform.`,
    type: "success",
    actionUrl: `/admin/tenants`,
    payload: {
      pharmacyId: pharmacy.id,
      pharmacyName: input.name,
      city: input.city,
    },
  });

  return { success: true, pharmacyId: pharmacy.id };
}
