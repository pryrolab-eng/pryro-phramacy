import type { CustomerDbRow } from "@/lib/customers/format-customer";
import {
  createCustomerFromDb,
  deleteCustomerFromDb,
  findCustomerForPharmacy,
  listCustomersForPharmacy,
  lookupPosCustomersByPhoneFromDb,
  searchCustomersForPharmacy,
  updateCustomerFromDb,
  type CustomerCreateInput,
  type CustomerUpdateInput,
} from "@/lib/db/customers";

export async function storeListCustomers(
  pharmacyId: string,
): Promise<CustomerDbRow[]> {
  return listCustomersForPharmacy(pharmacyId);
}

export async function storeSearchCustomers(
  input: { pharmacyId: string; query: string; limit?: number },
): Promise<
  Array<{ id: string; name: string; phone: string | null; insurance_number: string | null }>
> {
  return searchCustomersForPharmacy(input);
}

export async function storeFindCustomer(
  pharmacyId: string,
  customerId: string,
): Promise<CustomerDbRow | null> {
  return findCustomerForPharmacy(pharmacyId, customerId);
}

export async function storeCreateCustomer(
  input: CustomerCreateInput,
): Promise<CustomerDbRow> {
  return createCustomerFromDb(input);
}

export async function storeUpdateCustomer(
  input: {
    pharmacyId: string;
    customerId: string;
    updates: CustomerUpdateInput;
  },
): Promise<CustomerDbRow | null> {
  return updateCustomerFromDb(input);
}

export async function storeDeleteCustomer(
  input: { pharmacyId: string; customerId: string },
): Promise<boolean> {
  return deleteCustomerFromDb(input);
}

export async function storeLookupPosCustomersByPhone(
  pharmacyId: string,
  phone: string,
): Promise<
  Array<{
    id: string | null;
    name: string;
    phone: string;
    lastPurchase: string | null;
    totalSpent: number;
  }>
> {
  return lookupPosCustomersByPhoneFromDb({ pharmacyId, phone });
}

export async function storeBatchImportCustomers(input: {
  pharmacyId: string;
  rows: Array<{
    name: string;
    phone: string;
    email?: string;
    dateOfBirth?: string;
    allergies?: string;
    insurance?: string;
  }>;
}): Promise<{
  attempted: number;
  succeeded: number;
  failures: Array<{ rowNumber: number; label: string; error: string }>;
}> {
  const failures: Array<{ rowNumber: number; label: string; error: string }> =
    [];
  let succeeded = 0;

  for (let index = 0; index < input.rows.length; index += 1) {
    const row = input.rows[index]!;
    try {
      await storeCreateCustomer({
        pharmacyId: input.pharmacyId,
        name: row.name,
        phone: row.phone,
        email: row.email,
        dateOfBirth: row.dateOfBirth || null,
        allergies: row.allergies
          ? row.allergies.split(/[,;]/).map((s) => s.trim()).filter(Boolean)
          : [],
        insuranceNumber: row.insurance,
      });
      succeeded += 1;
    } catch (error) {
      failures.push({
        rowNumber: index + 2,
        label: row.name || "Unnamed customer",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return {
    attempted: input.rows.length,
    succeeded,
    failures,
  };
}
