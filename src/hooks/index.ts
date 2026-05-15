"use client";

/** Prefer `import { … } from "@/hooks"` for shared client hooks. */

export { usePharmacy, useDashboard } from "./usePharmacy";
export { PharmacyProvider, usePharmacyStore } from "./usePharmacyStore";
export { useRealtimeUpdates } from "./useRealtimeUpdates";
export {
  insuranceProvidersQueryKey,
  useInsuranceProviders,
  type InsuranceProviderRow,
} from "./useInsuranceProviders";
export { useIsMobile } from "./use-mobile";
export { adminCategoriesQueryKey, useAdminCategories } from "./useAdminCategories";
export { useAdminDashboardData } from "./useAdminDashboardData";
export {
  adminPharmaciesQueryKey,
  useAdminPharmacies,
} from "./useAdminPharmacies";
export { adminPlansQueryKey, useAdminPlans } from "./useAdminPlans";
export {
  adminReportsSummaryQueryKey,
  useAdminReportsSummary,
  type AdminReportsSummary,
  type ExportableReport,
} from "./useAdminReportsSummary";
export { useUploadPlatformAdminReportMutation } from "./useUploadPlatformAdminReportMutation";
export {
  adminSystemSettingsQueryKey,
  useAdminSystemSettings,
} from "./useAdminSystemSettings";
export {
  stockLocationsQueryKey,
  useCreateStockLocationMutation,
  useStockLocations,
  type CreateStockLocationInput,
  type StockLocationRow,
} from "./useStockLocations";
export { staffUsersQueryKey, useUsers, type StaffUser } from "./useUsers";
