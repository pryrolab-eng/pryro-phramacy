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
    name: string;
    phone: string;
    lastPurchase: string | null;
    totalSpent: number;
  }>
> {
  return lookupPosCustomersByPhoneFromDb({ pharmacyId, phone });
}
