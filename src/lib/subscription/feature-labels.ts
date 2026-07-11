/** Fallback labels when catalog is unavailable (e.g. loading). */
export const FALLBACK_FEATURE_LABELS: Record<string, string> = {
  "app.dashboard": "Dashboard",
  "pos.access": "Point of Sale",
  "pos.hold": "POS hold orders",
  "pos.void": "POS void sales",
  "pos.returns": "POS returns",
  "pos.insurance": "Insurance billing",
  "inventory.access": "Inventory",
  "inventory.analytics": "Inventory analytics",
  "customers.access": "Customers",
  "patients.access": "Patients",
  "prescriptions.access": "Prescriptions",
  "sales.view": "Sales",
  "reports.view": "Reports",
  "branches.access": "Branches",
  "branches.create": "Create branches",
  "staff.access": "Staff",
  "staff.invite": "Staff invitations",
  "settings.access": "Settings",
  "billing.self_serve": "Billing & plans",
  "ai.safety": "AI drug safety",
  "ai.chat": "AI Assistant chat",
  customization: "Customization",
  "limit.users": "User limit",
  "limit.branches": "Branch limit",
  "limit.transactions_per_branch": "Transaction limit",
};

export function getFeatureLabel(
  featureKey: string,
  catalogLabels?: Record<string, string>,
): string {
  if (catalogLabels?.[featureKey]) return catalogLabels[featureKey];
  if (FALLBACK_FEATURE_LABELS[featureKey]) return FALLBACK_FEATURE_LABELS[featureKey];
  return featureKey
    .split(".")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).replace(/_/g, " "))
    .join(" · ");
}
