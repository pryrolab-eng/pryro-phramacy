import {
  pharmacyInitials,
  pharmacyLocationLine,
} from "@/lib/pharmacy/receipt-preview";

export type PosReceiptLine = {
  name: string;
  quantity: number;
  price: number;
};

export type PosReceiptCustomer = {
  name: string;
  phone?: string;
  insuranceType?: string;
  insuranceNumber?: string;
};

export type PosReceiptInput = {
  receiptNumber: string;
  pharmacyName: string;
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
  licenseNumber?: string;
  pharmacyTagline?: string;
  cashierName: string;
  customer: PosReceiptCustomer;
  patientName?: string;
  items: PosReceiptLine[];
  subtotal: number;
  insuranceCoverage: number;
  patientAmount: number;
  paymentMethod: string;
  footerText?: string;
};

export type PrintReceiptResult =
  | { ok: true }
  | { ok: false; error: string };

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildPosReceiptHtml(input: PosReceiptInput): string {
  const {
    receiptNumber,
    pharmacyName,
    city,
    address,
    phone,
    email,
    licenseNumber,
    pharmacyTagline = "Digital healthcare partner",
    cashierName,
    customer,
    patientName,
    items,
    insuranceCoverage,
    patientAmount,
    paymentMethod,
    footerText,
  } = input;

  const displayName = pharmacyName.trim() || "Pharmacy";
  const initials = pharmacyInitials(displayName);
  const locationLine = pharmacyLocationLine({ name: displayName, city, address });
  const amountDue = patientAmount;
  const showInsurance = insuranceCoverage > 0;

  const showPatient = Boolean(patientName?.trim());

  const lineRows = items
    .map((item) => {
      const lineTotal = item.price * item.quantity;
      const label =
        item.quantity > 1
          ? `${escapeHtml(item.name)} × ${item.quantity}`
          : escapeHtml(item.name);
      return `<div class="line-row"><span>${label}</span><span>${lineTotal.toLocaleString()} RWF</span></div>`;
    })
    .join("");

  const insuranceRows = showInsurance
    ? `<div class="line-row insurance"><span>Insurance</span><span>−${insuranceCoverage.toLocaleString()} RWF</span></div>
       <div class="line-row"><span>Patient pays</span><span>${amountDue.toLocaleString()} RWF</span></div>`
    : "";

  const contactRows = [
    phone?.trim() ? `<span>Tel: ${escapeHtml(phone.trim())}</span>` : "",
    email?.trim() ? `<span>${escapeHtml(email.trim())}</span>` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Receipt ${escapeHtml(receiptNumber)}</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 20px;
        font-family: system-ui, -apple-system, Segoe UI, sans-serif;
        font-size: 12px;
        color: #171717;
        background: #fff;
      }
      .card {
        max-width: 320px;
        margin: 0 auto;
        border: 1px solid #e5e5e5;
        border-radius: 12px;
        overflow: hidden;
      }
      .brand {
        display: flex;
        gap: 14px;
        padding: 20px;
        background: #fafafa;
        border-bottom: 1px solid #f0f0f0;
      }
      .mark {
        width: 56px;
        height: 56px;
        border-radius: 12px;
        background: #171717;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        font-weight: 700;
        flex-shrink: 0;
      }
      .brand h1 {
        margin: 0;
        font-size: 18px;
        line-height: 1.2;
      }
      .brand p {
        margin: 4px 0 0;
        color: #737373;
        font-size: 10px;
        letter-spacing: 0.18em;
        text-transform: uppercase;
      }
      .location {
        margin-top: 8px;
        color: #525252;
        font-size: 11px;
      }
      .body { padding: 16px 20px 20px; }
      .receipt-box {
        border: 1px solid #f0f0f0;
        border-radius: 8px;
        background: #fafafa;
        padding: 12px;
      }
      .receipt-head {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        font-size: 12px;
        font-weight: 600;
      }
      .receipt-no { color: #737373; font-weight: 500; }
      .meta {
        margin-top: 6px;
        color: #525252;
        font-size: 10px;
        line-height: 1.5;
      }
      .line-row {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        margin-top: 6px;
        font-size: 10px;
        color: #525252;
      }
      .line-row.insurance { color: #047857; }
      .total-row {
        display: flex;
        justify-content: space-between;
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid #e5e5e5;
        font-size: 10px;
        font-weight: 700;
        color: #171717;
      }
      .contact {
        margin-top: 12px;
        color: #525252;
        font-size: 10px;
      }
      .footer {
        margin-top: 12px;
        text-align: center;
        color: #737373;
        font-size: 10px;
      }
      @media print {
        body { padding: 0; }
        .card { border: none; border-radius: 0; max-width: none; }
      }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="brand">
        <div class="mark">${escapeHtml(initials)}</div>
        <div>
          <h1>${escapeHtml(displayName)}</h1>
          <p>${escapeHtml(pharmacyTagline)}</p>
          ${locationLine ? `<div class="location">${escapeHtml(locationLine)}</div>` : ""}
        </div>
      </div>
      <div class="body">
        <div class="receipt-box">
          <div class="receipt-head">
            <span>${escapeHtml(displayName)}</span>
            <span class="receipt-no">${escapeHtml(receiptNumber)}</span>
          </div>
          <div class="meta">
            ${licenseNumber?.trim() ? `<div>Lic. ${escapeHtml(licenseNumber.trim())}</div>` : ""}
            <div>Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
            <div>Payer: ${escapeHtml(customer.name || "Walk-in customer")}</div>
            ${showPatient ? `<div>Patient: ${escapeHtml(patientName!.trim())}</div>` : ""}
            <div>Cashier: ${escapeHtml(cashierName)}</div>
            <div>Payment: ${escapeHtml(paymentMethod.toUpperCase())}</div>
            ${customer.insuranceType ? `<div>Insurance: ${escapeHtml(customer.insuranceType)}</div>` : ""}
          </div>
          ${lineRows}
          ${insuranceRows}
          <div class="total-row">
            <span>Total</span>
            <span>${amountDue.toLocaleString()} RWF</span>
          </div>
        </div>
        ${contactRows ? `<div class="contact">${contactRows}</div>` : ""}
        <div class="footer">
          ${footerText ? `<p>${escapeHtml(footerText)}</p>` : "<p>Thank you for your business</p>"}
          <p>Powered by Pryrox</p>
        </div>
      </div>
    </div>
  </body>
</html>`;
}

/**
 * Opens the browser print dialog for a POS receipt.
 * Uses a hidden iframe (popup blockers often block window.open after async work).
 */
export function printPosReceipt(input: PosReceiptInput): Promise<PrintReceiptResult> {
  if (typeof window === "undefined") {
    return Promise.resolve({ ok: false, error: "Print is only available in the browser" });
  }

  const html = buildPosReceiptHtml(input);

  return new Promise((resolve) => {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";
    document.body.appendChild(iframe);

    let settled = false;
    const finish = (result: PrintReceiptResult) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(fallbackTimer);
      window.setTimeout(() => {
        iframe.remove();
      }, 1000);
      resolve(result);
    };

    const win = iframe.contentWindow;
    const doc = win?.document;
    if (!win || !doc) {
      iframe.remove();
      finish({ ok: false, error: "Could not create print frame" });
      return;
    }

    const fallbackTimer = window.setTimeout(() => {
      finish({ ok: true });
    }, 60_000);

    win.onafterprint = () => {
      finish({ ok: true });
    };

    try {
      doc.open();
      doc.write(html);
      doc.close();

      window.requestAnimationFrame(() => {
        try {
          win.focus();
          win.print();
        } catch (err) {
          finish({
            ok: false,
            error: err instanceof Error ? err.message : "Print failed",
          });
        }
      });
    } catch (err) {
      finish({
        ok: false,
        error: err instanceof Error ? err.message : "Could not render receipt",
      });
    }
  });
}
