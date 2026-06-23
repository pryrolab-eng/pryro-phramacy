const API_KEY_HASH_PREFIX = "sha256:";

async function sha256Hex(data: string): Promise<string> {
  const encoded = new TextEncoder().encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashApiKeySecret(secret: string): Promise<string> {
  return `${API_KEY_HASH_PREFIX}${await sha256Hex(secret)}`;
}

export function isHashedApiKeySecret(value: string | null | undefined): boolean {
  return typeof value === "string" && value.startsWith(API_KEY_HASH_PREFIX);
}
