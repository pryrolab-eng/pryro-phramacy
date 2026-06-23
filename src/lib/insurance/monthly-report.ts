import {
  storeLoadInsuranceTemplateForProvider,
  storeLoadMonthlyInsuranceClaims,
  storeLoadPharmacyForReport,
  storeLoadSaleItemsForClaim,
} from "@/lib/db/insurance-store";

export type InsuranceReportPeriod = {
  month: number;
  year: number;
  from: string;
  to: string;
};

export type InsuranceClaimLineItem = {
  drug: string;
  quantity: number;
  unitPrice: number;
  insurancePays: number;
  patientPays: number;
  externalCode?: string | null;
};

export type InsuranceMonthlyClaim = {
  id: string;
  claimNumber: string | null;
  insuranceType: string;
  providerId: string | null;
  patientName: string;
  insuranceNumber: string | null;
  date: string;
  status: string;
  totalClaim: number;
  patientCopay: number;
  items: InsuranceClaimLineItem[];
};

export type InsuranceMonthlySummary = {
  totalClaims: number;
  totalInsurerAmount: number;
  totalPatientCopay: number;
  byInsurance: Record<
    string,
    { count: number; insurerAmount: number; patientCopay: number }
  >;
};

export type InsuranceMonthlyReport = {
  period: InsuranceReportPeriod;
  pharmacy: {
    id: string;
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
  };
  summary: InsuranceMonthlySummary;
  claims: InsuranceMonthlyClaim[];
};

export function resolveInsuranceReportPeriod(
  month: number,
  year: number,
): InsuranceReportPeriod {
  const m = Math.min(12, Math.max(1, month));
  const y = year > 1970 ? year : new Date().getFullYear();
  const from = new Date(y, m - 1, 1, 0, 0, 0, 0);
  const to = new Date(y, m, 0, 23, 59, 59, 999);
  return {
    month: m,
    year: y,
    from: from.toISOString(),
    to: to.toISOString(),
  };
}

export async function loadMonthlyInsuranceReport(params: {
  pharmacyId: string;
  month: number;
  year: number;
  providerId?: string | null;
}): Promise<InsuranceMonthlyReport> {
  const period = resolveInsuranceReportPeriod(params.month, params.year);

  const pharmacy = await storeLoadPharmacyForReport(params.pharmacyId);
  if (!pharmacy) throw new Error("Pharmacy not found");

  const claimRows = await storeLoadMonthlyInsuranceClaims({
    pharmacyId: params.pharmacyId,
    from: period.from,
    to: period.to,
    providerId: params.providerId,
  });

  const claims: InsuranceMonthlyClaim[] = [];

  for (const row of claimRows) {
    let items: InsuranceClaimLineItem[] = row.lines.map((line) => ({
      drug: String(line.medication_name ?? "Unknown"),
      quantity: line.quantity || 1,
      unitPrice: line.shelf_unit_price,
      insurancePays: line.insurer_amount,
      patientPays: line.patient_amount,
      externalCode: line.external_code,
    }));

    if (items.length === 0) {
      items = await storeLoadSaleItemsForClaim(row.sale_id);
    }

    const totalClaim =
      row.covered_amount ||
      row.claim_amount ||
      items.reduce((sum, item) => sum + item.insurancePays, 0);
    const patientCopay =
      row.patient_copay ||
      items.reduce((sum, item) => sum + item.patientPays, 0);

    claims.push({
      id: row.id,
      claimNumber: row.claim_number,
      insuranceType: row.provider_name,
      providerId: row.insurance_provider_id ?? null,
      patientName: row.patient_name,
      insuranceNumber: row.patient_id_number,
      date: row.created_at.slice(0, 10),
      status: row.status,
      totalClaim,
      patientCopay,
      items,
    });
  }

  const summary: InsuranceMonthlySummary = {
    totalClaims: claims.length,
    totalInsurerAmount: 0,
    totalPatientCopay: 0,
    byInsurance: {},
  };

  for (const claim of claims) {
    summary.totalInsurerAmount += claim.totalClaim;
    summary.totalPatientCopay += claim.patientCopay;
    const key = claim.insuranceType;
    if (!summary.byInsurance[key]) {
      summary.byInsurance[key] = {
        count: 0,
        insurerAmount: 0,
        patientCopay: 0,
      };
    }
    summary.byInsurance[key].count += 1;
    summary.byInsurance[key].insurerAmount += claim.totalClaim;
    summary.byInsurance[key].patientCopay += claim.patientCopay;
  }

  return {
    period,
    pharmacy: {
      id: pharmacy.id as string,
      name: String(pharmacy.name ?? "Pharmacy"),
      address: (pharmacy.address as string | null) ?? null,
      phone: (pharmacy.phone as string | null) ?? null,
      email: (pharmacy.email as string | null) ?? null,
    },
    summary,
    claims,
  };
}

export async function loadInsuranceTemplateForProvider(
  providerName: string,
  pharmacyId: string,
): Promise<{
  id: string;
  name: string;
  insurance_provider: string;
  template_html: string;
  template_css: string;
} | null> {
  return storeLoadInsuranceTemplateForProvider(providerName, pharmacyId);
}
