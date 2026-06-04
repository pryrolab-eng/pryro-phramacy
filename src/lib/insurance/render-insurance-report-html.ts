import type { InsuranceMonthlyReport } from "@/lib/insurance/monthly-report";

export type InsuranceReportTemplate = {
  template_html: string;
  template_css: string;
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatMoney(amount: number): string {
  return Math.round(amount).toLocaleString("en-US");
}

function buildClaimsTableHtml(
  claims: InsuranceMonthlyReport["claims"],
  providerFilter?: string,
): string {
  const rows = claims.filter(
    (c) =>
      !providerFilter ||
      c.insuranceType.toLowerCase() === providerFilter.toLowerCase(),
  );

  if (rows.length === 0) {
    return '<p class="empty">No insurance claims for this period.</p>';
  }

  const body = rows
    .map((claim) => {
      const itemRows = claim.items
        .map(
          (item) =>
            `<tr>
              <td>${escapeHtml(item.drug)}</td>
              <td class="code">${escapeHtml(item.externalCode ?? "—")}</td>
              <td class="num">${item.quantity}</td>
              <td class="num">${formatMoney(item.unitPrice)}</td>
              <td class="num">${formatMoney(item.insurancePays)}</td>
              <td class="num">${formatMoney(item.patientPays)}</td>
            </tr>`,
        )
        .join("");

      return `
        <tbody class="claim-group">
          <tr class="claim-header">
            <td colspan="6">
              <strong>${escapeHtml(claim.patientName)}</strong>
              · ${escapeHtml(claim.insuranceNumber ?? "—")}
              · ${escapeHtml(claim.date)}
              · ${escapeHtml(claim.status)}
              · Claim ${formatMoney(claim.totalClaim)} RWF
            </td>
          </tr>
          ${itemRows || '<tr><td colspan="6">No line items</td></tr>'}
        </tbody>`;
    })
    .join("");

  return `
    <table class="claims-table">
      <thead>
        <tr>
          <th>Product</th>
          <th>Code</th>
          <th>Qty</th>
          <th>Unit (RWF)</th>
          <th>Insurer (RWF)</th>
          <th>Patient (RWF)</th>
        </tr>
      </thead>
      ${body}
    </table>`;
}

const DEFAULT_REPORT_CSS = `
  .insurance-monthly-report { font-family: system-ui, sans-serif; font-size: 12px; color: #111; }
  .insurance-monthly-report h1 { font-size: 18px; margin: 0 0 8px; }
  .insurance-monthly-report .meta { color: #444; margin-bottom: 16px; }
  .insurance-monthly-report .summary { margin: 16px 0; padding: 12px; border: 1px solid #ccc; }
  .insurance-monthly-report .claims-table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  .insurance-monthly-report .claims-table th,
  .insurance-monthly-report .claims-table td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
  .insurance-monthly-report .claims-table .num { text-align: right; }
  .insurance-monthly-report .claim-header td { background: #f3f4f6; font-weight: 600; }
  .insurance-monthly-report .empty { color: #666; font-style: italic; }
`;

function buildDefaultReportHtml(
  report: InsuranceMonthlyReport,
  providerName?: string,
): string {
  const filtered = providerName
    ? report.claims.filter(
        (c) =>
          c.insuranceType.toLowerCase() === providerName.toLowerCase(),
      )
    : report.claims;

  const insurerTotal = filtered.reduce((s, c) => s + c.totalClaim, 0);
  const patientTotal = filtered.reduce((s, c) => s + c.patientCopay, 0);
  const titleProvider = providerName ?? "All insurers";

  return `
    <div class="insurance-monthly-report">
      <h1>Insurance claims — ${escapeHtml(titleProvider)}</h1>
      <p class="meta">
        ${escapeHtml(report.pharmacy.name)}
        · ${report.period.month}/${report.period.year}
      </p>
      <div class="summary">
        <p><strong>Claims:</strong> ${filtered.length}</p>
        <p><strong>Insurer total:</strong> ${formatMoney(insurerTotal)} RWF</p>
        <p><strong>Patient copay:</strong> ${formatMoney(patientTotal)} RWF</p>
      </div>
      ${buildClaimsTableHtml(report.claims, providerName)}
    </div>`;
}

/** Merge admin template placeholders with monthly report data. */
export function renderInsuranceMonthlyReportHtml(
  report: InsuranceMonthlyReport,
  options?: {
    template?: InsuranceReportTemplate | null;
    providerName?: string;
  },
): { html: string; css: string } {
  const providerName = options?.providerName?.trim();
  const filteredClaims = providerName
    ? report.claims.filter(
        (c) =>
          c.insuranceType.toLowerCase() === providerName.toLowerCase(),
      )
    : report.claims;

  const insurerTotal = filteredClaims.reduce((s, c) => s + c.totalClaim, 0);
  const patientTotal = filteredClaims.reduce((s, c) => s + c.patientCopay, 0);

  const vars: Record<string, string> = {
    pharmacy_name: report.pharmacy.name,
    pharmacy_address: report.pharmacy.address ?? "",
    pharmacy_phone: report.pharmacy.phone ?? "",
    pharmacy_email: report.pharmacy.email ?? "",
    insurance_provider: providerName ?? "All insurers",
    report_month: String(report.period.month),
    report_year: String(report.period.year),
    total_claim_amount: formatMoney(insurerTotal),
    total_patient_copay: formatMoney(patientTotal),
    claim_count: String(filteredClaims.length),
    claims_table: buildClaimsTableHtml(report.claims, providerName),
  };

  const template = options?.template;
  if (!template?.template_html?.trim()) {
    return {
      html: buildDefaultReportHtml(report, providerName),
      css: DEFAULT_REPORT_CSS,
    };
  }

  let html = template.template_html;
  for (const [key, value] of Object.entries(vars)) {
    html = html.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "gi"), value);
  }

  const css =
    (template.template_css?.trim() || "") +
    "\n" +
    DEFAULT_REPORT_CSS;

  return { html, css };
}
