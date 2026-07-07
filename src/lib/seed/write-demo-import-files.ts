import fs from "node:fs";
import path from "node:path";
import {
  DEMO_CUSTOMERS,
  DEMO_INSURER_FORMULARY_IMPORT,
  DEMO_INVENTORY_IMPORT_ONLY,
  DEMO_INVENTORY_PRODUCTS,
  DEMO_STAFF_IMPORT,
} from "@/lib/seed/demo-datasets";

function inventoryRowsForExport() {
  return DEMO_INVENTORY_PRODUCTS.map((row) => ({
    "Product Name": row.name,
    Category: row.category,
    Stock: row.stock,
    "Min Stock": row.minStock,
    "Price (RWF)": row.price,
    "Expiry Date": row.expiryDate,
    "Batch Number": row.batchNumber,
  }));
}

export async function writeDemoImportFiles(outputDir: string): Promise<string[]> {
  const XLSX = await import("xlsx");
  fs.mkdirSync(outputDir, { recursive: true });

  const files: Array<{ name: string; sheets: Record<string, Record<string, unknown>[]> }> =
    [
      {
        name: "demo-inventory-catalog.xlsx",
        sheets: {
          Inventory: inventoryRowsForExport(),
        },
      },
      {
        name: "demo-inventory-new-products.xlsx",
        sheets: {
          Inventory: DEMO_INVENTORY_IMPORT_ONLY.map((row) => ({ ...row })),
        },
      },
      {
        name: "demo-customers.xlsx",
        sheets: {
          Customers: DEMO_CUSTOMERS.map((row) => ({
            Name: row.name,
            Phone: row.phone,
            Email: row.email,
            "Date of Birth": row.dateOfBirth,
            Allergies: row.allergies,
            "Insurance Number": row.insuranceNumber,
          })),
        },
      },
      {
        name: "demo-rssb-formulary-fuzzy.xlsx",
        sheets: {
          Coverage: DEMO_INSURER_FORMULARY_IMPORT.map((row) => ({ ...row })),
          Instructions: [
            {
              Column: "Name",
              Required: "Yes",
              Note: "Uses insurer wording — test fuzzy match against your catalog",
            },
            {
              Column: "Code",
              Required: "No",
              Note: "Saved on product when pharmacist confirms",
            },
            {
              Column: "Price",
              Required: "No",
              Note: "Reference only",
            },
          ],
        },
      },
      {
        name: "demo-staff.xlsx",
        sheets: {
          Staff: DEMO_STAFF_IMPORT.map((row) => ({ ...row })),
        },
      },
    ];

  const written: string[] = [];
  for (const file of files) {
    const workbook = XLSX.utils.book_new();
    for (const [sheetName, rows] of Object.entries(file.sheets)) {
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(rows),
        sheetName,
      );
    }
    const filePath = path.join(outputDir, file.name);
    XLSX.writeFile(workbook, filePath);
    written.push(filePath);
  }

  return written;
}
