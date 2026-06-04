import type { SupabaseClient } from "@supabase/supabase-js";
import { firstRelation } from "@/lib/supabase/relation";

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

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

async function loadSaleItemsForClaim(
  admin: SupabaseClient,
  saleId: string | null,
): Promise<InsuranceClaimLineItem[]> {
  if (!saleId) return [];

  const { data, error } = await admin
    .from("sale_items")
    .select("medication_name, quantity, unit_price, total_price")
    .eq("sale_id", saleId);

  if (error || !data?.length) return [];

  return data.map((row) => {
    const qty = num(row.quantity) || 1;
    const unit = num(row.unit_price);
    const total = num(row.total_price) || unit * qty;
    return {
      drug: String(row.medication_name ?? "Unknown"),
      quantity: qty,
      unitPrice: unit,
      insurancePays: total,
      patientPays: 0,
    };
  });
}

export async function loadMonthlyInsuranceReport(
  admin: SupabaseClient,
  params: {
    pharmacyId: string;
    month: number;
    year: number;
    providerId?: string | null;
  },
): Promise<InsuranceMonthlyReport> {
  const period = resolveInsuranceReportPeriod(params.month, params.year);

  const { data: pharmacy, error: pharmacyError } = await admin
    .from("pharmacies")
    .select("id, name, address, phone, email")
    .eq("id", params.pharmacyId)
    .maybeSingle();

  if (pharmacyError) throw new Error(pharmacyError.message);
  if (!pharmacy) throw new Error("Pharmacy not found");

  let claimsQuery = admin
    .from("insurance_claims")
    .select(
      `
      id,
      claim_number,
      patient_name,
      patient_id_number,
      claim_amount,
      covered_amount,
      patient_copay,
      status,
      created_at,
      sale_id,
      insurance_provider_id,
      insurance_providers ( id, name ),
      insurance_claim_lines (
        medication_name,
        quantity,
        shelf_unit_price,
        insurer_amount,
        patient_amount,
        is_covered,
        external_code
      )
    `,
    )
    .eq("pharmacy_id", params.pharmacyId)
    .gte("created_at", period.from)
    .lte("created_at", period.to)
    .order("created_at", { ascending: true });

  if (params.providerId) {
    claimsQuery = claimsQuery.eq("insurance_provider_id", params.providerId);
  }

  const { data: claimRows, error: claimsError } = await claimsQuery;
  if (claimsError) throw new Error(claimsError.message);

  const claims: InsuranceMonthlyClaim[] = [];

  for (const row of claimRows ?? []) {
    const provider = firstRelation(row.insurance_providers) as {
      id?: string;
      name?: string;
    } | null;
    const providerName = provider?.name ?? "Unknown";
    const linesRaw = row.insurance_claim_lines;
    const linesArr = Array.isArray(linesRaw)
      ? linesRaw
      : linesRaw
        ? [linesRaw]
        : [];

    let items: InsuranceClaimLineItem[] = linesArr.map((line) => ({
      drug: String(line.medication_name ?? "Unknown"),
      quantity: num(line.quantity) || 1,
      unitPrice: num(line.shelf_unit_price),
      insurancePays: num(line.insurer_amount),
      patientPays: num(line.patient_amount),
      externalCode: (line.external_code as string | null) ?? null,
    }));

    if (items.length === 0) {
      items = await loadSaleItemsForClaim(
        admin,
        row.sale_id as string | null,
      );
    }

    const totalClaim =
      num(row.covered_amount) ||
      num(row.claim_amount) ||
      items.reduce((s, i) => s + i.insurancePays, 0);
    const patientCopay =
      num(row.patient_copay) ||
      items.reduce((s, i) => s + i.patientPays, 0);

    const created = row.created_at
      ? String(row.created_at).slice(0, 10)
      : period.from.slice(0, 10);

    claims.push({
      id: row.id as string,
      claimNumber: (row.claim_number as string | null) ?? null,
      insuranceType: providerName,
      providerId: (row.insurance_provider_id as string | null) ?? provider?.id ?? null,
      patientName: String(row.patient_name ?? "Unknown"),
      insuranceNumber: (row.patient_id_number as string | null) ?? null,
      date: created,
      status: String(row.status ?? "pending"),
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
  admin: SupabaseClient,
  providerName: string,
  pharmacyId: string,
): Promise<{
  id: string;
  name: string;
  insurance_provider: string;
  template_html: string;
  template_css: string;
} | null> {
  const key = providerName.trim();
  if (!key) return null;

  const { data, error } = await admin
    .from("insurance_templates")
    .select("id, name, insurance_provider, template_html, template_css, is_active")
    .eq("is_active", true)
    .or(`pharmacy_id.is.null,pharmacy_id.eq.${pharmacyId}`)
    .order("pharmacy_id", { ascending: false, nullsFirst: false });

  if (error) throw new Error(error.message);

  const match = (data ?? []).find(
    (t) =>
      String(t.insurance_provider ?? "")
        .trim()
        .toLowerCase() === key.toLowerCase(),
  );

  if (!match) return null;

  return {
    id: match.id as string,
    name: String(match.name),
    insurance_provider: String(match.insurance_provider),
    template_html: String(match.template_html ?? ""),
    template_css: String(match.template_css ?? ""),
  };
}
