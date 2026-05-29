"use client";

import { useMemo } from "react";
import { usePharmacyEntitlements } from "@/hooks/usePharmacyEntitlements";
import {
  usePharmacySubscriptionPlan,
  useSubscriptionStatusQuery,
} from "@/hooks/useSubscriptionManagement";
import type { ActivePlanRef } from "@/lib/subscription/match-current-catalog-plan";

type StatusPlan = {
  id?: string;
  name?: string;
  price?: number;
};

export function useActiveCatalogPlanRef() {
  const entitlementsQuery = usePharmacyEntitlements();
  const pharmacyPlanQuery = usePharmacySubscriptionPlan();
  const statusQuery = useSubscriptionStatusQuery();

  const activePlan = useMemo((): ActivePlanRef | null => {
    const ent = entitlementsQuery.entitlements?.effectivePlan;
    if (ent?.name) {
      return {
        id: ent.id ?? null,
        name: ent.name,
        price: ent.price,
      };
    }

    const statusPlan = statusQuery.data?.plan as StatusPlan | null | undefined;
    if (statusPlan?.name) {
      return {
        id: statusPlan.id ?? null,
        name: String(statusPlan.name),
        price: Number(statusPlan.price ?? 0),
      };
    }

    const settingsLabel = pharmacyPlanQuery.data?.subscription;
    if (settingsLabel) {
      return {
        id: null,
        name: settingsLabel,
      };
    }

    return null;
  }, [
    entitlementsQuery.entitlements?.effectivePlan,
    statusQuery.data?.plan,
    pharmacyPlanQuery.data?.subscription,
  ]);

  const isLoading =
    !activePlan &&
    (entitlementsQuery.isHydrating ||
      (!entitlementsQuery.isEntitlementsReady &&
        entitlementsQuery.isPending) ||
      pharmacyPlanQuery.isPending ||
      statusQuery.isPending);

  const isError =
    !activePlan &&
    !isLoading &&
    (entitlementsQuery.isError ||
      pharmacyPlanQuery.isError ||
      statusQuery.isError);

  const refetch = () => {
    void entitlementsQuery.refetch();
    void pharmacyPlanQuery.refetch();
    void statusQuery.refetch();
  };

  return {
    activePlan,
    isLoading,
    isError,
    refetch,
  };
}
