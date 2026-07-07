import { fetchJson } from "./client";

export type StaffImportFailure = {
  rowNumber: number;
  label: string;
  error: string;
};

export type StaffImportResult = {
  success: boolean;
  attempted: number;
  succeeded: number;
  failures: StaffImportFailure[];
  error?: string;
};

export async function importStaffMembers(body: {
  pharmacy_name?: string;
  rows: Array<{
    fullName: string;
    email: string;
    phone: string;
    role?: string;
  }>;
}): Promise<StaffImportResult> {
  return fetchJson<StaffImportResult>("/api/staff/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
