/**
 * HTTP layer for Route Handlers (`/api/...`).
 *
 * - UI (pages/components) must use hooks in `src/hooks/`, not fetch() here.
 * - Each domain file: types, *Keys, async getters/mutators using fetchJson from ./client.
 *
 * Migration tracker: docs/react-query-migration.md
 */

export { ApiError, ensureApiSuccess, fetchJson } from "./client";
export { domainKey, detailKey, listKey } from "./query-keys";
export * from "./admin";
export {
  getPharmacyCategoriesCatalog,
  pharmacyCategoriesCatalogQueryKey,
} from "./catalog";
export {
  createStockLocation,
  getStockLocations,
  stockLocationsQueryKey,
  type CreateStockLocationInput,
  type StockLocationRow,
} from "./settings-locations";
export {
  createInsuranceProvider,
  getInsuranceProviders,
  insuranceProvidersQueryKey,
  type CreateInsuranceProviderInput,
  type InsuranceProviderRow,
} from "./insurance";
export { createPharmacist, type CreatePharmacistInput } from "./pharmacist";
export {
  getPharmacyCategorySalesChart,
  getPharmacyDashboardStats,
  getPharmacyInventoryChart,
  getPharmacySalesChart,
  getPharmacyWeeklySalesChart,
  getRecentPosSales,
  getStockAlerts,
  pharmacyDashboardKeys,
  type CategorySalesChartPoint,
  type InventoryChartPoint,
  type PharmacyDashboardStats,
  type RecentSaleRow,
  type SalesChartPoint,
  type StockAlertRow,
  type StockAlertsResponse,
  type WeeklySalesChartPoint,
} from "./pharmacy-dashboard";
export {
  getPlatformBranding,
  platformBrandingKeys,
  type PlatformBranding,
} from "./platform-branding";
export {
  getInvoiceTemplate,
  invoiceTemplateKeys,
  updateInvoiceTemplate,
  type InvoiceTemplate,
} from "./invoice-template";
export {
  complete2FASession,
  sendRecoveryEmail,
  verify2FACode,
  type RecoveryEmailInput,
} from "./auth";
export {
  getRealtimeUpdates,
  realtimeKeys,
  type RealtimeUpdate,
} from "./realtime";
export {
  deleteStaffMember,
  getStaffUsers,
  staffUsersQueryKey,
  updateStaffMember,
  type StaffUpdatePayload,
  type StaffUser,
} from "./staff";
export {
  createCustomer,
  customersKeys,
  getCustomers,
  searchCustomers,
  type CreateCustomerInput,
  type CustomerRow,
  type CustomerSearchRow,
} from "./customers";
export {
  getSalesAnalytics,
  getSalesList,
  salesKeys,
  type SaleRow,
  type SalesAnalytics,
} from "./sales";
export {
  getReportsInventory,
  getReportsSales,
  reportsKeys,
  type ReportsSalesData,
} from "./reports";
export {
  createPrescription,
  getPrescriptions,
  prescriptionsKeys,
  updatePrescription,
  type PrescriptionRow,
} from "./prescriptions";
export {
  analyzeCartSafety,
  checkPosPrice,
  getPosFastMovingProducts,
  getPosProducts,
  holdPosSale,
  lookupPosCustomerByPhone,
  posKeys,
  processPosReturn,
  processPosSale,
  quickAddPosEntity,
  quickAddPosPatient,
  voidPosSale,
  type PosCartItem,
  type PosCustomer,
  type PosProduct,
  type PosSalePayload,
} from "./pos";
export {
  checkBranchTransactionAllowed,
  createSaasBranch,
  getSaasBranches,
  incrementBranchTransactionCount,
  saasBranchesKeys,
  type CreateSaasBranchInput,
  type SaasBranchesResponse,
  type UsageCheckResponse,
} from "./saas-branches";
export {
  cancelSaasSubscription,
  createSaasPlan,
  generateSaasInvoice,
  getAdminSaasSubscriptions,
  getSaasInvoices,
  getSaasPlans,
  getSaasSubscriptionSummary,
  saasKeys,
  subscribeToSaasPlan,
  updateSaasPlan,
  type SubscribeToSaasPlanInput,
} from "./saas";
export {
  addInventoryProduct,
  adjustInventoryStock,
  createInventorySupplier,
  deleteInventoryProduct,
  getInventoryAnalytics,
  getInventoryList,
  getInventorySuppliers,
  inventoryKeys,
  purchaseInventoryStock,
  transferInventoryStock,
  updateInventoryProduct,
  type AddInventoryProductInput,
  type InventoryAnalytics,
  type InventoryListRow,
  type InventorySupplier,
} from "./inventory";
export { createPharmacyCategory } from "./catalog";
export {
  getBillingInfo,
  billingKeys,
  type BillingInfoResponse,
  type BillingInvoiceRow,
} from "./billing";
export {
  getPharmacyBranding,
  pharmacyBrandingKeys,
  updatePharmacyBranding,
  uploadPharmacyLogo,
  type PharmacyBranding,
} from "./pharmacy-branding";
export {
  getPharmacySettings,
  pharmacySettingsKeys,
  updatePharmacySettings,
  type PharmacySettings,
  type UpdatePharmacySettingsInput,
} from "./pharmacy-settings";
export {
  createSettingsApiKey,
  getSettingsApiKeys,
  settingsApiKeysQueryKey,
  updateSettingsApiKey,
  type SettingsApiKeyRow,
} from "./settings-api-keys";
export {
  addIpWhitelistEntry,
  getIpWhitelist,
  getSecuritySettings,
  getTwoFaStatus,
  removeIpWhitelistEntry,
  setTwoFaEnabled,
  settingsSecurityKeys,
  setupTwoFa,
  updateSecuritySettings,
  verifyTwoFaToken,
  type IpWhitelistEntry,
  type SecuritySettings,
} from "./settings-security";
export { getSubscriptionPlans, plansKeys, type PlanRow } from "./plans";
export {
  entitlementsKeys,
  getPharmacyEntitlementsSnapshot,
} from "./entitlements";
export {
  getOnboardingStatus,
  onboardingKeys,
  submitOnboardingPharmacy,
  type OnboardingPharmacyInput,
  type OnboardingStatusResponse,
} from "./onboarding";
export { getPolarConfig, getPolarCheckoutStatus, polarKeys } from "./polar";
export { validatePhoneNumber, type PhoneValidationResult } from "./validation";
export {
  cancelScheduledChange,
  createPendingBranchAddon,
  createPendingSubscription,
  getPlanLimits,
  getScheduledChange,
  getSubscriptionStatus,
  scheduleSubscriptionDowngrade,
  startPolarSubscriptionCheckout,
  subscriptionKeys,
  upgradeSubscription,
  type PaidCheckoutContext,
  type ScheduledChangeResponse,
} from "./subscription";
export {
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
} from "./pharmacist-dashboard";
