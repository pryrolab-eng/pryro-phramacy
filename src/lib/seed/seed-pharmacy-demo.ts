import { prisma } from "@/lib/db/prisma";
import { storeCreateCustomer } from "@/lib/db/customers-store";
import { storeAddMedicationInventory } from "@/lib/db/inventory-store";
import { createInsuranceProviderFromDb } from "@/lib/db/insurance";
import {
  DEMO_CUSTOMERS,
  DEMO_INSURANCE_PROVIDER,
  DEMO_INVENTORY_PRODUCTS,
} from "@/lib/seed/demo-datasets";

export type SeedPharmacyDemoResult = {
  pharmacyId: string;
  branchId: string;
  inventory: { created: number; skipped: number };
  customers: { created: number; skipped: number };
  insuranceProvider: { created: boolean; id?: string; name: string };
};

async function resolveBranchId(pharmacyId: string): Promise<string> {
  const hq = await prisma.branches.findFirst({
    where: {
      pharmacy_id: pharmacyId,
      OR: [{ is_headquarters: true }, { is_main_branch: true }],
      is_active: { not: false },
    },
    orderBy: { created_at: "asc" },
    select: { id: true },
  });
  if (hq) return hq.id;

  const anyBranch = await prisma.branches.findFirst({
    where: { pharmacy_id: pharmacyId, is_active: { not: false } },
    orderBy: { created_at: "asc" },
    select: { id: true },
  });
  if (!anyBranch) {
    throw new Error("Pharmacy has no branch — complete onboarding first");
  }
  return anyBranch.id;
}

async function medicationExists(pharmacyId: string, name: string): Promise<boolean> {
  const row = await prisma.medications.findFirst({
    where: {
      pharmacy_id: pharmacyId,
      name: { equals: name.trim(), mode: "insensitive" },
    },
    select: { id: true },
  });
  return Boolean(row);
}

async function customerExists(pharmacyId: string, phone: string): Promise<boolean> {
  const row = await prisma.customers.findFirst({
    where: {
      pharmacy_id: pharmacyId,
      phone: { equals: phone.trim(), mode: "insensitive" },
    },
    select: { id: true },
  });
  return Boolean(row);
}

export async function seedPharmacyDemo(
  pharmacyId: string,
): Promise<SeedPharmacyDemoResult> {
  const branchId = await resolveBranchId(pharmacyId);

  let inventoryCreated = 0;
  let inventorySkipped = 0;

  for (const product of DEMO_INVENTORY_PRODUCTS) {
    if (await medicationExists(pharmacyId, product.name)) {
      inventorySkipped += 1;
      continue;
    }

    await storeAddMedicationInventory({
      pharmacyId,
      branchId,
      name: product.name,
      category: product.category,
      quantity: product.stock,
      batch_number: product.batchNumber,
      unit_cost: Math.round(product.price * 0.7),
      selling_price: product.price,
      minimum_stock_level: product.minStock,
      expiry_date: product.expiryDate,
    });
    inventoryCreated += 1;
  }

  let customersCreated = 0;
  let customersSkipped = 0;

  for (const customer of DEMO_CUSTOMERS) {
    if (await customerExists(pharmacyId, customer.phone)) {
      customersSkipped += 1;
      continue;
    }

    await storeCreateCustomer({
      pharmacyId,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      dateOfBirth: customer.dateOfBirth,
      allergies: customer.allergies
        ? customer.allergies.split(/[,;]/).map((s) => s.trim()).filter(Boolean)
        : [],
      insuranceNumber: customer.insuranceNumber,
    });
    customersCreated += 1;
  }

  const existingProvider = await prisma.insurance_providers.findFirst({
    where: {
      pharmacy_id: pharmacyId,
      name: { equals: DEMO_INSURANCE_PROVIDER.name, mode: "insensitive" },
    },
    select: { id: true, name: true },
  });

  let insuranceProvider: SeedPharmacyDemoResult["insuranceProvider"];
  if (existingProvider) {
    insuranceProvider = {
      created: false,
      id: existingProvider.id,
      name: existingProvider.name,
    };
  } else {
    const provider = await createInsuranceProviderFromDb({
      pharmacyId,
      name: DEMO_INSURANCE_PROVIDER.name,
      coveragePercentage: DEMO_INSURANCE_PROVIDER.coveragePercentage,
      contactEmail: DEMO_INSURANCE_PROVIDER.contactEmail,
      contactPhone: DEMO_INSURANCE_PROVIDER.contactPhone,
      policyNumber: DEMO_INSURANCE_PROVIDER.policyNumber,
    });
    insuranceProvider = {
      created: true,
      id: provider.id,
      name: provider.name,
    };
  }

  return {
    pharmacyId,
    branchId,
    inventory: { created: inventoryCreated, skipped: inventorySkipped },
    customers: { created: customersCreated, skipped: customersSkipped },
    insuranceProvider,
  };
}
