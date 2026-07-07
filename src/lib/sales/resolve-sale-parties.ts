import type { PrescriptionConfirmation } from "@/lib/pos/pharmacy-rules";
import { isWalkInCustomerLabel } from "@/lib/sales/customer-segment";

export function resolvePayerDisplayName(customerName?: string | null): string {
  const name = customerName?.trim();
  if (!name || isWalkInCustomerLabel(name)) {
    return "Walk-in Customer";
  }
  return name;
}

/** Clinical recipient on the sale — Rx patient or explicit patient; null for anonymous OTC. */
export function resolveSalePatientName(input: {
  prescriptionConfirmation?: PrescriptionConfirmation | null;
  explicitPatientName?: string | null;
}): string | null {
  const fromRx = input.prescriptionConfirmation?.patientName?.trim();
  if (fromRx) return fromRx;

  const explicit = input.explicitPatientName?.trim();
  if (explicit) return explicit;

  return null;
}

/** Insurance claims must use the patient/beneficiary, not necessarily the payer. */
export function resolveInsuranceClaimPatientName(input: {
  prescriptionConfirmation?: PrescriptionConfirmation | null;
  explicitPatientName?: string | null;
  customerName?: string | null;
}): string {
  return (
    resolveSalePatientName(input) ??
    resolvePayerDisplayName(input.customerName)
  );
}
