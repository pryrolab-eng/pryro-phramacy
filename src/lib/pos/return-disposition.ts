/** Pharmacy return disposition rules. */

export type ReturnDisposition = "restock" | "damaged" | "destroy";

export type ReturnReason =
  | "defective"
  | "expired"
  | "wrong"
  | "customer"
  | "other";

/** Reasons that must not return stock to sellable inventory. */
const NO_RESTOCK_REASONS: ReturnReason[] = ["expired", "defective"];

export function defaultDispositionForReason(
  reason: string,
): ReturnDisposition {
  if (reason === "expired") return "destroy";
  if (reason === "defective") return "damaged";
  return "restock";
}

export function isDispositionAllowed(
  reason: string,
  disposition: ReturnDisposition,
): boolean {
  if (disposition === "restock" && NO_RESTOCK_REASONS.includes(reason as ReturnReason)) {
    return false;
  }
  return true;
}

export function dispositionLabel(disposition: ReturnDisposition): string {
  switch (disposition) {
    case "restock":
      return "Return to sellable stock";
    case "damaged":
      return "Damaged (quarantine, not for sale)";
    case "destroy":
      return "Destroy / dispose";
  }
}

export function stockMovementTypeForDisposition(
  disposition: ReturnDisposition,
): string {
  switch (disposition) {
    case "restock":
      return "in";
    case "damaged":
      return "damaged";
    case "destroy":
      return "expired";
  }
}
