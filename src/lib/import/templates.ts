import {
  CUSTOMER_IMPORT_COLUMNS,
  CUSTOMER_SAMPLE_ROWS,
} from "@/lib/import/customer-rows";
import {
  INVENTORY_IMPORT_COLUMNS,
  INVENTORY_SAMPLE_ROWS,
} from "@/lib/import/inventory-rows";
import {
  INSURANCE_IMPORT_COLUMNS,
  INSURANCE_SAMPLE_ROWS,
} from "@/lib/import/insurance-rows";
import {
  STAFF_IMPORT_COLUMNS,
  STAFF_SAMPLE_ROWS,
} from "@/lib/import/staff-rows";
import { PHARMACY_ROUTES } from "@/lib/routes/pharmacy-paths";

export type ImportTemplateId =
  | "inventory"
  | "customers"
  | "insurance"
  | "staff";

export type ImportColumnGuide = {
  name: string;
  required: "Yes" | "No";
  description: string;
};

export type ImportTemplateDefinition = {
  id: ImportTemplateId;
  title: string;
  description: string;
  fileName: string;
  sheetName: string;
  columns: readonly string[];
  columnGuide: ImportColumnGuide[];
  sampleRows: Record<string, unknown>[];
  importPath: string;
  importQuery?: string;
};

export const IMPORT_TEMPLATES: ImportTemplateDefinition[] = [
  {
    id: "inventory",
    title: "Inventory & products",
    description:
      "Bulk-load your product catalog with stock levels, prices, expiry dates, and batch numbers.",
    fileName: "pryrox-inventory-template.xlsx",
    sheetName: "Inventory",
    columns: INVENTORY_IMPORT_COLUMNS,
    columnGuide: [
      { name: "Product Name", required: "Yes", description: "Medication or product label" },
      { name: "Category", required: "Yes", description: "e.g. Pain Relief, Antibiotics, Vitamins" },
      { name: "Stock", required: "Yes", description: "Current quantity on hand" },
      { name: "Min Stock", required: "Yes", description: "Low-stock alert threshold" },
      { name: "Price (RWF)", required: "Yes", description: "Selling price in RWF" },
      { name: "Expiry Date", required: "Yes", description: "YYYY-MM-DD" },
      { name: "Batch Number", required: "Yes", description: "Batch or lot identifier" },
    ],
    sampleRows: INVENTORY_SAMPLE_ROWS as unknown as Record<string, unknown>[],
    importPath: PHARMACY_ROUTES.inventory,
    importQuery: "import=1",
  },
  {
    id: "customers",
    title: "Customers",
    description:
      "Import customer profiles for POS lookup, insurance, and visit history.",
    fileName: "pryrox-customers-template.xlsx",
    sheetName: "Customers",
    columns: CUSTOMER_IMPORT_COLUMNS,
    columnGuide: [
      { name: "Name", required: "Yes", description: "Customer full name" },
      { name: "Phone", required: "Yes", description: "Primary phone (include country code)" },
      { name: "Email", required: "No", description: "Optional email address" },
      { name: "Date of Birth", required: "No", description: "YYYY-MM-DD" },
      { name: "Allergies", required: "No", description: "Comma-separated list" },
      { name: "Insurance Number", required: "No", description: "Insurer member or policy ID" },
    ],
    sampleRows: CUSTOMER_SAMPLE_ROWS as unknown as Record<string, unknown>[],
    importPath: PHARMACY_ROUTES.customers,
    importQuery: "import=1",
  },
  {
    id: "insurance",
    title: "Insurance coverage",
    description:
      "Mark which inventory products are covered by an insurer. Products must already exist in inventory.",
    fileName: "pryrox-insurance-coverage-template.xlsx",
    sheetName: "Coverage",
    columns: INSURANCE_IMPORT_COLUMNS,
    columnGuide: [
      { name: "Name", required: "Yes", description: "Insurer medication label (fuzzy-matched to your catalog)" },
      { name: "Code", required: "No", description: "Insurer drug code saved on the product when confirmed" },
      { name: "Price", required: "No", description: "Reference only — POS uses your shelf price × insurer %" },
    ],
    sampleRows: INSURANCE_SAMPLE_ROWS as unknown as Record<string, unknown>[],
    importPath: PHARMACY_ROUTES.inventory,
    importQuery: "tab=insurance&import=1",
  },
  {
    id: "staff",
    title: "Staff & team",
    description:
      "Invite team members in bulk. Each row sends a login invitation by email.",
    fileName: "pryrox-staff-template.xlsx",
    sheetName: "Staff",
    columns: STAFF_IMPORT_COLUMNS,
    columnGuide: [
      { name: "Full Name", required: "Yes", description: "Team member display name" },
      { name: "Email", required: "Yes", description: "Login email (invitation sent here)" },
      { name: "Phone", required: "Yes", description: "Contact phone number" },
      { name: "Role", required: "No", description: "pharmacist, staff, or cashier (default: staff)" },
    ],
    sampleRows: STAFF_SAMPLE_ROWS as unknown as Record<string, unknown>[],
    importPath: PHARMACY_ROUTES.staff,
    importQuery: "import=1",
  },
];

export function getImportTemplate(id: ImportTemplateId): ImportTemplateDefinition {
  const template = IMPORT_TEMPLATES.find((item) => item.id === id);
  if (!template) {
    throw new Error(`Unknown import template: ${id}`);
  }
  return template;
}

export async function downloadImportTemplate(id: ImportTemplateId): Promise<void> {
  const template = getImportTemplate(id);
  const XLSX = await import("xlsx");

  const dataSheet = XLSX.utils.json_to_sheet(template.sampleRows);
  const guideSheet = XLSX.utils.json_to_sheet(template.columnGuide);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, dataSheet, template.sheetName);
  XLSX.utils.book_append_sheet(workbook, guideSheet, "Instructions");
  XLSX.writeFile(workbook, template.fileName);
}

export function importTemplateHref(template: ImportTemplateDefinition): string {
  return template.importQuery
    ? `${template.importPath}?${template.importQuery}`
    : template.importPath;
}
