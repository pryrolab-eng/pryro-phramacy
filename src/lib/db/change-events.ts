import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { SubscriptionChangeEventType } from "@/lib/subscription/change-events";

export async function logSubscriptionChangeEventFromDb(params: {
  pharmacyId: string;
  subscriptionId?: string | null;
  event: SubscriptionChangeEventType;
  fromPlanId?: string | null;
  toPlanId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.subscription_change_events.create({
      data: {
        pharmacy_id: params.pharmacyId,
        subscription_id: params.subscriptionId ?? null,
        event: params.event,
        from_plan_id: params.fromPlanId ?? null,
        to_plan_id: params.toPlanId ?? null,
        metadata: (params.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "insert failed";
    console.warn("subscription_change_events insert:", message);
  }
}
