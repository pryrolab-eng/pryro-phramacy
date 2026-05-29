/** CSS variables applied while a pharmacy tenant is active in the dashboard. */

export const PHARMACY_BRAND_CSS_VARS = {
  primary: "--pharmacy-primary",
  primaryMuted: "--pharmacy-primary-muted",
} as const;

export function applyPharmacyBrandingTheme(primaryColor: string) {
  const root = document.documentElement;
  root.style.setProperty(PHARMACY_BRAND_CSS_VARS.primary, primaryColor);
  root.style.setProperty(PHARMACY_BRAND_CSS_VARS.primaryMuted, `${primaryColor}1a`);
}

export function clearPharmacyBrandingTheme() {
  const root = document.documentElement;
  root.style.removeProperty(PHARMACY_BRAND_CSS_VARS.primary);
  root.style.removeProperty(PHARMACY_BRAND_CSS_VARS.primaryMuted);
}
