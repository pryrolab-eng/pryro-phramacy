import type {
  EbmSalePayload,
  EbmSubmissionResult,
  VsdcClientConfig,
} from "@/lib/ebm/types";

function parseVsdcCredential(raw: string): Partial<VsdcClientConfig> | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown>;
      const baseUrl =
        typeof parsed.baseUrl === "string"
          ? parsed.baseUrl
          : typeof parsed.url === "string"
            ? parsed.url
            : "";
      const apiKey =
        typeof parsed.apiKey === "string"
          ? parsed.apiKey
          : typeof parsed.key === "string"
            ? parsed.key
            : "";
      if (!baseUrl || !apiKey) return null;
      return {
        baseUrl,
        apiKey,
        tin: typeof parsed.tin === "string" ? parsed.tin : null,
        sandbox: parsed.sandbox === true,
      };
    } catch {
      return null;
    }
  }
  return { apiKey: trimmed };
}

export function resolveVsdcClientConfig(input: {
  credentialValue: string;
  pharmacyTin?: string | null;
}): VsdcClientConfig | null {
  const parsed = parseVsdcCredential(input.credentialValue);
  if (!parsed?.apiKey) return null;

  const baseUrl =
    parsed.baseUrl ||
    process.env.RRA_VSDC_BASE_URL?.trim() ||
    process.env.RRA_EBM_BASE_URL?.trim() ||
    "";
  if (!baseUrl) return null;

  return {
    baseUrl: baseUrl.replace(/\/$/, ""),
    apiKey: parsed.apiKey,
    tin: input.pharmacyTin ?? parsed.tin ?? process.env.RRA_VSDC_TIN ?? null,
    sandbox:
      parsed.sandbox ??
      (process.env.RRA_VSDC_SANDBOX === "true" ||
        process.env.NODE_ENV !== "production"),
  };
}

export async function submitSaleToVsdc(
  config: VsdcClientConfig,
  payload: EbmSalePayload,
): Promise<EbmSubmissionResult> {
  const vatRate = payload.vatRate ?? 0.18;
  const taxableTotal = payload.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );
  const vatAmount = Math.round(taxableTotal * vatRate);

  const body = {
    tin: config.tin,
    receiptNumber: payload.receiptNumber,
    saleId: payload.saleId,
    customerName: payload.customerName,
    paymentMethod: payload.paymentMethod,
    items: payload.items.map((item) => ({
      itemName: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxClass: item.taxClass ?? "B",
      total: item.quantity * item.unitPrice,
    })),
    subtotal: payload.subtotal,
    vatAmount,
    totalAmount: payload.subtotal,
  };

  const endpoint = `${config.baseUrl}/api/v1/invoices`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
        "X-Pryrox-Source": "pryrox-pos",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20_000),
    });

    const raw = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        ok: false,
        mode: config.sandbox ? "sandbox" : "live",
        error:
          typeof raw === "object" &&
          raw &&
          "message" in raw &&
          typeof raw.message === "string"
            ? raw.message
            : `VSDC HTTP ${response.status}`,
        raw,
      };
    }

    const ebmNumber =
      typeof raw === "object" && raw
        ? String(
            ("ebmNumber" in raw && raw.ebmNumber) ||
              ("invoiceNumber" in raw && raw.invoiceNumber) ||
              ("fiscalReceiptNumber" in raw && raw.fiscalReceiptNumber) ||
              "",
          )
        : "";

    return {
      ok: true,
      mode: config.sandbox ? "sandbox" : "live",
      ebmNumber: ebmNumber || undefined,
      qrPayload:
        typeof raw === "object" && raw && "qrPayload" in raw
          ? String(raw.qrPayload ?? "")
          : undefined,
      vatAmount,
      totalAmount: payload.subtotal,
      raw,
    };
  } catch (error) {
    return {
      ok: false,
      mode: config.sandbox ? "sandbox" : "live",
      error: error instanceof Error ? error.message : "VSDC request failed",
    };
  }
}
