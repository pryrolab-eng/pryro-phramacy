/** Untitled-style sidebar tokens — shared across all dashboard roles. */

export const dashboardSidebarTokens = {
  brandIcon:
    "flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary text-primary-foreground shadow-sm",
  brandTitle: "truncate text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-50",
  brandSubtitle: "truncate text-xs text-neutral-500 dark:text-neutral-400",
  groupLabel:
    "px-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500",
  premiumLabel:
    "flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-600/90 dark:text-amber-500/90",
  navActive:
    "data-[active=true]:bg-primary data-[active=true]:font-medium data-[active=true]:text-primary-foreground hover:data-[active=true]:bg-primary/90",
  navItem:
    "h-9 rounded-lg text-sm text-neutral-700 hover:bg-primary/5 hover:text-primary dark:text-neutral-300 dark:hover:bg-primary/10 dark:hover:text-primary",
  navLocked:
    "h-9 rounded-lg text-sm text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800/50",
  upgradeCard:
    "relative mx-2 mb-1 overflow-hidden rounded-lg shadow-sm",
  footerUser:
    "rounded-lg hover:bg-primary/5 dark:hover:bg-primary/10",
  sidebarScroll: "sidebar-scroll",
  collapsedHidden: "group-data-[collapsible=icon]:hidden",
  collapsedOnly: "hidden group-data-[collapsible=icon]:block",
  /** Matches SidebarUserAccountMenu dropdown panel */
  sidebarPopover:
    "w-[min(100vw-2rem,20rem)] rounded-xl border border-border/80 bg-popover p-1.5 text-popover-foreground shadow-lg",
} as const;
