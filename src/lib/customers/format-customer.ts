/** Map DB customer row to API / UI shape. */

export type CustomerDbRow = {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  date_of_birth?: string | null;
  allergies?: string[] | null;
  insurance_number?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
};

export function parseAllergiesInput(value?: string): string[] {
  if (!value?.trim()) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function formatAllergiesDisplay(allergies?: string[] | null): string {
  if (!allergies?.length) return "";
  return allergies.join(", ");
}

export function formatCustomerRow(
  c: CustomerDbRow,
  options?: { totalPurchases?: number },
) {
  return {
    id: c.id,
    name: c.name,
    phone: c.phone ?? "",
    email: c.email ?? "",
    dateOfBirth: c.date_of_birth ?? "",
    allergies: formatAllergiesDisplay(c.allergies) || "None",
    insurance: c.insurance_number ?? "",
    insurance_number: c.insurance_number ?? null,
    totalPurchases: options?.totalPurchases ?? 0,
    lastVisit: c.created_at?.split("T")[0] ?? "",
    status: c.is_active === false ? ("inactive" as const) : ("active" as const),
  };
}
