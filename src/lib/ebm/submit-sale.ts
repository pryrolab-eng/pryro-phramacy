import { findPlatformIntegrationCredential } from "@/lib/integrations/platform-credentials";
import { prisma } from "@/lib/db/prisma";
import {
  resolveVsdcClientConfig,
  submitSaleToVsdc,
} from "@/lib/ebm/vsdc-client";
import type { EbmLineItem, EbmSubmissionResult } from "@/lib/ebm/types";

export async function submitPharmacySaleToEbm(input: {
  pharmacyId: string;
  saleId: string;
  receiptNumber: string;
  customerName?: string | null;
  paymentMethod?: string | null;
  subtotal: number;
  items: EbmLineItem[];
}): Promise<EbmSubmissionResult> {
  const credential = await findPlatformIntegrationCredential("RRA EBM API");
  if (!credential?.key_hash) {
    return {
      ok: false,
      mode: "disabled",
      error:
        'RRA EBM API credential not configured. Add a platform key named "RRA EBM API" in Admin → Settings → Integrations.',
    };
  }

  const pharmacy = await prisma.pharmacies.findUnique({
    where: { id: input.pharmacyId },
    select: { rra_tin: true, name: true },
  });

  const config = resolveVsdcClientConfig({
    credentialValue: credential.key_hash,
    pharmacyTin: pharmacy?.rra_tin,
  });

  if (!config) {
    return {
      ok: false,
      mode: "disabled",
      error:
        "VSDC base URL missing. Set RRA_VSDC_BASE_URL or store JSON { baseUrl, apiKey } in the RRA EBM API credential.",
    };
  }

  const result = await submitSaleToVsdc(config, {
    pharmacyId: input.pharmacyId,
    pharmacyTin: pharmacy?.rra_tin,
    receiptNumber: input.receiptNumber,
    saleId: input.saleId,
    customerName: input.customerName,
    paymentMethod: input.paymentMethod,
    items: input.items,
    subtotal: input.subtotal,
  });

  if (result.ok && result.ebmNumber) {
    await prisma.sales.update({
      where: { id: input.saleId },
      data: { rra_invoice_number: result.ebmNumber },
    });
  }

  return result;
}
