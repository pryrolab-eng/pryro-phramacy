/** Human-readable labels for audit `table_name` values. */
export const AUDIT_TABLE_LABELS: Record<string, string> = {
  sales: "Sales",
  sale_items: "Sale items",
  inventory: "Inventory",
  customers: "Customers",
  prescriptions: "Prescriptions",
  subscriptions: "Subscriptions",
  staff: "Staff",
  branches: "Branches",
  insurance_claims: "Insurance claims",
  insurance_providers: "Insurance providers",
  cashier_shifts: "Cashier shifts",
  returns: "Returns",
  medications: "Medications",
  categories: "Categories",
  pharmacy_settings: "Settings",
  platform_settings: "Platform settings",
};

export function auditTableLabel(tableName: string | null | undefined): string {
  if (!tableName) return "Record";
  return AUDIT_TABLE_LABELS[tableName] ?? tableName.replace(/_/g, " ");
}

export function formatAuditSummary(
  action: string,
  tableName: string | null,
  newValues: unknown,
  oldValues: unknown,
): string {
  const table = auditTableLabel(tableName);
  if (action === "INSERT") return `Created ${table}`;
  if (action === "DELETE") return `Deleted ${table}`;
  if (action === "UPDATE") {
    const nv = newValues as Record<string, unknown> | null;
    const name = nv?.name ?? nv?.customer_name ?? nv?.receipt_number;
    if (name) return `Updated ${table}: ${String(name)}`;
    return `Updated ${table}`;
  }
  if (oldValues || newValues) return `${action} on ${table}`;
  return `${action} ${table}`;
}
