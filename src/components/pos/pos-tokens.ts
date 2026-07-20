/** POS-specific layout tokens (extends dashboard kit). */

/** Cart lines visible before the list scrolls (see sidebarCartCap). */
export const POS_CART_SCROLL_AFTER_LINES = 5;

/** Show category chips up to this count; beyond → searchable combobox. */
export const POS_CATEGORY_CHIP_MAX = 10;

/** Stock at or below this is shown as low on product cards. */
export const POS_LOW_STOCK_THRESHOLD = 20;

/** Days until expiry included in POS alerts (sheet + export). */
export const POS_EXPIRY_ALERT_DAYS = 90;

/** Near-expiry label on catalog cards (only when urgent enough to show). */
export function formatPosNearExpiryLabel(daysToExpiry: number): string | null {
  if (daysToExpiry > 30) return null;
  if (daysToExpiry < 0) return "Expired";
  if (daysToExpiry === 0) return "Expires today";
  if (daysToExpiry === 1) return "Expires tomorrow";
  if (daysToExpiry <= 7) return "Expires this week";
  return `Expires soon · ${daysToExpiry}d`;
}

/** Full expiry wording for the alerts sheet (covers the 90-day window). */
export function formatPosExpiryAlertLabel(daysToExpiry: number): string {
  if (daysToExpiry < 0) return "Expired";
  if (daysToExpiry === 0) return "Expires today";
  if (daysToExpiry === 1) return "Expires tomorrow";
  if (daysToExpiry <= 7) return "Expires this week";
  if (daysToExpiry <= 30) return `Expires soon · ${daysToExpiry}d`;
  return `Expires in ${daysToExpiry}d`;
}

/** Portaled modals in full-window POS (overlay is z-[100]). */
export const POS_MODAL_LAYER_Z = 130;

/** Product catalog pagination sizes (even counts fit the card grid). */
export const POS_CATALOG_PAGE_SIZES = [10, 16, 20, 24, 30] as const;

export const POS_CATALOG_DEFAULT_PAGE_SIZE = 20;

export const posSurfaces = {
  /**
   * Tall panel (min-height), grows with cart/payment content.
   * Page scrolls — do not use a fixed height that squeezes the cart.
   */
  workspace:
    "flex flex-col overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900/60 lg:grid lg:min-h-[calc(100svh-12rem)] lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)] lg:grid-rows-1",
  /** Full-window POS — edge-to-edge, no outer chrome */
  workspaceFullscreen:
    "min-h-0 max-h-full flex-1 rounded-none border-0 shadow-none lg:min-h-0 lg:h-full lg:max-h-full lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)]",
  catalog:
    "flex min-h-0 min-w-0 flex-col border-b border-neutral-200/80 dark:border-neutral-800 lg:h-full lg:overflow-hidden lg:border-b-0 lg:border-r",
  catalogHeader:
    "shrink-0 space-y-2.5 border-b border-neutral-100 px-3 py-3 dark:border-neutral-800",
  catalogList:
    "min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3",
  catalogListFullscreen: "",
  catalogGrid: "grid grid-cols-2 gap-2 xl:grid-cols-3",
  catalogGridFullscreen: "grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5",
  catalogFooter:
    "mt-auto shrink-0 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 bg-neutral-50/50 px-3 py-3 dark:border-neutral-800 dark:bg-neutral-900/50",
  /** Right: natural height so cart lines are never collapsed */
  sidebar: "flex w-full min-h-0 flex-col overflow-hidden lg:h-full",
  sidebarTop: "relative z-20 shrink-0 space-y-2 overflow-visible px-3 pb-2 pt-3",
  sidebarCart:
    "flex min-h-[10rem] flex-1 flex-col overflow-y-auto overscroll-contain border-y border-neutral-100/80 px-3 py-3 dark:border-neutral-800",
  sidebarCartScroll: "",
  sidebarCartEmpty: "items-center justify-center",
  /** Cap only when many lines; otherwise cart keeps full natural height */
  sidebarCartCap: "",
  sidebarFooter:
    "shrink-0 space-y-2 border-t border-neutral-100 bg-neutral-50/40 px-3 py-3 dark:border-neutral-800 dark:bg-neutral-900/50",
  sidebarFooterFullscreen: "gap-1.5 space-y-1.5 py-2",
  fullscreenOverlay:
    "fixed inset-0 z-[100] box-border flex h-dvh max-h-dvh w-screen flex-col overflow-hidden bg-white pb-3 dark:bg-neutral-950",
  productCard:
    "group flex cursor-pointer flex-col gap-1 rounded-lg border border-neutral-200/80 p-2.5 text-left transition-colors hover:border-neutral-300 hover:bg-neutral-50/80 dark:border-neutral-800 dark:hover:border-neutral-700 dark:hover:bg-neutral-800/40",
  /** Fast movers — same card weight, light primary accent (no gradient) */
  productCardFast:
    "group relative flex cursor-pointer flex-col gap-1 rounded-lg border border-primary/30 bg-white p-2.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/[0.03] hover:shadow-sm active:translate-y-0 dark:border-primary/35 dark:bg-neutral-900 dark:hover:border-primary/50 dark:hover:bg-primary/10",
  productCardFastRank:
    "inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-primary px-1 text-[10px] font-bold tabular-nums text-primary-foreground",
  productCardMeta:
    "flex items-center justify-between gap-2 text-[11px] tabular-nums text-neutral-500",
  productCardPrice:
    "text-sm font-semibold tabular-nums text-neutral-900 dark:text-neutral-50",
  productCardExpiry:
    "text-[11px] font-medium text-amber-700 dark:text-amber-300",
  productCardStockLow:
    "font-medium text-orange-700 dark:text-orange-300",
  productCardStockOut:
    "font-medium text-red-600 dark:text-red-400",
  productCardLow:
    "border-orange-200/90 hover:border-orange-300 dark:border-orange-900/50 dark:hover:border-orange-800",
  cartLine:
    "flex items-start gap-2.5 rounded-lg border border-neutral-200/80 bg-neutral-50/30 p-2.5 dark:border-neutral-800 dark:bg-neutral-900/30",
  totalDisplay:
    "rounded-lg border border-primary/20 bg-primary px-3 py-2 text-primary-foreground",
  paymentGrid: "grid grid-cols-2 gap-1.5",
  paymentOption:
    "flex h-9 items-center justify-center gap-1.5 rounded-lg border border-primary/25 bg-white text-sm font-medium text-primary transition-colors hover:border-primary/40 hover:bg-primary/5",
  paymentOptionActive:
    "border-primary bg-primary text-primary-foreground shadow-sm hover:border-primary hover:bg-primary/90 hover:text-primary-foreground",
  categoryChip:
    "shrink-0 rounded-full border border-neutral-200/80 px-3 py-1 text-xs font-medium transition-colors dark:border-neutral-700",
  categoryChipActive:
    "border-primary bg-primary text-primary-foreground",
} as const;
