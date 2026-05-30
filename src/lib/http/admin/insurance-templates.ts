import { ensureApiSuccess, fetchJson } from "../client";

export const adminInsuranceTemplatesQueryKey = [
  "admin",
  "insurance-templates",
] as const;

export type AdminInsuranceTemplateRow = {
  id: string;
  name: string;
  insurance_provider: string;
  template_html?: string | null;
  template_css?: string | null;
  is_active?: boolean;
  pharmacy_id?: string | null;
  created_at?: string;
  updated_at?: string;
};

export async function getAdminInsuranceTemplates(): Promise<
  AdminInsuranceTemplateRow[]
> {
  const data = await fetchJson<unknown>("/api/admin/insurance-templates");
  return Array.isArray(data) ? (data as AdminInsuranceTemplateRow[]) : [];
}

export async function createAdminInsuranceTemplate(body: {
  name: string;
  insurance_provider: string;
  template_html: string;
  template_css?: string;
}): Promise<{ template: AdminInsuranceTemplateRow }> {
  const data = await fetchJson<{
    success: boolean;
    template?: AdminInsuranceTemplateRow;
    error?: string;
  }>("/api/admin/insurance-templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  ensureApiSuccess(data, "Failed to save template");
  if (!data.template) throw new Error("Invalid template response");
  return { template: data.template };
}

export async function updateAdminInsuranceTemplate(
  id: string,
  body: {
    name: string;
    insurance_provider: string;
    template_html: string;
    template_css?: string;
    is_active?: boolean;
  },
): Promise<void> {
  const data = await fetchJson<{ success: boolean; error?: string }>(
    `/api/admin/insurance-templates/${id}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  ensureApiSuccess(data, "Failed to update template");
}

export async function deleteAdminInsuranceTemplate(id: string): Promise<void> {
  const data = await fetchJson<{ success: boolean; error?: string }>(
    `/api/admin/insurance-templates/${id}`,
    { method: "DELETE" },
  );
  ensureApiSuccess(data, "Failed to delete template");
}
