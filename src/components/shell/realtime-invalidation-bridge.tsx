"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import { inventoryKeys } from "@/lib/http/inventory";
import { pharmacyDashboardKeys } from "@/lib/http/pharmacy-dashboard";
import { salesKeys } from "@/lib/http/sales";
import { prescriptionsKeys } from "@/lib/http/prescriptions";

/** One subscription for all pharmacy routes — avoids duplicate /api/realtime/updates polls. */
export function RealtimeInvalidationBridge() {
  const queryClient = useQueryClient();

  useRealtimeUpdates((update) => {
    if (update.type === "inventory_update") {
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      void queryClient.invalidateQueries({ queryKey: pharmacyDashboardKeys.all });
    }
    if (update.type === "new_sale") {
      void queryClient.invalidateQueries({ queryKey: pharmacyDashboardKeys.all });
      void queryClient.invalidateQueries({ queryKey: salesKeys.all });
    }
    if (update.type === "prescription_update") {
      void queryClient.invalidateQueries({ queryKey: prescriptionsKeys.all });
    }
  });

  return null;
}
