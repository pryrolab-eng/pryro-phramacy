/**
 * Canonical pharmacy tenant URLs and legacy redirects.
 * Single source of truth for nav, grace routes, next.config, and DB nav_routes updates.
 */

export const PHARMACY_ROUTES = {
  root: "/pharmacy",
  dashboard: "/pharmacy/dashboard",
  pharmacist: "/pharmacy/pharmacist",
  billing: "/pharmacy/billing",
  branches: "/pharmacy/branches",
  staff: "/pharmacy/staff",
  inventory: "/pharmacy/inventory",
  pos: "/pharmacy/pos",
  sales: "/pharmacy/sales",
  customers: "/pharmacy/customers",
  patients: "/pharmacy/patients",
  prescriptions: "/pharmacy/prescriptions",
  reports: "/pharmacy/reports",
  activity: "/pharmacy/activity",
  settings: "/pharmacy/settings",
  staffDashboard: "/pharmacy/staff-dashboard",
  staffSettings: "/pharmacy/staff-settings",
  helpInsurance: "/pharmacy/help/insurance",
  insuranceMedicines: "/pharmacy/insurance/medicines",
  importData: "/pharmacy/import-data",
  helpGettingStarted: "/pharmacy/help/getting-started",
  ai: "/pharmacy/ai",
} as const;

export type PharmacyRouteKey = keyof typeof PHARMACY_ROUTES;

/** Insurer coverage lives under Inventory → Insurance tab (not a top-level nav item). */
export function inventoryInsuranceHref(options?: { import?: boolean }): string {
  const params = new URLSearchParams({ tab: "insurance" });
  if (options?.import) params.set("import", "1");
  return `${PHARMACY_ROUTES.inventory}?${params.toString()}`;
}

/** @deprecated Use inventoryInsuranceHref — kept for redirects and bookmarks. */
export const INSURANCE_COVERAGE_LEGACY_PATH = PHARMACY_ROUTES.insuranceMedicines;

/** Routes always reachable when subscription is inactive (homes + billing). */
export const PHARMACY_GRACE_ROUTES = [
  PHARMACY_ROUTES.dashboard,
  PHARMACY_ROUTES.pharmacist,
  PHARMACY_ROUTES.staffDashboard,
  PHARMACY_ROUTES.staffSettings,
  PHARMACY_ROUTES.pos,
  PHARMACY_ROUTES.billing,
] as const;

export const LEGACY_PHARMACY_REDIRECTS: ReadonlyArray<{
  source: string;
  destination: string;
  permanent: boolean;
}> = [
  { source: "/pharmacy-dashboard", destination: PHARMACY_ROUTES.dashboard, permanent: true },
  {
    source: "/pharmacy-dashboard/billing",
    destination: PHARMACY_ROUTES.billing,
    permanent: true,
  },
  {
    source: "/pharmacist-dashboard",
    destination: PHARMACY_ROUTES.pharmacist,
    permanent: true,
  },
  { source: "/inventory", destination: PHARMACY_ROUTES.inventory, permanent: true },
  { source: "/pos", destination: PHARMACY_ROUTES.pos, permanent: true },
  { source: "/sales", destination: PHARMACY_ROUTES.sales, permanent: true },
  { source: "/customers", destination: PHARMACY_ROUTES.customers, permanent: true },
  { source: "/patients", destination: PHARMACY_ROUTES.patients, permanent: true },
  {
    source: "/prescriptions",
    destination: PHARMACY_ROUTES.prescriptions,
    permanent: true,
  },
  { source: "/reports", destination: PHARMACY_ROUTES.reports, permanent: true },
  { source: "/activity", destination: PHARMACY_ROUTES.activity, permanent: true },
  { source: "/settings", destination: PHARMACY_ROUTES.settings, permanent: true },
  { source: "/branches", destination: PHARMACY_ROUTES.branches, permanent: true },
  { source: "/staff", destination: PHARMACY_ROUTES.staff, permanent: true },
  {
    source: "/pharmacy/insurance/medicines",
    destination: "/pharmacy/inventory?tab=insurance",
    permanent: false,
  },
  {
    source: "/pharmacy/insurance/formulary",
    destination: "/pharmacy/inventory?tab=insurance&import=1",
    permanent: false,
  },
  { source: "/superadmin", destination: "/admin", permanent: true },
  { source: "/superadmin/:path*", destination: "/admin/:path*", permanent: true },
];
