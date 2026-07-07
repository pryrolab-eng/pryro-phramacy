import type { CanvasElement } from "@/lib/admin/insurance-template-canvas";

export const INSURANCE_CANVAS_WIDTH = 595;
export const INSURANCE_CANVAS_HEIGHT = 842;

const SAMPLE_CLAIMS_TABLE = `
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
    <tbody>
      <tr class="claim-header">
        <td colspan="6">
          <strong>John Doe</strong> · RSSB-123456 · 15/06/2026 · approved · Claim 45,000 RWF
        </td>
      </tr>
      <tr>
        <td>Amoxicillin 500mg</td>
        <td class="code">AMX-500</td>
        <td class="num">2</td>
        <td class="num">1,500</td>
        <td class="num">2,400</td>
        <td class="num">600</td>
      </tr>
      <tr>
        <td>Paracetamol 500mg</td>
        <td class="code">PCM-500</td>
        <td class="num">1</td>
        <td class="num">800</td>
        <td class="num">640</td>
        <td class="num">160</td>
      </tr>
    </tbody>
  </table>`;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function applyTemplateVars(
  text: string,
  vars: Record<string, string>,
): string {
  let result = text;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(
      new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "gi"),
      value,
    );
  }
  return result;
}

export function buildInsuranceTemplatePreviewVars(options?: {
  templateName?: string;
  insuranceProvider?: string;
}): Record<string, string> {
  const now = new Date();
  const insurer = options?.insuranceProvider?.trim() || "RSSB";

  return {
    pharmacy_name: "Sample Pharmacy Ltd",
    pharmacy_address: "KN 4 Ave, Kigali",
    pharmacy_phone: "+250 788 000 000",
    pharmacy_email: "info@samplepharmacy.rw",
    insurance_provider: insurer,
    insurance_name: insurer,
    report_month: String(now.getMonth() + 1),
    report_year: String(now.getFullYear()),
    total_claim_amount: "1,250,000",
    total_patient_copay: "250,000",
    claim_count: "12",
    policy_number: "POL-2024-001",
    patient_name: "John Doe",
    date: now.toLocaleDateString(),
    amount: "50,000",
    coverage_percentage: "80",
    claims_table: SAMPLE_CLAIMS_TABLE,
    template_name: options?.templateName?.trim() || "Insurance claim template",
  };
}

function renderElementInnerHtml(
  element: CanvasElement,
  vars: Record<string, string>,
): string {
  if (element.type === "image") {
    const src = escapeHtml(String(element.src ?? ""));
    const alt = escapeHtml(String(element.alt ?? ""));
    return `<img src="${src}" alt="${alt}" style="width:100%;height:100%;object-fit:contain;display:block;" />`;
  }

  if (element.type === "line") {
    return "";
  }

  let content = "";
  if (
    element.type === "variable" ||
    element.type === "date" ||
    element.type === "amount" ||
    element.type === "patient"
  ) {
    const varKey = String(element.variable ?? "");
    const sampleVal = vars[varKey] ?? "—";
    content = `${String(element.label ?? "")}: ${sampleVal}${String(element.suffix ?? "")}`;
    return escapeHtml(content);
  }

  content = applyTemplateVars(String(element.text ?? ""), vars);
  if (content.includes("<table")) {
    return content;
  }
  return escapeHtml(content);
}

function renderElementHtml(
  element: CanvasElement,
  vars: Record<string, string>,
): string {
  const x = Number(element.x ?? 0);
  const y = Number(element.y ?? 0);
  const w = Number(element.width ?? 100);
  const h = Number(element.height ?? 30);
  const fontSize = element.fontSize ?? "14px";
  const fontWeight = element.fontWeight ?? "normal";
  const backgroundColor =
    element.type === "line"
      ? String(element.backgroundColor ?? "#000")
      : "transparent";

  const style = [
    `left:${x}px`,
    `top:${y}px`,
    `width:${w}px`,
    `height:${h}px`,
    `font-size:${typeof fontSize === "number" ? `${fontSize}px` : fontSize}`,
    `font-weight:${fontWeight}`,
    `background-color:${backgroundColor}`,
  ].join(";");

  const inner = renderElementInnerHtml(element, vars);

  return `<div class="canvas-element" style="${style}">${inner}</div>`;
}

export function renderInsuranceCanvasPrintHtml(
  elements: CanvasElement[],
  options?: {
    templateName?: string;
    insuranceProvider?: string;
  },
): string {
  const vars = buildInsuranceTemplatePreviewVars(options);
  const body = elements.map((el) => renderElementHtml(el, vars)).join("\n");

  return `
    <div class="canvas-page">
      ${body}
    </div>`;
}

export const INSURANCE_TEMPLATE_PRINT_CSS = `
  @page {
    size: A4 portrait;
    margin: 0;
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    padding: 0;
    background: #fff;
    color: #111;
    font-family: system-ui, -apple-system, sans-serif;
  }

  .canvas-page {
    position: relative;
    width: ${INSURANCE_CANVAS_WIDTH}px;
    height: ${INSURANCE_CANVAS_HEIGHT}px;
    margin: 0 auto;
    background: #fff;
    overflow: hidden;
  }

  .canvas-element {
    position: absolute;
    overflow: hidden;
    padding: 4px;
    line-height: 1.3;
    color: #111;
  }

  .claims-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 4px;
    font-size: 10px;
  }

  .claims-table th,
  .claims-table td {
    border: 1px solid #ccc;
    padding: 4px 6px;
    text-align: left;
  }

  .claims-table .num {
    text-align: right;
  }

  .claims-table .code {
    font-family: ui-monospace, monospace;
    font-size: 9px;
  }

  .claims-table .claim-header td {
    background: #f3f4f6;
    font-weight: 600;
  }

  @media print {
    body {
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }
  }
`;

export function printInsuranceTemplatePreview(options: {
  elements: CanvasElement[];
  templateName?: string;
  insuranceProvider?: string;
}): boolean {
  if (typeof window === "undefined") return false;

  const html = renderInsuranceCanvasPrintHtml(options.elements, {
    templateName: options.templateName,
    insuranceProvider: options.insuranceProvider,
  });

  const title = options.templateName?.trim() || "Insurance template preview";
  const win = window.open("", "_blank", "noopener,noreferrer");
  if (!win) return false;

  win.document.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>${INSURANCE_TEMPLATE_PRINT_CSS}</style>
  </head>
  <body>${html}</body>
</html>`);
  win.document.close();
  win.focus();
  win.print();
  return true;
}
