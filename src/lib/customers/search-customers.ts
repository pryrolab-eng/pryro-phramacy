import type { CustomerSearchRow } from "@/lib/http/customers";
import { textMatchesQuery } from "@/lib/search/match-text";

type SearchableCustomer = {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  insurance?: string | null;
  insurance_number?: string | null;
  allergies?: string | null;
  dateOfBirth?: string | null;
};

/** Phone formats commonly used in Rwanda (+250 / 078…). */
export function phoneSearchVariants(query: string): string[] {
  const digits = query.replace(/\D/g, "");
  if (digits.length < 3) return [];

  const variants = new Set<string>([query.trim()]);
  variants.add(digits);

  if (digits.startsWith("250")) {
    variants.add(`+${digits}`);
    variants.add(`0${digits.slice(3)}`);
  } else if (digits.startsWith("0")) {
    variants.add(`+250${digits.slice(1)}`);
    variants.add(digits.slice(1));
  } else {
    variants.add(`+250${digits}`);
    variants.add(`0${digits}`);
  }

  return Array.from(variants).filter(Boolean);
}

export function customerMatchesSearchQuery(
  customer: SearchableCustomer,
  query: string,
): boolean {
  const trimmed = query.trim();
  if (!trimmed) return false;

  const q = trimmed.toLowerCase();
  if (customer.name.toLowerCase().includes(q)) return true;

  const email = (customer.email ?? "").toLowerCase();
  if (email.includes(q)) return true;

  const insurance = (
    customer.insurance_number ??
    customer.insurance ??
    ""
  ).toLowerCase();
  if (insurance.includes(q)) return true;

  if (textMatchesQuery(customer.allergies, q)) return true;
  if (textMatchesQuery(customer.dateOfBirth, q)) return true;

  const phone = (customer.phone ?? "").toLowerCase();
  if (phone.includes(q)) return true;

  for (const variant of phoneSearchVariants(trimmed)) {
    if (variant !== trimmed && phone.includes(variant.toLowerCase())) {
      return true;
    }
  }

  return false;
}

export function filterCustomersForSearch(
  customers: SearchableCustomer[],
  query: string,
  limit = 5,
): CustomerSearchRow[] {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  return customers
    .filter((customer) => customerMatchesSearchQuery(customer, trimmed))
    .slice(0, limit)
    .map((customer) => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone ?? "",
      insurance_number:
        customer.insurance_number ?? customer.insurance ?? null,
    }));
}

/** Filter a full customer list for table search (no result limit). */
export function filterCustomerListRows<T extends SearchableCustomer>(
  customers: T[],
  query: string,
): T[] {
  const trimmed = query.trim();
  if (!trimmed) return customers;
  return customers.filter((customer) =>
    customerMatchesSearchQuery(customer, trimmed),
  );
}
