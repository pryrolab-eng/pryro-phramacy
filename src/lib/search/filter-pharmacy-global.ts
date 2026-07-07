import { filterCustomersForSearch } from "@/lib/customers/search-customers";
import type { CustomerRow } from "@/lib/http/customers";
import type { InventoryListRow } from "@/lib/http/inventory";
import type { PrescriptionRow } from "@/lib/http/prescriptions";
import type { SaleRow } from "@/lib/http/sales";
import type { StaffUser } from "@/lib/http/staff";
import type { SaasBranchWithUsage } from "@/lib/http/saas-branches";
import { MIN_GLOBAL_SEARCH_LENGTH } from "@/lib/search/escape-ilike";
import { fieldsMatchQuery, textMatchesQuery } from "@/lib/search/match-text";
import type { PharmacyGlobalSearchResult } from "@/lib/search/types";

const EMPTY: PharmacyGlobalSearchResult = {
  customers: [],
  products: [],
  prescriptions: [],
  sales: [],
  staff: [],
  branches: [],
};

const HIT_LIMIT = 6;

export function filterPharmacyGlobalSearch(input: {
  query: string;
  customers?: CustomerRow[];
  inventory?: InventoryListRow[];
  prescriptions?: PrescriptionRow[];
  sales?: SaleRow[];
  staff?: StaffUser[];
  branches?: SaasBranchWithUsage[];
}): PharmacyGlobalSearchResult {
  const q = input.query.trim();
  if (q.length < MIN_GLOBAL_SEARCH_LENGTH) return EMPTY;

  const customers = input.customers
    ? filterCustomersForSearch(input.customers, q, HIT_LIMIT).map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
      }))
    : [];

  const products = (input.inventory ?? [])
    .filter(
      (item) =>
        textMatchesQuery(item.name, q) ||
        textMatchesQuery(item.category, q) ||
        textMatchesQuery(item.batchNumber, q),
    )
    .slice(0, HIT_LIMIT)
    .map((item) => ({
      id: item.id,
      medicationId: item.medicationId ?? item.id,
      name: item.name,
      category: item.category,
    }));

  const prescriptions = (input.prescriptions ?? [])
    .filter(
      (p) =>
        textMatchesQuery(p.patient, q) ||
        textMatchesQuery(p.doctor, q) ||
        p.medications.some((m) => textMatchesQuery(m, q)),
    )
    .slice(0, HIT_LIMIT)
    .map((p) => ({
      id: p.id,
      patient: p.patient,
      doctor: p.doctor,
      status: p.status,
    }));

  const sales = (input.sales ?? [])
    .filter(
      (s) =>
        textMatchesQuery(s.customer, q) ||
        textMatchesQuery(s.paymentMethod, q) ||
        textMatchesQuery(s.date, q) ||
        String(s.amount).includes(q),
    )
    .slice(0, HIT_LIMIT)
    .map((s) => ({
      id: s.id,
      receiptNumber: "",
      customerName: s.customer,
      totalAmount: s.amount,
    }));

  const staff = (input.staff ?? [])
    .filter((s) =>
      fieldsMatchQuery([s.name, s.email, s.role, s.phone], q),
    )
    .slice(0, HIT_LIMIT)
    .map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      role: s.role,
    }));

  const branches = (input.branches ?? [])
    .filter((b) => fieldsMatchQuery([b.name, b.address], q))
    .slice(0, HIT_LIMIT)
    .map((b) => ({
      id: b.id,
      name: b.name,
      city: b.address,
      status: b.is_active ? "active" : "inactive",
    }));

  return { customers, products, prescriptions, sales, staff, branches };
}
