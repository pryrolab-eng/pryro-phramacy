export type PharmacyReceiptProfile = {
  name: string;
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
  licenseNumber?: string;
};

export type PharmacyReceiptLine = {
  name: string;
  quantity?: number;
  lineTotal: number;
};

export function pharmacyInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "RX";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export function pharmacyLocationLine(profile: PharmacyReceiptProfile): string {
  return [profile.city?.trim(), profile.address?.trim()].filter(Boolean).join(" · ");
}

export function hasReceiptText(value?: string): value is string {
  return Boolean(value?.trim());
}
