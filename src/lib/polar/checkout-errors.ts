type PolarDetail = {
  msg?: string;
  loc?: unknown[];
  type?: string;
};

function polarDetailList(error: unknown): PolarDetail[] | null {
  const raw = error instanceof Error ? error.message : String(error);
  const jsonStart = raw.indexOf("{");
  if (jsonStart < 0) return null;
  try {
    const parsed = JSON.parse(raw.slice(jsonStart)) as { detail?: PolarDetail[] };
    return Array.isArray(parsed.detail) ? parsed.detail : null;
  } catch {
    return null;
  }
}

function isCustomerEmailDetail(d: PolarDetail): boolean {
  const loc = d.loc;
  if (!Array.isArray(loc)) return false;
  return loc.some(
    (part) =>
      part === "customer_email" ||
      String(part).includes("customer_email"),
  );
}

/** Map Polar / SDK failures to short user-facing checkout messages. */
export function formatPolarCheckoutError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);

  const details = polarDetailList(error);
  if (details?.length) {
    const emailIssue = details.find(
      (d) =>
        isCustomerEmailDetail(d) &&
        (d.msg?.toLowerCase().includes("email") ?? false),
    );
    if (emailIssue) {
      return "Enter a valid email address with an @ sign (for example you@example.com).";
    }

    const readable = details
      .map((d) => d.msg?.trim())
      .filter((msg): msg is string => {
        if (!msg) return false;
        return (
          !msg.includes("function-after") && !msg.includes("Field required")
        );
      });
    if (readable.length > 0) {
      return readable[0];
    }
  }

  if (/not a valid email/i.test(raw) || raw.includes("@-sign")) {
    return "Enter a valid email address with an @ sign (for example you@example.com).";
  }

  if (/POLAR_ACCESS_TOKEN|not configured/i.test(raw)) {
    return "Card payments are not configured. Try Mobile Money or contact support.";
  }

  if (/already.*active.*subscription|active.*subscription.*already/i.test(raw)) {
    return "A previous subscription was found and cleared. Please try again.";
  }

  if (raw.startsWith("API error occurred:")) {
    return "Card checkout could not be started. Check your email and try again.";
  }

  return raw.length > 180
    ? "Card checkout could not be started. Please try again."
    : raw;
}
