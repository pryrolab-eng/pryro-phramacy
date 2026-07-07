import { prisma } from "@/lib/db/prisma";
import type { CustomerDbRow } from "@/lib/customers/format-customer";
import { phoneSearchVariants } from "@/lib/customers/search-customers";

export type CustomerCreateInput = {
  pharmacyId: string;
  name: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string | null;
  allergies?: string[];
  insuranceNumber?: string;
};

export type CustomerUpdateInput = {
  name?: string;
  phone?: string;
  email?: string | null;
  dateOfBirth?: string | null;
  allergies?: string[];
  insuranceNumber?: string | null;
  isActive?: boolean;
};

function mapCustomerRow(row: {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  date_of_birth: Date | null;
  allergies: string[];
  insurance_number: string | null;
  is_active: boolean | null;
  created_at: Date | null;
}): CustomerDbRow {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    date_of_birth: row.date_of_birth?.toISOString().slice(0, 10) ?? null,
    allergies: row.allergies,
    insurance_number: row.insurance_number,
    is_active: row.is_active,
    created_at: row.created_at?.toISOString() ?? null,
  };
}

export async function listCustomersForPharmacy(
  pharmacyId: string,
): Promise<CustomerDbRow[]> {
  const rows = await prisma.customers.findMany({
    where: { pharmacy_id: pharmacyId },
    orderBy: { created_at: "desc" },
  });
  return rows.map(mapCustomerRow);
}

function buildCustomerSearchConditions(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const conditions: Array<{
    name?: { contains: string; mode: "insensitive" };
    phone?: { contains: string; mode: "insensitive" };
    email?: { contains: string; mode: "insensitive" };
    insurance_number?: { contains: string; mode: "insensitive" };
  }> = [
    { name: { contains: trimmed, mode: "insensitive" } },
    { phone: { contains: trimmed, mode: "insensitive" } },
    { email: { contains: trimmed, mode: "insensitive" } },
    { insurance_number: { contains: trimmed, mode: "insensitive" } },
  ];

  for (const variant of phoneSearchVariants(trimmed)) {
    if (variant !== trimmed) {
      conditions.push({ phone: { contains: variant, mode: "insensitive" } });
    }
  }

  return conditions;
}

export async function searchCustomersForPharmacy(input: {
  pharmacyId: string;
  query: string;
  limit?: number;
}): Promise<
  Array<{ id: string; name: string; phone: string | null; insurance_number: string | null }>
> {
  const conditions = buildCustomerSearchConditions(input.query);
  if (conditions.length === 0) return [];

  const rows = await prisma.customers.findMany({
    where: {
      pharmacy_id: input.pharmacyId,
      OR: conditions,
    },
    take: input.limit ?? 5,
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      phone: true,
      insurance_number: true,
    },
  });
  return rows;
}

export async function findCustomerForPharmacy(
  pharmacyId: string,
  customerId: string,
): Promise<CustomerDbRow | null> {
  const row = await prisma.customers.findFirst({
    where: { id: customerId, pharmacy_id: pharmacyId },
  });
  return row ? mapCustomerRow(row) : null;
}

export async function createCustomerFromDb(
  input: CustomerCreateInput,
): Promise<CustomerDbRow> {
  const row = await prisma.customers.create({
    data: {
      pharmacy_id: input.pharmacyId,
      name: input.name,
      phone: input.phone || null,
      email: input.email || null,
      date_of_birth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
      allergies: input.allergies ?? [],
      insurance_number: input.insuranceNumber || null,
      is_active: true,
    },
  });
  return mapCustomerRow(row);
}

export async function updateCustomerFromDb(input: {
  pharmacyId: string;
  customerId: string;
  updates: CustomerUpdateInput;
}): Promise<CustomerDbRow | null> {
  const existing = await prisma.customers.findFirst({
    where: { id: input.customerId, pharmacy_id: input.pharmacyId },
  });
  if (!existing) return null;

  const row = await prisma.customers.update({
    where: { id: input.customerId },
    data: {
      ...(input.updates.name !== undefined ? { name: input.updates.name } : {}),
      ...(input.updates.phone !== undefined ? { phone: input.updates.phone } : {}),
      ...(input.updates.email !== undefined ? { email: input.updates.email } : {}),
      ...(input.updates.dateOfBirth !== undefined
        ? {
            date_of_birth: input.updates.dateOfBirth
              ? new Date(input.updates.dateOfBirth)
              : null,
          }
        : {}),
      ...(input.updates.allergies !== undefined
        ? { allergies: input.updates.allergies }
        : {}),
      ...(input.updates.insuranceNumber !== undefined
        ? { insurance_number: input.updates.insuranceNumber }
        : {}),
      ...(input.updates.isActive !== undefined
        ? { is_active: input.updates.isActive }
        : {}),
      updated_at: new Date(),
    },
  });

  return mapCustomerRow(row);
}

export async function deleteCustomerFromDb(input: {
  pharmacyId: string;
  customerId: string;
}): Promise<boolean> {
  const result = await prisma.customers.deleteMany({
    where: { id: input.customerId, pharmacy_id: input.pharmacyId },
  });
  return result.count > 0;
}

export async function fetchPharmacySaleTotalsFromDb(pharmacyId: string) {
  return prisma.sales.findMany({
    where: { pharmacy_id: pharmacyId },
    select: {
      total_amount: true,
      customer_phone: true,
      customer_name: true,
    },
  });
}

export async function lookupPosCustomersByPhoneFromDb(input: {
  pharmacyId: string;
  phone: string;
  limit?: number;
}): Promise<
  Array<{
    id: string | null;
    name: string;
    phone: string;
    lastPurchase: string | null;
    totalSpent: number;
  }>
> {
  const phone = input.phone.trim();
  if (!phone) return [];

  const customers = await prisma.customers.findMany({
    where: {
      pharmacy_id: input.pharmacyId,
      phone: { contains: phone, mode: "insensitive" },
      is_active: { not: false },
    },
    take: input.limit ?? 5,
    select: { id: true, name: true, phone: true },
  });

  const sales = await prisma.sales.findMany({
    where: {
      pharmacy_id: input.pharmacyId,
      customer_phone: { contains: phone, mode: "insensitive" },
    },
    select: {
      customer_name: true,
      customer_phone: true,
      total_amount: true,
      created_at: true,
    },
    orderBy: { created_at: "desc" },
    take: 50,
  });

  const byPhone = new Map<
    string,
    {
      id: string | null;
      name: string;
      phone: string;
      lastPurchase: string | null;
      totalSpent: number;
    }
  >();

  for (const customer of customers) {
    const key = (customer.phone ?? "").trim();
    if (!key) continue;
    byPhone.set(key, {
      id: customer.id,
      name: customer.name,
      phone: key,
      lastPurchase: null,
      totalSpent: 0,
    });
  }

  for (const sale of sales) {
    const key = (sale.customer_phone ?? "").trim();
    if (!key) continue;
    const existing = byPhone.get(key) ?? {
      id: null,
      name: sale.customer_name ?? "Walk-in",
      phone: key,
      lastPurchase: null,
      totalSpent: 0,
    };
    existing.totalSpent += Number(sale.total_amount ?? 0);
    if (!existing.lastPurchase && sale.created_at) {
      existing.lastPurchase = sale.created_at.toISOString().slice(0, 10);
    }
    byPhone.set(key, existing);
  }

  return Array.from(byPhone.values());
}

export async function fetchRecentSalesForCustomerFromDb(input: {
  pharmacyId: string;
  name: string;
  phone: string | null;
  limit?: number;
}) {
  const rows = await prisma.sales.findMany({
    where: {
      pharmacy_id: input.pharmacyId,
      ...(input.phone?.trim()
        ? { customer_phone: input.phone.trim() }
        : { customer_name: input.name }),
    },
    orderBy: { created_at: "desc" },
    take: input.limit ?? 20,
    select: {
      id: true,
      total_amount: true,
      customer_name: true,
      customer_phone: true,
      created_at: true,
      receipt_number: true,
      payment_method: true,
    },
  });

  return rows.map((s) => ({
    id: s.id,
    receiptNumber: s.receipt_number,
    totalAmount: Number(s.total_amount ?? 0),
    paymentMethod: s.payment_method,
    createdAt: s.created_at?.toISOString() ?? null,
  }));
}
