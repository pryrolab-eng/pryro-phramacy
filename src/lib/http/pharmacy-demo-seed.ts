import type { SeedPharmacyDemoResult } from "@/lib/seed/seed-pharmacy-demo";

export async function seedPharmacyDemoData(): Promise<SeedPharmacyDemoResult> {
  const res = await fetch("/api/pharmacy/seed-demo-data", { method: "POST" });
  const body = (await res.json()) as {
    success: boolean;
    error?: string;
    result?: SeedPharmacyDemoResult;
  };

  if (!res.ok || !body.success || !body.result) {
    throw new Error(body.error ?? "Failed to load demo data");
  }

  return body.result;
}
