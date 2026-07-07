import type { CreateCustomerInput } from "@/lib/http/customers";
import { pickColumn } from "@/lib/import/column-utils";

export const CUSTOMER_IMPORT_COLUMNS = [
  "Name",
  "Phone",
  "Email",
  "Date of Birth",
  "Allergies",
  "Insurance Number",
] as const;

export type CustomerImportPreviewRow = {
  Name: string;
  Phone: string;
  Email: string;
  "Date of Birth": string;
  Allergies: string;
  "Insurance Number": string;
};

export function validateCustomerImportRows(
  data: Record<string, unknown>[],
): { rows: CustomerImportPreviewRow[]; errors: string[] } {
  const errors: string[] = [];
  const rows = data.map((row, index) => {
    const rowNum = index + 2;
    const name = pickColumn(row, [
      "Name",
      "Customer Name",
      "Patient Name",
      "Full Name",
    ]);
    const phone = pickColumn(row, [
      "Phone",
      "Phone Number",
      "Mobile",
      "Tel",
      "Telephone",
    ]);

    if (!name) errors.push(`Row ${rowNum}: Name is required`);
    if (!phone) errors.push(`Row ${rowNum}: Phone is required`);

    return {
      Name: name,
      Phone: phone,
      Email: pickColumn(row, ["Email", "Email Address", "E-mail"]),
      "Date of Birth": pickColumn(row, [
        "Date of Birth",
        "DOB",
        "Birth Date",
        "Birthday",
      ]),
      Allergies: pickColumn(row, ["Allergies", "Allergy", "Known Allergies"]),
      "Insurance Number": pickColumn(row, [
        "Insurance Number",
        "Insurance",
        "Policy Number",
        "Member ID",
      ]),
    };
  });

  return { rows, errors };
}

export function customerPreviewToApiRow(
  row: CustomerImportPreviewRow,
): CreateCustomerInput {
  return {
    name: row.Name,
    phone: row.Phone,
    email: row.Email || undefined,
    dateOfBirth: row["Date of Birth"] || undefined,
    allergies: row.Allergies || undefined,
    insurance: row["Insurance Number"] || undefined,
  };
}

export const CUSTOMER_SAMPLE_ROWS: CustomerImportPreviewRow[] = [
  {
    Name: "Jean Mukamana",
    Phone: "+250788123456",
    Email: "jean@example.com",
    "Date of Birth": "1990-05-12",
    Allergies: "Penicillin",
    "Insurance Number": "RSSB-12345",
  },
  {
    Name: "Paul Nkurunziza",
    Phone: "+250789654321",
    Email: "",
    "Date of Birth": "",
    Allergies: "",
    "Insurance Number": "",
  },
];
