import type { AddInventoryProductInput } from "@/lib/http/inventory";
import { pickColumn, pickNumber } from "@/lib/import/column-utils";

export const INVENTORY_IMPORT_COLUMNS = [
  "Product Name",
  "Category",
  "Stock",
  "Min Stock",
  "Price (RWF)",
  "Expiry Date",
  "Batch Number",
] as const;

export type InventoryImportPreviewRow = {
  "Product Name": string;
  Category: string;
  Stock: number;
  "Min Stock": number;
  "Price (RWF)": number;
  "Expiry Date": string;
  "Batch Number": string;
};

export function validateInventoryImportRows(
  data: Record<string, unknown>[],
): { rows: InventoryImportPreviewRow[]; errors: string[] } {
  const errors: string[] = [];
  const rows = data.map((row, index) => {
    const rowNum = index + 2;

    const productName = pickColumn(row, [
      "Product Name",
      "Name",
      "Product",
      "Medication",
      "Drug",
      "Item",
    ]);
    const category = pickColumn(row, ["Category", "Product Category", "Type"]);
    const stock = pickNumber(row, ["Stock", "Quantity", "Qty", "QTY"]);
    const minStock = pickNumber(row, [
      "Min Stock",
      "Minimum Stock",
      "Min",
      "Reorder Level",
    ]);
    const price = pickNumber(row, [
      "Price (RWF)",
      "Price",
      "Selling Price",
      "Unit Price",
      "RWF",
    ]);
    const expiryDate = pickColumn(row, [
      "Expiry Date",
      "Expiry",
      "Exp Date",
      "Expiration Date",
    ]);
    const batchNumber = pickColumn(row, [
      "Batch Number",
      "Batch",
      "Lot",
      "Lot Number",
    ]);

    if (!productName) errors.push(`Row ${rowNum}: Product Name is required`);
    if (!category) errors.push(`Row ${rowNum}: Category is required`);
    if (stock == null) errors.push(`Row ${rowNum}: Valid Stock number required`);
    if (minStock == null) {
      errors.push(`Row ${rowNum}: Valid Min Stock number required`);
    }
    if (price == null) errors.push(`Row ${rowNum}: Valid Price required`);
    if (!expiryDate) errors.push(`Row ${rowNum}: Expiry Date is required`);
    if (!batchNumber) errors.push(`Row ${rowNum}: Batch Number is required`);

    return {
      "Product Name": productName,
      Category: category,
      Stock: stock ?? 0,
      "Min Stock": minStock ?? 0,
      "Price (RWF)": price ?? 0,
      "Expiry Date": expiryDate,
      "Batch Number": batchNumber || "BATCH001",
    };
  });

  return { rows, errors };
}

export function inventoryPreviewToApiRow(
  row: InventoryImportPreviewRow,
): AddInventoryProductInput {
  return {
    name: row["Product Name"],
    category: row.Category,
    batch_number: row["Batch Number"],
    quantity: row.Stock,
    unit_cost: 0,
    selling_price: row["Price (RWF)"],
    minimum_stock_level: row["Min Stock"],
    expiry_date: row["Expiry Date"],
  };
}

export const INVENTORY_SAMPLE_ROWS: InventoryImportPreviewRow[] = [
  {
    "Product Name": "Paracetamol 500mg",
    Category: "Pain Relief",
    Stock: 100,
    "Min Stock": 20,
    "Price (RWF)": 500,
    "Expiry Date": "2025-12-31",
    "Batch Number": "PAR001",
  },
  {
    "Product Name": "Amoxicillin 250mg",
    Category: "Antibiotics",
    Stock: 50,
    "Min Stock": 15,
    "Price (RWF)": 1200,
    "Expiry Date": "2025-06-30",
    "Batch Number": "AMX001",
  },
];
