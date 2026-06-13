import type { subscription_plan } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { planNameToEnum } from "@/lib/subscription/plan-enum";
import type { EntitlementPlan } from "@/lib/subscription/lifecycle/types";

export async function syncPharmacySubscriptionProjectionFromDb(
  pharmacyId: string,
  projection: {
    plan: EntitlementPlan | null;
    expiresAt: string | null;
    accessAllowed: boolean;
  },
): Promise<void> {
  const planEnum = (
    projection.plan ? planNameToEnum(projection.plan.name) : "trial"
  ) as subscription_plan;

  await prisma.pharmacies.update({
    where: { id: pharmacyId },
    data: {
      subscription_plan: planEnum,
      subscription_expires_at: projection.expiresAt
        ? new Date(projection.expiresAt)
        : null,
      status: projection.accessAllowed ? "active" : "suspended",
      updated_at: new Date(),
    },
  });
}
