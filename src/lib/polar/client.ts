import { Polar } from "@polar-sh/sdk";

export function isPolarConfigured(): boolean {
  return Boolean(process.env.POLAR_ACCESS_TOKEN?.trim());
}

export function getPolarServer(): "production" | "sandbox" {
  return process.env.POLAR_SERVER === "production" ? "production" : "sandbox";
}

export function getPolarClient(): Polar {
  const token = process.env.POLAR_ACCESS_TOKEN?.trim();
  if (!token) {
    throw new Error("Polar is not configured (POLAR_ACCESS_TOKEN missing).");
  }
  return new Polar({
    accessToken: token,
    server: getPolarServer(),
  });
}

export function polarSuccessUrl(returnContext: string): string {
  const base = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
  return `${base}/payment-success?provider=polar&return=${encodeURIComponent(returnContext)}&checkout_id={CHECKOUT_ID}`;
}
