/** Untitled-style sidebar tokens — shared across all dashboard roles. */

export const dashboardSidebarTokens = {
  brandIcon:
    "flex size-8 shrink-0 items-center justify-center rounded-lg border border-neutral-200/80 bg-neutral-900 text-white shadow-sm dark:border-neutral-700 dark:bg-neutral-100 dark:text-neutral-900",
  brandTitle: "truncate text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-50",
  brandSubtitle: "truncate text-xs text-neutral-500 dark:text-neutral-400",
  groupLabel:
    "px-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500",
  premiumLabel:
    "flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-600/90 dark:text-amber-500/90",
  navActive:
    "data-[active=true]:bg-neutral-900 data-[active=true]:font-medium data-[active=true]:text-white hover:data-[active=true]:bg-neutral-800 dark:data-[active=true]:bg-neutral-100 dark:data-[active=true]:text-neutral-900 dark:hover:data-[active=true]:bg-white",
  navItem:
    "h-9 rounded-lg text-sm text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800/80 dark:hover:text-neutral-50",
  navLocked:
    "h-9 rounded-lg text-sm text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800/50",
  upgradeCard:
    "relative mx-2 mb-1 overflow-hidden rounded-lg border border-neutral-200/80 bg-gradient-to-br from-neutral-50 to-white shadow-sm dark:border-neutral-800 dark:from-neutral-900/80 dark:to-neutral-950",
  footerUser:
    "rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/60",
  sidebarScroll: "sidebar-scroll",
  collapsedHidden: "group-data-[collapsible=icon]:hidden",
  collapsedOnly: "hidden group-data-[collapsible=icon]:block",
  /** Matches SidebarUserAccountMenu dropdown panel */
  sidebarPopover:
    "w-[min(100vw-2rem,20rem)] rounded-xl border border-border/80 bg-popover p-1.5 text-popover-foreground shadow-lg",
} as const;
