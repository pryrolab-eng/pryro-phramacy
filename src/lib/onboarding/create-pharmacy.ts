import {
  createOnboardingPharmacyFromDb,
  deleteOnboardingPharmacyFromDb,
} from "@/lib/db/onboarding";
import {
  storeCreatePharmacyMembership,
  storeFindFirstActiveMembership,
} from "@/lib/db/pharmacy-users-store";
import { storeUpsertPublicUser } from "@/lib/db/public-users-store";

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
    await storeCreatePharmacyMembership({
      pharmacyId: pharmacy.id,
      userId: input.userId,
      role: "pharmacy_owner",
      isActive: true,
    });
  } catch (error) {
    await deleteOnboardingPharmacyFromDb(pharmacy.id);
    throw error;
  }

  return { success: true, pharmacyId: pharmacy.id };
}
