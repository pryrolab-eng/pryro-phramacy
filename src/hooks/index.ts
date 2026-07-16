"use client";

/** Prefer `import { … } from "@/hooks"` for shared client hooks. */

export {
  pharmacyDashboardKeys,
  useCombinedPharmacyDashboard,
  useInvalidatePharmacyDashboard,
  usePharmacyCategorySalesChart,
  usePharmacyDashboardOverviewLoading,
  usePharmacyDashboardStats,
  usePharmacyInventoryChart,
  usePharmacySalesChart,
  usePharmacyWeeklySalesChart,
  useRecentPosSales,
  useStockAlerts,
  type CategorySalesChartPoint,
  type CombinedDashboardData,
  type InventoryChartPoint,
  type PharmacyDashboardStats,
  type RecentSaleRow,
  type SalesChartPoint,
  type StockAlertRow,
  type StockAlertsResponse,
  type WeeklySalesChartPoint,
} from "./usePharmacyDashboard";
export { useBranding } from "./useBranding";
export { usePlatformSupport } from "./usePlatformSupport";
export { useDashboardGraceNav } from "./useDashboardGraceNav";
export { useEntitledBranches } from "./useEntitledBranches";
export { useCreatePharmacistMutation } from "./useCreatePharmacist";
export { PharmacyProvider, usePharmacyStore } from "./usePharmacyStore";
export { useRealtimeUpdates } from "./useRealtimeUpdates";
export {
  useNotificationStream,
  type LiveNotification,
} from "./useNotificationStream";
export {
  insuranceProvidersQueryKey,
  useInsuranceProviders,
  useUpdateClaimStatusMutation,
  useUploadInsurancePricingMutation,
  type InsuranceProviderRow,
} from "./useInsuranceProviders";
export {
  useInvoiceTemplate,
  useUpdateInvoiceTemplateMutation,
  type InvoiceTemplate,
} from "./useInvoiceTemplate";
export { useSendRecoveryEmailMutation, useVerify2FAMutation } from "./useAuth";
export { usePublicMainPlans } from "./usePlans";
export { useIsMobile } from "./use-mobile";
export {
  adminCategoriesQueryKey,
  useAdminCategories,
  useCreateAdminCategoryMutation,
  useDeleteAdminCategoryMutation,
  useUpdateAdminCategoryMutation,
  type AdminCategoryRow,
} from "./useAdminCategories";
export {
  adminInsuranceTemplatesQueryKey,
  useAdminInsuranceTemplates,
  useCreateAdminInsuranceTemplateMutation,
  useDeleteAdminInsuranceTemplateMutation,
  useUpdateAdminInsuranceTemplateMutation,
  type AdminInsuranceTemplateRow,
} from "./useAdminInsuranceTemplates";
export { useAdminDashboardData } from "./useAdminDashboardData";
export {
  adminPharmaciesQueryKey,
  useAdminPharmacies,
} from "./useAdminPharmacies";
export {
  adminPharmacyDetailQueryKey,
  useAdminPharmacyDetail,
} from "./useAdminPharmacyDetail";
export { adminPlansQueryKey, useAdminPlans } from "./useAdminPlans";
export {
  useAdminFeatures,
  useCreateAdminFeatureMutation,
  useUpdateAdminFeatureMutation,
} from "./useAdminFeatures";
export {
  usePharmacyEntitlements,
  type PharmacyEntitlementsSnapshot,
} from "./usePharmacyEntitlements";
export {
  adminTransactionsQueryKey,
  useAdminTransactions,
} from "./useAdminTransactions";
export { adminBillingQueryKey, useAdminBilling } from "./useAdminBilling";
export {
  adminReportsSummaryQueryKey,
  useAdminReportsSummary,
  type AdminReportsSummary,
  type ExportableReport,
} from "./useAdminReportsSummary";
export { usePlatformChartData } from "./usePlatformChartData";
export { useUploadPlatformAdminReportMutation } from "./useUploadPlatformAdminReportMutation";
export {
  adminSystemSettingsQueryKey,
  useAdminSystemSettings,
} from "./useAdminSystemSettings";
export {
  adminApiKeysQueryKey,
  adminIpWhitelistQueryKey,
} from "@/lib/http/admin/platform-security";
export {
  useAdminApiKeys,
  useAdminIpWhitelist,
  useAddAdminIpWhitelistMutation,
  useCreateAdminApiKeyMutation,
  useDeleteAdminApiKeyMutation,
  useRemoveAdminIpWhitelistMutation,
  useUpdateAdminApiKeyMutation,
  type AdminApiKeyRow,
} from "./useAdminPlatformSecurity";
export {
  stockLocationsQueryKey,
  useCreateStockLocationMutation,
  useStockLocations,
  type CreateStockLocationInput,
  type StockLocationRow,
} from "./useStockLocations";
export {
  staffUsersQueryKey,
  useUsers,
  useUpdateStaffMutation,
  useDeleteStaffMutation,
  type StaffUser,
  type StaffUpdatePayload,
} from "./useUsers";
export {
  checkPosTransactionAllowed,
  posKeys,
  useAnalyzeCartSafetyMutation,
  useHoldPosSaleMutation,
  useIncrementBranchUsageMutation,
  useInsuranceLookupMutation,
  useInsuranceProcessMutation,
  usePosCategories,
  usePosCustomerLookupMutation,
  usePosFastMoving,
  usePosPriceCheckMutation,
  usePosProducts,
  useProcessPosReturnMutation,
  useProcessPosSaleMutation,
  useQuickAddPosEntityMutation,
  useQuickAddPosPatientMutation,
  useSaasBranches,
  useVoidPosSaleMutation,
  type PosCartItem,
  type PosCustomer,
  type PosProduct,
} from "./usePos";
export {
  inventoryKeys,
  useAddInventoryProductMutation,
  useAdjustInventoryMutation,
  useCreateInventoryCategoryMutation,
  useCreateInventorySupplierMutation,
  useDeleteInventoryProductMutation,
  useInventoryAnalytics,
  useInventoryCategories,
  useInventoryList,
  useInventorySuppliers,
  useInvalidateInventory,
  usePurchaseInventoryMutation,
  useTransferInventoryMutation,
  useUpdateInventoryProductMutation,
  type InventoryListRow,
} from "./useInventory";
export {
  billingKeys,
  pharmacyBrandingKeys,
  pharmacySettingsKeys,
  settingsApiKeysQueryKey,
  settingsSecurityKeys,
  useAddIpWhitelistMutation,
  useBillingInfo,
  useCreateSettingsApiKeyMutation,
  useCreateSettingsLocationMutation,
  useInvalidatePharmacySettingsPage,
  useIpWhitelist,
  usePharmacySettingsInfo,
  useRemoveIpWhitelistMutation,
  useSecuritySettings,
  useSetTwoFaEnabledMutation,
  useSettingsApiKeys,
  useSettingsStockLocations,
  useSetupTwoFaMutation,
  useTwoFaStatus,
  useUpdatePharmacyBrandingMutation,
  useUpdatePharmacySettingsMutation,
  useUpdateSecuritySettingsMutation,
  useUpdateSettingsApiKeyMutation,
  useUploadPharmacyLogoMutation,
  useVerifyTwoFaMutation,
} from "./usePharmacySettingsPage";
export { usePharmacyBranding, DEFAULT_PHARMACY_BRANDING } from "./usePharmacyBranding";
export {
  pharmacistDashboardKeys,
  useInvalidatePharmacistDashboard,
  usePharmacistActivities,
  usePharmacistChartData,
  usePharmacistDashboardStats,
  usePharmacistPrescriptions,
  usePharmacistStockAlerts,
  useProcessPharmacistPrescriptionMutation,
  useTrackPharmacistActivityMutation,
  type PharmacistStats,
  type PendingPrescription,
} from "./usePharmacistDashboard";
export {
  useOnboardingPlans,
  useOnboardingStatus,
  usePolarConfig,
  useSubmitOnboardingPharmacyMutation,
  useUpgradeSubscriptionMutation,
  useValidatePhoneMutation as useValidatePhoneOnboardingMutation,
} from "./useOnboarding";
export {
  useCancelScheduledChangeMutation,
  useInvalidateSubscriptionManagement,
  usePharmacySubscriptionPlan,
  usePlanLimitsQuery,
  usePolarConfigEnabled,
  useScheduleDowngradeMutation,
  useScheduledChangeQuery,
  useSubscriptionPlansCatalog,
  useSubscriptionStatusQuery,
  useValidatePhoneMutation,
} from "./useSubscriptionManagement";
export { usePaymentSuccessStatus } from "./usePaymentSuccessStatus";
export {
  salesKeys,
  useSalesAnalytics,
  useSalesList,
  type SaleRow,
} from "./useSales";
export {
  reportsKeys,
  useInvalidateReports,
  useReportsInventory,
  useReportsSales,
} from "./useReports";
export {
  prescriptionsKeys,
  useCreatePrescriptionMutation,
  usePrescriptions,
  useUpdatePrescriptionMutation,
  type PrescriptionRow,
} from "./usePrescriptions";
export {
  customersKeys,
  useCreateCustomerMutation,
  useCustomers,
  useCustomerSearch,
  type CustomerRow,
  type CustomerSearchResult,
} from "./useCustomers";
export { useLocalListSearch } from "./useLocalListSearch";
