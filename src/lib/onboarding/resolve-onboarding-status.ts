import {
  getLatestSubscriptionWithPlanForPharmacy,
  getOnboardingPharmacyProfile,
  hasActiveSubscriptionForPharmacy,
  findOwnedPharmacyIdByUserId,
  type OnboardingPendingPlan,
  type OnboardingPharmacyRow,
} from "@/lib/db/onboarding";
import {
  storeFindFirstActiveMembership,
  storeUpsertPharmacyMembership,
} from "@/lib/db/pharmacy-users-store";
import { resolveIsAppPlatformAdmin } from "@/lib/platform-admin";

export type OnboardingStep = 1 | 2 | 3 | 4 | 5;

export type OnboardingStatusResult =
  | {
      step: OnboardingStep;
      pharmacy: OnboardingPharmacyRow | null;
      pendingPlan: OnboardingPendingPlan | null;
      completed: false;
      isPlatformAdmin: true;
      redirect: "/admin";
    }
  | {
      step: 1;
      pharmacy: null;
      pendingPlan: null;
      completed: false;
      needsPharmacyProfile: true;
    }
  | {
      step: 4;
      pharmacy: OnboardingPharmacyRow;
      pendingPlan: null;
      completed: false;
      subscriptionActive: true;
    }
  | {
      step: 3;
      pharmacy: OnboardingPharmacyRow;
      pendingPlan: OnboardingPendingPlan;
      completed: false;
    }
  | {
      step: 2;
      pharmacy: OnboardingPharmacyRow;
      pendingPlan: null;
      completed: false;
    };

export async function resolveOnboardingStatus(
  userId: string,
): Promise<OnboardingStatusResult> {
  const membership = await storeFindFirstActiveMembership(userId);

  const isPlatformAdmin = await resolveIsAppPlatformAdmin(
    userId,
    membership?.role,
  );

  if (isPlatformAdmin) {
    return {
      step: 1,
      pharmacy: null,
      pendingPlan: null,
      completed: false,
      isPlatformAdmin: true,
      redirect: "/admin",
    };
  }

  let pharmacyId = membership?.pharmacy_id ?? null;

  if (!pharmacyId) {
    const ownedId = await findOwnedPharmacyIdByUserId(userId);
    if (ownedId) {
      await storeUpsertPharmacyMembership({
        pharmacyId: ownedId,
        userId,
        role: "pharmacy_owner",
        isActive: true,
      });
      pharmacyId = ownedId;
    }
  }

  if (!pharmacyId) {
    return {
      step: 1,
      pharmacy: null,
      pendingPlan: null,
      completed: false,
      needsPharmacyProfile: true,
    };
  }

  const pharmacy = await getOnboardingPharmacyProfile(pharmacyId);
  if (!pharmacy) {
    return {
      step: 1,
      pharmacy: null,
      pendingPlan: null,
      completed: false,
      needsPharmacyProfile: true,
    };
  }

  if (await hasActiveSubscriptionForPharmacy(pharmacyId)) {
    return {
      step: 4,
      pharmacy,
      pendingPlan: null,
      completed: false,
      subscriptionActive: true,
    };
  }

  const latest = await getLatestSubscriptionWithPlanForPharmacy(pharmacyId);
  const plan = latest?.plan;

  if (plan && latest && !latest.is_active && plan.price > 0) {
    return {
      step: 3,
      pharmacy,
      pendingPlan: {
        id: plan.id,
        name: plan.name,
        price: plan.price,
        period: plan.period,
        features: plan.features,
        is_popular: plan.is_popular,
        subscriptionId: latest.id,
      },
      completed: false,
    };
  }

  return {
    step: 2,
    pharmacy,
    pendingPlan: null,
    completed: false,
  };
}
