/** Pryrox brand accent — plan card, inventory icons, key CTAs. */
export const PRYROX_BRAND_BLUE = "#003459";

/** Lighter brand tint for comparison / secondary chart series. */
export const PRYROX_BRAND_BLUE_LIGHT = "#5a8aad";

/** Mid tint — customer distribution pie (insurance segment). */
export const PRYROX_BRAND_BLUE_MID = "#2d6a8f";

/** Pale tint — customer distribution pie (walk-in segment). */
export const PRYROX_BRAND_BLUE_PALE = "#8fb3cc";

/** Pie / donut segments derived from brand blue. */
export const PRYROX_CUSTOMER_CHART_COLORS = {
  walkIn: PRYROX_BRAND_BLUE_PALE,
  regular: PRYROX_BRAND_BLUE,
  insurance: PRYROX_BRAND_BLUE_MID,
} as const;
