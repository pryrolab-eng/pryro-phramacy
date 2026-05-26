"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPharmacistActivities,
  getPharmacistChartData,
  getPharmacistDashboardStats,
  getPharmacistPrescriptions,
  getPharmacistStockAlerts,
  pharmacistDashboardKeys,
  processPharmacistPrescription,
  trackPharmacistActivity,
  type PharmacistActivity,
  type PharmacistChartPoint,
  type PharmacistStats,
  type PendingPrescription,
} from "@/lib/http/pharmacist-dashboard";
import type { StockAlertsResponse } from "@/lib/http/pharmacy-dashboard";

export {
  pharmacistDashboardKeys,
  type PharmacistActivity,
  type PharmacistChartPoint,
  type PharmacistStats,
  type PendingPrescription,
} from "@/lib/http/pharmacist-dashboard";

export function usePharmacistDashboardStats(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: pharmacistDashboardKeys.stats(),
    queryFn: getPharmacistDashboardStats,
    enabled: options?.enabled ?? true,
  });
}

export function usePharmacistActivities(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: pharmacistDashboardKeys.activities(),
    queryFn: getPharmacistActivities,
    enabled: options?.enabled ?? true,
  });
}

export function usePharmacistChartData(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: pharmacistDashboardKeys.chartData(),
    queryFn: getPharmacistChartData,
    enabled: options?.enabled ?? true,
  });
}

export function usePharmacistPrescriptions(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: pharmacistDashboardKeys.prescriptions(),
    queryFn: getPharmacistPrescriptions,
    enabled: options?.enabled ?? true,
  });
}

export function usePharmacistStockAlerts(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: pharmacistDashboardKeys.stockAlerts(),
    queryFn: getPharmacistStockAlerts,
    enabled: options?.enabled ?? true,
  });
}

export function useInvalidatePharmacistDashboard() {
  const queryClient = useQueryClient();
  return {
    invalidateAll: () =>
      queryClient.invalidateQueries({ queryKey: pharmacistDashboardKeys.all }),
    invalidateStats: () =>
      queryClient.invalidateQueries({
        queryKey: pharmacistDashboardKeys.stats(),
      }),
    invalidateActivities: () =>
      queryClient.invalidateQueries({
        queryKey: pharmacistDashboardKeys.activities(),
      }),
    invalidatePrescriptions: () =>
      queryClient.invalidateQueries({
        queryKey: pharmacistDashboardKeys.prescriptions(),
      }),
    invalidateStockAlerts: () =>
      queryClient.invalidateQueries({
        queryKey: pharmacistDashboardKeys.stockAlerts(),
      }),
  };
}

export function useTrackPharmacistActivityMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      type,
      data,
    }: {
      type: string;
      data: Record<string, unknown>;
    }) => trackPharmacistActivity(type, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: pharmacistDashboardKeys.stats(),
      });
    },
  });
}

export function useProcessPharmacistPrescriptionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: processPharmacistPrescription,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: pharmacistDashboardKeys.prescriptions(),
      });
      void queryClient.invalidateQueries({
        queryKey: pharmacistDashboardKeys.stats(),
      });
    },
  });
}

export type { StockAlertsResponse };
