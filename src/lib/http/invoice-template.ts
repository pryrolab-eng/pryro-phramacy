import { fetchJson } from "./client";

export const invoiceTemplateKeys = {
  all: ["pharmacy", "invoice-template"] as const,
};

export type InvoiceTemplate = {
  showLogo: boolean;
  headerFields: string[];
  patientFields: string[];
  productFields: string[];
  showTax: boolean;
  showInsuranceSplit: boolean;
  footerText: string;
};

const EMPTY_TEMPLATE: InvoiceTemplate = {
  showLogo: true,
  headerFields: [],
  patientFields: [],
  productFields: [],
  showTax: true,
  showInsuranceSplit: true,
  footerText: "",
};

export async function getInvoiceTemplate(): Promise<InvoiceTemplate> {
  try {
    return await fetchJson<InvoiceTemplate>("/api/pharmacy/invoice-template");
  } catch {
    return EMPTY_TEMPLATE;
  }
}

export async function updateInvoiceTemplate(body: InvoiceTemplate): Promise<void> {
  await fetchJson("/api/pharmacy/invoice-template", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
