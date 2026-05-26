import { fetchJson } from "./client";

export const polarKeys = {
  all: ["polar"] as const,
  config: () => [...polarKeys.all, "config"] as const,
  checkoutStatus: (checkoutId: string) =>
    [...polarKeys.all, "status", checkoutId] as const,
};

export type PolarConfig = {
  enabled?: boolean;
};

export type PolarCheckoutStatus = {
  status: string;
};

export async function getPolarConfig(): Promise<PolarConfig> {
  try {
    return await fetchJson<PolarConfig>("/api/polar/config", {
      credentials: "include",
    });
  } catch {
    return { enabled: false };
  }
}

export async function getPolarCheckoutStatus(
  checkoutId: string,
): Promise<PolarCheckoutStatus> {
  return fetchJson<PolarCheckoutStatus>(
    `/api/polar/status?checkoutId=${encodeURIComponent(checkoutId)}`,
    { credentials: "include" },
  );
}
