/**
 * Inline SVG placeholder images for insurance template designer defaults.
 * Avoids external network calls to via.placeholder.com.
 */

function svgPlaceholder(text: string, bg: string, fg: string, w: number, h: number): string {
  const safe = text.replace(/\+/g, " ");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="${bg}"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="${fg}" font-family="Arial, sans-serif" font-size="${Math.round(Math.min(w, h) / 6)}" font-weight="bold">${safe}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const PLACEHOLDER_LOGO = svgPlaceholder("Logo", "#3b82f6", "#ffffff", 100, 100);
export const PLACEHOLDER_SEAL = svgPlaceholder("SEAL", "#10b981", "#ffffff", 80, 80);
export const PLACEHOLDER_INSURANCE = svgPlaceholder("INSURANCE", "#1e40af", "#ffffff", 150, 60);
export const PLACEHOLDER_RW = svgPlaceholder("RW", "#dc2626", "#ffffff", 60, 60);
export const PLACEHOLDER_SIGNATURE = svgPlaceholder("SIGNATURE", "#059669", "#ffffff", 100, 40);
export const PLACEHOLDER_MOH = svgPlaceholder("MOH", "#7c3aed", "#ffffff", 100, 100);
export const PLACEHOLDER_STAMP = svgPlaceholder("OFFICIAL STAMP", "#dc2626", "#ffffff", 80, 40);
