import { pickColumn } from "@/lib/import/column-utils";

export const INSURANCE_IMPORT_COLUMNS = ["Name", "Code", "Price"] as const;

export type InsuranceImportPreviewRow = {
  Name: string;
  Code: string;
  Price: number;
};

export function validateInsuranceImportRows(
  data: Record<string, unknown>[],
): { rows: InsuranceImportPreviewRow[]; errors: string[] } {
  const errors: string[] = [];
  const rows = data.map((row, index) => {
    const rowNum = index + 2;
    const name = pickColumn(row, [
      "Name",
      "Product Name",
      "Medication",
      "Drug",
      "Product",
      "Item",
    ]);

    if (!name) {
      errors.push(`Row ${rowNum}: Medication name is required`);
    }

    const priceRaw = pickColumn(row, [
      "Price",
      "Price (RWF)",
      "Cost",
      "Amount",
      "Rate",
      "Coverage",
    ]);
    const price = priceRaw ? Number(priceRaw.replace(/,/g, "")) : 0;

    return {
      Name: name,
      Code: pickColumn(row, [
        "Code",
        "Insurer Code",
        "External Code",
        "Drug Code",
        "RSSB Code",
      ]),
      Price: Number.isFinite(price) ? price : 0,
    };
  });

  return { rows, errors };
}

export function insuranceRowsToPriceList(
  rows: InsuranceImportPreviewRow[],
): Record<string, number> {
  const priceList: Record<string, number> = {};
  for (const row of rows) {
    if (row.Name) priceList[row.Name] = row.Price;
  }
  return priceList;
}

export const INSURANCE_SAMPLE_ROWS: InsuranceImportPreviewRow[] = [
  { Name: "Paracetamol 500mg", Code: "RSSB-PAR-500", Price: 500 },
  { Name: "Amoxicillin 250mg", Code: "RSSB-AMX-250", Price: 1200 },
  { Name: "Ibuprofen 400mg", Code: "", Price: 800 },
];
