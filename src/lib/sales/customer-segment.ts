import { phoneSearchVariants } from "@/lib/customers/search-customers";

export type CustomerSegment = "walkIn" | "regular" | "insurance";

export type RegisteredCustomerRef = {
  name: string;
  phone: string | null;
};

const WALK_IN_NAME_LABELS = new Set([
  "walk-in customer",
  "walk-in",
  "walk in customer",
  "walk in",
  "walkin",
  "walkin customer",
]);

function normalizeName(name: string) {
  return name.trim().toLowerCase();
}

function normalizePhone(phone: string) {
  return phone.trim();
}

export function buildRegisteredCustomerIndex(customers: RegisteredCustomerRef[]) {
  const byPhone = new Set<string>();
  const byName = new Set<string>();

  for (const customer of customers) {
    const name = customer.name?.trim();
    if (name) {
      byName.add(normalizeName(name));
    }
    const phone = customer.phone?.trim();
    if (phone) {
      byPhone.add(normalizePhone(phone));
      for (const variant of phoneSearchVariants(phone)) {
        byPhone.add(normalizePhone(variant));
      }
    }
  }

  return { byPhone, byName };
}

export function isWalkInCustomerLabel(name: string | null | undefined): boolean {
  if (!name?.trim()) return true;
  return WALK_IN_NAME_LABELS.has(normalizeName(name));
}

export function matchesRegisteredCustomer(
  index: ReturnType<typeof buildRegisteredCustomerIndex>,
  name: string | null | undefined,
  phone: string | null | undefined,
): boolean {
  const trimmedPhone = phone?.trim();
  if (trimmedPhone) {
    if (index.byPhone.has(normalizePhone(trimmedPhone))) return true;
    for (const variant of phoneSearchVariants(trimmedPhone)) {
      if (index.byPhone.has(normalizePhone(variant))) return true;
    }
  }

  const trimmedName = name?.trim();
  if (trimmedName && !isWalkInCustomerLabel(trimmedName)) {
    if (index.byName.has(normalizeName(trimmedName))) return true;
  }

  return false;
}

export function classifySaleCustomerSegment(
  sale: {
    customer_id?: string | null;
    customer_name: string | null;
    customer_phone: string | null;
    insurance_provider_id: string | null;
  },
  registeredIndex: ReturnType<typeof buildRegisteredCustomerIndex>,
): CustomerSegment {
  if (sale.insurance_provider_id) {
    return "insurance";
  }

  if (sale.customer_id) {
    return "regular";
  }

  if (
    matchesRegisteredCustomer(
      registeredIndex,
      sale.customer_name,
      sale.customer_phone,
    )
  ) {
    return "regular";
  }

  return "walkIn";
}
