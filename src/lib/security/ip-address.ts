/** Normalize client IP for comparison (trim, lowercase IPv6). */
export function normalizeIp(ip: string): string {
  const trimmed = ip.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("::ffff:")) {
    return trimmed.slice(7);
  }
  return trimmed.toLowerCase();
}

/** Best-effort client IP from reverse-proxy headers. */
export function getClientIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return normalizeIp(first);
  }
  const realIp = headers.get("x-real-ip");
  if (realIp) return normalizeIp(realIp);
  const cfIp = headers.get("cf-connecting-ip");
  if (cfIp) return normalizeIp(cfIp);
  return "";
}

const IPV4_RE =
  /^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)$/;

const IPV4_CIDR_RE =
  /^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\/(?:[0-9]|[1-2][0-9]|3[0-2])$/;

/** Wildcard entry — permits any client address when whitelist is enabled. */
export const ALLOW_ALL_IPV4_CIDR = "0.0.0.0/0";

const ALLOW_ALL_ENTRIES = new Set([ALLOW_ALL_IPV4_CIDR, "::/0"]);

export function isAllowAllIpEntry(value: string): boolean {
  return ALLOW_ALL_ENTRIES.has(value.trim().toLowerCase());
}

export function allowlistPermitsAnyIp(allowed: string[]): boolean {
  return allowed.some((entry) => isAllowAllIpEntry(entry));
}

/** Accepts IPv4, IPv4 CIDR, or common IPv6 literals. */
export function isValidIpOrCidr(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  if (IPV4_RE.test(v) || IPV4_CIDR_RE.test(v)) return true;
  if (v.includes(":")) {
    return /^[0-9a-f:.]+$/i.test(v);
  }
  return false;
}

function ipv4ToInt(ip: string): number | null {
  if (!IPV4_RE.test(ip)) return null;
  const parts = ip.split(".").map((p) => Number(p));
  return (
    ((parts[0]! << 24) >>> 0) +
    ((parts[1]! << 16) >>> 0) +
    ((parts[2]! << 8) >>> 0) +
    (parts[3]! >>> 0)
  );
}

function ipv4InCidr(ip: string, cidr: string): boolean {
  const [network, bitsStr] = cidr.split("/");
  const bits = Number(bitsStr);
  if (!network || Number.isNaN(bits) || bits < 0 || bits > 32) return false;
  const ipInt = ipv4ToInt(normalizeIp(ip));
  const netInt = ipv4ToInt(normalizeIp(network));
  if (ipInt === null || netInt === null) return false;
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (ipInt & mask) === (netInt & mask);
}

/** True when `clientIp` matches any allowed entry (exact or IPv4 CIDR). */
export function ipMatchesAllowlist(
  clientIp: string,
  allowed: string[],
): boolean {
  if (allowlistPermitsAnyIp(allowed)) return true;

  const normalizedClient = normalizeIp(clientIp);
  if (!normalizedClient) return false;

  for (const entry of allowed) {
    const rule = entry.trim();
    if (!rule) continue;
    if (rule.includes("/")) {
      if (ipv4InCidr(normalizedClient, rule)) return true;
      continue;
    }
    if (normalizeIp(rule) === normalizedClient) return true;
  }
  return false;
}
