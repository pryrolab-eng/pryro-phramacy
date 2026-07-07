/** POS-specific layout tokens (extends dashboard kit). */

/** Cart lines visible before the list scrolls (see sidebarCartCap). */
export const POS_CART_SCROLL_AFTER_LINES = 5;

/** Product catalog pagination sizes (increments of 5). */
export const POS_CATALOG_PAGE_SIZES = [5, 10, 15, 20, 25, 30] as const;

export const POS_CATALOG_DEFAULT_PAGE_SIZE = 10;

export const posSurfaces = {  workspace:
    "grid gap-3 lg:min-h-[calc(100dvh-12rem)] lg:grid-cols-[minmax(0,1fr)_400px] lg:grid-rows-1 lg:gap-0 lg:overflow-hidden",
  catalog:
    "flex min-w-0 flex-col rounded-xl border border-neutral-200/80 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900/60 lg:h-full lg:min-h-0 lg:overflow-hidden lg:rounded-r-none lg:border-r-0",
  catalogHeader:
    "shrink-0 space-y-3 border-b border-neutral-100 px-4 py-4 dark:border-neutral-800",
  catalogList:
    "max-h-[min(58vh,720px)] overflow-y-auto overscroll-contain px-3 py-3 lg:max-h-none lg:min-h-0 lg:flex-1",
  catalogFooter:
    "shrink-0 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 bg-neutral-50/50 px-4 py-2.5 dark:border-neutral-800 dark:bg-neutral-900/50",
  sidebar:
    "flex w-full flex-col rounded-xl border border-neutral-200/80 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900/60 lg:h-full lg:min-h-0 lg:overflow-hidden lg:rounded-l-none",
  sidebarTop: "shrink-0 space-y-4 overflow-visible px-4 pb-2 pt-4",
  sidebarCart:
    "shrink-0 overflow-y-auto overscroll-contain border-y border-neutral-100/80 px-4 py-3 dark:border-neutral-800",
  /** ~5 line items tall (card + gap); apply when cart.length > POS_CART_SCROLL_AFTER_LINES */
  sidebarCartCap: "max-h-[29rem]",
  sidebarFooter:
    "shrink-0 space-y-4 border-t border-neutral-100 bg-neutral-50/50 px-4 py-4 dark:border-neutral-800 dark:bg-neutral-900/80",
  productCard:
    "group flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200/80 p-3 transition-colors hover:border-neutral-300 hover:bg-neutral-50/80 dark:border-neutral-800 dark:hover:border-neutral-700 dark:hover:bg-neutral-800/40",
  cartLine:
    "flex items-start gap-3 rounded-xl border border-neutral-200/80 bg-neutral-50/30 p-3 dark:border-neutral-800 dark:bg-neutral-900/30",
  totalDisplay:
    "rounded-xl border border-neutral-200/80 bg-neutral-900 px-4 py-3 text-white dark:border-neutral-700 dark:bg-neutral-100 dark:text-neutral-900",
  paymentGrid: "grid grid-cols-2 gap-2",
  paymentOption:
    "flex h-10 items-center justify-center gap-2 rounded-lg border border-neutral-200/80 bg-white text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-neutral-100 hover:text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:border-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-50",
  paymentOptionActive:
    "border-neutral-900 bg-neutral-900 text-white shadow-sm hover:border-neutral-900 hover:bg-neutral-800 hover:text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:border-neutral-100 dark:hover:bg-neutral-200 dark:hover:text-neutral-900",
  categoryChip:
    "shrink-0 rounded-full border border-neutral-200/80 px-3 py-1 text-xs font-medium transition-colors dark:border-neutral-700",
  categoryChipActive:
    "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900",
} as const;
