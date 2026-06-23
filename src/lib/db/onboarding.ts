import { prisma } from "@/lib/db/prisma";

export type OnboardingPharmacyRow = {
  id: string;
  name: string;
  license_number: string | null;
  city: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  status: string | null;
  subscription_plan: string | null;
};

export type OnboardingPendingPlan = {
  id: string;
  name: string;
  price: number;
  period: string | null;
  features: string[] | null;
  is_popular: boolean | null;
  subscriptionId: string;
};

export async function findOwnedPharmacyIdByUserId(
  userId: string,
): Promise<string | null> {
  const row = await prisma.pharmacies.findFirst({
    where: { owner_id: userId },
    select: { id: true },
    orderBy: { created_at: "asc" },
  });
  return row?.id ?? null;
}

export async function getOnboardingPharmacyProfile(
  pharmacyId: string,
): Promise<OnboardingPharmacyRow | null> {
  const row = await prisma.pharmacies.findUnique({
    where: { id: pharmacyId },
    select: {
      id: true,
      name: true,
      license_number: true,
      city: true,
      address: true,
      phone: true,
      email: true,
      status: true,
      subscription_plan: true,
    },
  });
  if (!row) return null;
  return {
    ...row,
    status: row.status != null ? String(row.status) : null,
    subscription_plan:
      row.subscription_plan != null ? String(row.subscription_plan) : null,
  };
}

export async function hasActiveSubscriptionForPharmacy(
  pharmacyId: string,
): Promise<boolean> {
  const row = await prisma.subscriptions.findFirst({
    where: { pharmacy_id: pharmacyId, is_active: true },
    select: { id: true },
  });
  return Boolean(row);
}

export async function createOnboardingPharmacyFromDb(input: {
  name: string;
  licenseNumber: string;
  ownerId: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
}): Promise<{ id: string }> {
  const row = await prisma.pharmacies.create({
    data: {
      name: input.name,
      license_number: input.licenseNumber,
      owner_id: input.ownerId,
      address: input.address ?? null,
      phone: input.phone ?? null,
      email: input.email ?? null,
      city: input.city ?? null,
      status: "trial",
      subscription_plan: "trial",
    },
    select: { id: true },
  });
  return row;
}

export async function deleteOnboardingPharmacyFromDb(
  pharmacyId: string,
): Promise<void> {
  await prisma.pharmacies.delete({ where: { id: pharmacyId } });
}

export async function getLatestSubscriptionWithPlanForPharmacy(
  pharmacyId: string,
): Promise<{
  id: string;
  is_active: boolean | null;
  plan: {
    id: string;
    name: string;
    price: number;
    period: string | null;
    features: string[] | null;
    is_popular: boolean | null;
  } | null;
} | null> {
  const row = await prisma.subscriptions.findFirst({
    where: { pharmacy_id: pharmacyId },
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      is_active: true,
      subscription_plans_subscriptions_plan_idTosubscription_plans: {
        select: {
          id: true,
          name: true,
          price: true,
          period: true,
          features: true,
          is_popular: true,
        },
      },
    },
  });

  if (!row) return null;

  const plan = row.subscription_plans_subscriptions_plan_idTosubscription_plans;
  return {
    id: row.id,
    is_active: row.is_active,
    plan: plan
      ? {
          id: plan.id,
          name: plan.name,
          price: Number(plan.price ?? 0),
          period: plan.period,
          features: plan.features,
          is_popular: plan.is_popular,
        }
      : null,
  };
}
