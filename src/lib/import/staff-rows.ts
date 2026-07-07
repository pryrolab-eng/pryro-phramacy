import { pickColumn } from "@/lib/import/column-utils";

export const STAFF_IMPORT_COLUMNS = [
  "Full Name",
  "Email",
  "Phone",
  "Role",
] as const;

const ALLOWED_ROLES = new Set(["pharmacist", "staff", "cashier"]);

export type StaffImportPreviewRow = {
  "Full Name": string;
  Email: string;
  Phone: string;
  Role: string;
};

export function validateStaffImportRows(
  data: Record<string, unknown>[],
): { rows: StaffImportPreviewRow[]; errors: string[] } {
  const errors: string[] = [];
  const rows = data.map((row, index) => {
    const rowNum = index + 2;
    const fullName = pickColumn(row, [
      "Full Name",
      "Name",
      "Staff Name",
      "Employee Name",
    ]);
    const email = pickColumn(row, ["Email", "Email Address", "E-mail"]).toLowerCase();
    const phone = pickColumn(row, ["Phone", "Phone Number", "Mobile"]);
    const roleRaw = pickColumn(row, ["Role", "Job Title", "Position"]).toLowerCase();
    const role = ALLOWED_ROLES.has(roleRaw) ? roleRaw : "staff";

    if (!fullName) errors.push(`Row ${rowNum}: Full Name is required`);
    if (!email) errors.push(`Row ${rowNum}: Email is required`);
    if (!phone) errors.push(`Row ${rowNum}: Phone is required`);
    if (roleRaw && !ALLOWED_ROLES.has(roleRaw)) {
      errors.push(
        `Row ${rowNum}: Role must be pharmacist, staff, or cashier (got "${roleRaw}")`,
      );
    }

    return {
      "Full Name": fullName,
      Email: email,
      Phone: phone,
      Role: role,
    };
  });

  return { rows, errors };
}

export const STAFF_SAMPLE_ROWS: StaffImportPreviewRow[] = [
  {
    "Full Name": "Alice Uwase",
    Email: "alice@example.com",
    Phone: "+250788111222",
    Role: "pharmacist",
  },
  {
    "Full Name": "Bob Habimana",
    Email: "bob@example.com",
    Phone: "+250789333444",
    Role: "cashier",
  },
];
