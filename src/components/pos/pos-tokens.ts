/** POS-specific layout tokens (extends dashboard kit). */

export const posSurfaces = {
  workspace:
    "flex min-h-[calc(100dvh-10rem)] flex-col gap-4 lg:flex-row lg:gap-0 lg:overflow-hidden",
  catalog:
    "flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900/60 lg:rounded-r-none lg:border-r-0",
  catalogHeader:
    "shrink-0 space-y-3 border-b border-neutral-100 px-4 py-4 dark:border-neutral-800",
  catalogBody: "min-h-0 flex-1 overflow-y-auto px-3 py-3",
  sidebar:
    "flex w-full shrink-0 flex-col overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900/60 lg:w-[400px] lg:rounded-l-none",
  sidebarScroll: "min-h-0 flex-1 overflow-y-auto px-4 py-4",
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
    "flex h-10 items-center justify-center gap-2 rounded-lg border border-neutral-200/80 bg-white text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800",
  paymentOptionActive:
    "border-neutral-900 bg-neutral-900 text-white shadow-sm dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900",
  categoryChip:
    "shrink-0 rounded-full border border-neutral-200/80 px-3 py-1 text-xs font-medium transition-colors dark:border-neutral-700",
  categoryChipActive:
    "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900",
} as const;
