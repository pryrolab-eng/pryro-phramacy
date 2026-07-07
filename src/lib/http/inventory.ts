import { ensureApiSuccess, fetchJson } from "./client";

export type InventoryListRow = {
  id: string;
  medicationId?: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  price: number;
  expiryDate: string;
  batchNumber: string;
  stockLocationId?: string | null;
  stockLocationName?: string | null;
  pharmacy_id?: string;
  medications?: unknown;
};

export type InventoryAnalytics = {
  stockByCategory: Array<{ category: string; stock: number; value: number }>;
  inventoryTrend: Array<{ month: string; stock: number }>;
};

export type InventorySupplier = {
  id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
};

export type ApiSuccessResult = {
  success: boolean;
  error?: string;
  newStock?: number;
  medicationId?: string;
};

export type AddInventoryProductInput = {
  name: string;
  category: string;
  batch_number: string;
  quantity: number;
  unit_cost: number;
  selling_price: number;
  minimum_stock_level: number;
  expiry_date: string;
  stockLocation?: string;
};

export type UpdateInventoryProductInput = {
  quantity: number;
  selling_price: number;
  minimum_stock_level: number;
};

export const inventoryKeys = {
  all: ["inventory"] as const,
  list: () => [...inventoryKeys.all, "list"] as const,
  analytics: () => [...inventoryKeys.all, "analytics"] as const,
  suppliers: () => [...inventoryKeys.all, "suppliers"] as const,
};

const EMPTY_ANALYTICS: InventoryAnalytics = {
  stockByCategory: [],
  inventoryTrend: [],
};

export async function getInventoryList(): Promise<InventoryListRow[]> {
  try {
    const data = await fetchJson<InventoryListRow[]>("/api/inventory");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function getInventoryAnalytics(): Promise<InventoryAnalytics> {
  try {
    return await fetchJson<InventoryAnalytics>("/api/inventory/analytics");
  } catch {
    return EMPTY_ANALYTICS;
  }
}

export async function getInventorySuppliers(): Promise<InventorySupplier[]> {
  try {
    const data = await fetchJson<InventorySupplier[]>("/api/inventory/suppliers");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function createInventorySupplier(body: {
  name: string;
  contact: string;
  phone: string;
  email: string;
}): Promise<ApiSuccessResult> {
  const data = await fetchJson<ApiSuccessResult>("/api/inventory/suppliers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  ensureApiSuccess(data, "Failed to add supplier");
  return data;
}

export async function addInventoryProduct(
  body: AddInventoryProductInput,
): Promise<ApiSuccessResult> {
  const data = await fetchJson<ApiSuccessResult>("/api/inventory/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  ensureApiSuccess(data, "Failed to add product");
  return data;
}

export type InventoryImportFailure = {
  rowNumber: number;
  label: string;
  error: string;
};

export type InventoryImportResult = {
  success: boolean;
  attempted: number;
  succeeded: number;
  failures: InventoryImportFailure[];
  error?: string;
};

export async function importInventoryProducts(
  rows: AddInventoryProductInput[],
): Promise<InventoryImportResult> {
  return fetchJson<InventoryImportResult>("/api/inventory/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows }),
  });
}

export async function adjustInventoryStock(body: {
  productId: string;
  quantity: number;
  reason: string;
  adjustmentType: string;
}): Promise<ApiSuccessResult> {
  const data = await fetchJson<ApiSuccessResult>("/api/inventory/adjustment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  ensureApiSuccess(data, "Failed to adjust stock");
  return data;
}

export async function purchaseInventoryStock(body: {
  productId: string;
  quantity: number;
  costPrice: number;
  supplier: string;
}): Promise<ApiSuccessResult> {
  const data = await fetchJson<ApiSuccessResult>("/api/inventory/purchase", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  ensureApiSuccess(data, "Failed to purchase stock");
  return data;
}

export async function transferInventoryStock(body: {
  productId: string;
  product?: string;
  quantity: number;
  fromBranchId: string;
  toBranchId: string;
}): Promise<ApiSuccessResult & { newStock?: number; destinationStock?: number }> {
  const data = await fetchJson<ApiSuccessResult>("/api/inventory/transfers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: body.productId,
      quantity: body.quantity,
      fromBranchId: body.fromBranchId,
      toBranchId: body.toBranchId,
    }),
  });
  ensureApiSuccess(data, "Failed to transfer stock");
  return data;
}

export async function deleteInventoryProduct(id: string): Promise<ApiSuccessResult> {
  const data = await fetchJson<ApiSuccessResult>(`/api/inventory/${id}`, {
    method: "DELETE",
  });
  ensureApiSuccess(data, "Failed to delete product");
  return data;
}

export async function updateInventoryProduct(
  id: string,
  body: UpdateInventoryProductInput,
): Promise<ApiSuccessResult> {
  const data = await fetchJson<ApiSuccessResult>(`/api/inventory/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  ensureApiSuccess(data, "Failed to update product");
  return data;
}
