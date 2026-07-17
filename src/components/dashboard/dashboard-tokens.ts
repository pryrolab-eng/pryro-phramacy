/** Shared Untitled-style class tokens for dashboard UI. Import here — do not duplicate in pages. */

export const dashboardSurfaces = {
  page: "flex min-h-full min-w-0 flex-1 flex-col bg-neutral-50/80 dark:bg-neutral-950/40",
  pageInner:
    "mx-auto w-full min-w-0 max-w-[1400px] space-y-4 p-4 sm:space-y-6 sm:p-6 md:p-8",
  card: "rounded-xl border border-neutral-200/80 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900/60",
  sectionHeader:
    "flex flex-col gap-3 border-b border-neutral-100 px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:px-5 sm:py-4 dark:border-neutral-800",
  sectionBody: "p-4 sm:p-5",
  toolbar:
    "flex w-full min-w-0 flex-wrap items-center gap-2 rounded-lg border border-neutral-200/80 bg-neutral-50/80 p-2 sm:gap-1.5 sm:p-1.5 dark:border-neutral-800 dark:bg-neutral-900/40",
  pill: "inline-flex h-8 items-center gap-2 rounded-lg border border-neutral-200/80 bg-neutral-50 px-2.5 text-xs font-medium text-neutral-700 shadow-sm dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-200",
  iconBox:
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-neutral-200/80 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800/50",
  empty:
    "flex min-h-[280px] flex-col items-center justify-center rounded-lg border border-dashed border-neutral-200 bg-neutral-50/50 px-6 py-10 text-center dark:border-neutral-700 dark:bg-neutral-900/20",
  tabsList:
    "h-9 w-fit border border-neutral-200/80 bg-white p-1 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/60",
  listRow:
    "flex items-center justify-between rounded-lg border border-neutral-200/80 p-3 dark:border-neutral-800",
  dialog:
    "gap-0 overflow-hidden rounded-xl border border-neutral-200/80 bg-white p-0 shadow-xl dark:border-neutral-800 dark:bg-neutral-900",
  dialogHeader:
    "border-b border-neutral-100 px-5 py-4 dark:border-neutral-800",
  dialogBody: "space-y-4 px-5 py-4",
  dialogFooter:
    "flex flex-col-reverse gap-2 border-t border-neutral-100 px-5 py-4 sm:flex-row sm:justify-end sm:gap-2 dark:border-neutral-800",
} as const;

export const dashboardDialogText = {
  title: "text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-50",
  description: "text-sm text-neutral-500 dark:text-neutral-400",
} as const;

export const dashboardText = {
  title: "text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-xl",
  description: "text-sm text-neutral-500 dark:text-neutral-400",
  sectionTitle: "text-sm font-semibold text-neutral-900 dark:text-neutral-50",
  sectionDescription: "text-xs text-neutral-500",
  statLabel: "text-xs font-medium uppercase tracking-wide text-neutral-500",
  statValue:
    "text-2xl font-semibold tabular-nums tracking-tight text-neutral-900 dark:text-neutral-50",
  statHint: "text-xs text-neutral-500",
} as const;

/** Shared top chrome — sidebar brand row + main shell bar must match height/border. */
export const dashboardChrome = {
  height: "h-[var(--dashboard-chrome-height)]",
  border: "border-b border-neutral-200/80 dark:border-neutral-800",
  sidebarHeader:
    "flex shrink-0 flex-col justify-center gap-0 px-2 py-0 border-b border-neutral-200/80 dark:border-neutral-800",
  shellBar:
    "z-20 flex shrink-0 flex-wrap items-center gap-2 border-b border-neutral-200/80 bg-white/90 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:border-neutral-800 dark:bg-neutral-950/90 sm:gap-3 sm:px-4 md:flex-nowrap md:px-6 md:py-0",
} as const;

export const dashboardButtonClass = {
  outline:
    "h-8 rounded-lg border-primary/25 bg-white px-3 text-primary shadow-sm hover:bg-primary/5 dark:border-primary/30 dark:bg-transparent dark:text-primary dark:hover:bg-primary/10",
  primary:
    "h-8 rounded-lg bg-primary px-3 text-primary-foreground shadow-sm hover:bg-primary/90",
  ghost:
    "h-8 rounded-lg px-3 text-neutral-600 hover:bg-primary/5 hover:text-primary dark:text-neutral-300 dark:hover:bg-primary/10",
  destructive:
    "h-8 rounded-lg bg-red-600 px-3 text-white shadow-sm hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700",
} as const;

/** Default chart palette aligned with dashboard neutrals + blue accent */
export const dashboardChartColors = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(220 60% 65%)",
  muted: "hsl(220 20% 75%)",
} as const;
