"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { CommandPalettePharmacyResults } from "@/components/dashboard/command-palette-pharmacy-results";
import {
  filterPaletteItems,
  hasPharmacySearchHits,
  isGlobalSearchQuery,
  PaletteShortcut,
  toggleSidebarFromPalette,
  useCommandPaletteHotkey,
} from "@/components/dashboard/command-palette-utils";
import { useActivePharmacy } from "@/components/providers/active-pharmacy-provider";
import { usePharmacyEntitlements } from "@/hooks/usePharmacyEntitlements";
import { usePharmacyGlobalSearch } from "@/hooks/useGlobalSearch";
import {
  buildCommandPaletteItems,
  groupCommandPaletteItems,
  type CommandPaletteItem,
} from "@/lib/dashboard/command-palette-items";
import { MIN_GLOBAL_SEARCH_LENGTH } from "@/lib/search/escape-ilike";

/** Global Ctrl+K — search pages, shortcuts, and pharmacy data. */
export function DashboardCommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { context, isHydrating: ctxHydrating } = useActivePharmacy();
  const {
    can,
    isHydrating: entHydrating,
    isEntitlementsReady,
    entitlements,
  } = usePharmacyEntitlements();

  useCommandPaletteHotkey(setOpen);

  const items = useMemo(
    () =>
      buildCommandPaletteItems(context.role, can, {
        isAccessAllowed: entitlements.isAccessAllowed,
        isEntitlementsReady,
        accessBlockReason: entitlements.accessBlockReason,
      }),
    [
      context.role,
      can,
      entitlements.isAccessAllowed,
      entitlements.accessBlockReason,
      isEntitlementsReady,
    ],
  );

  const { shortcuts, actions, navigation } = useMemo(
    () => groupCommandPaletteItems(items),
    [items],
  );

  const filteredShortcuts = useMemo(
    () => filterPaletteItems(shortcuts, query),
    [shortcuts, query],
  );
  const filteredActions = useMemo(
    () => filterPaletteItems(actions, query),
    [actions, query],
  );
  const filteredNavigation = useMemo(
    () => filterPaletteItems(navigation, query),
    [navigation, query],
  );

  const searchQuery = usePharmacyGlobalSearch(query, open);
  const searching = isGlobalSearchQuery(query);
  const searchData = searchQuery.data;
  const hasDataHits = hasPharmacySearchHits(searchData);

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (!next) setQuery("");
  }, []);

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      router.push(href);
    },
    [router],
  );

  const runItem = useCallback(
    (item: CommandPaletteItem) => {
      setOpen(false);
      setQuery("");
      if (item.action === "toggle-sidebar") {
        toggleSidebarFromPalette();
        return;
      }
      if (item.href) {
        router.push(item.href);
      }
    },
    [router],
  );

  const loading = ctxHydrating || entHydrating;
  const subscriptionInactive =
    isEntitlementsReady && !entitlements.isAccessAllowed;

  const hasStaticHits =
    filteredShortcuts.length > 0 ||
    filteredActions.length > 0 ||
    filteredNavigation.length > 0;

  const renderItem = (item: CommandPaletteItem) => (
    <CommandItem
      key={item.id}
      value={item.id}
      keywords={[
        item.label,
        item.id,
        item.href,
        item.lockHint,
        ...(item.keywords?.split(/\s+/) ?? []),
      ].filter((k): k is string => Boolean(k))}
      onSelect={() => runItem(item)}
    >
      <item.icon className="mr-2 h-4 w-4 text-neutral-500" />
      <span className={item.locked ? "opacity-80" : undefined}>{item.label}</span>
      {item.shortcutKeys?.length ? (
        <PaletteShortcut keys={item.shortcutKeys} />
      ) : null}
      {item.locked ? (
        <>
          <Lock className="ml-auto h-3 w-3 text-muted-foreground" />
          <span className="sr-only">{item.lockHint}</span>
        </>
      ) : null}
    </CommandItem>
  );

  const emptyMessage = (() => {
    if (loading) return "Loading…";
    if (searching && (searchQuery.isDebouncing || searchQuery.isFetching)) {
      return "Searching…";
    }
    if (searching && !hasDataHits && !hasStaticHits) {
      return `No results for "${query.trim()}".`;
    }
    if (!hasStaticHits && !searching) return "No matching commands.";
    if (!hasStaticHits && searching && !hasDataHits) {
      return `No results for "${query.trim()}".`;
    }
    return "No matching commands.";
  })();

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Global search"
      description="Search pharmacy data, pages, and shortcuts"
      shouldFilter={false}
    >
      <CommandInput
        placeholder={
          subscriptionInactive
            ? "Search customers, products, pages…"
            : "Search customers, products, prescriptions, sales, pages…"
        }
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>{emptyMessage}</CommandEmpty>

        {searching && (searchQuery.isDebouncing || searchQuery.isFetching) ? (
          <CommandGroup heading="Results">
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
              Searching…
            </div>
          </CommandGroup>
        ) : null}

        {searching && searchData && !searchQuery.isDebouncing ? (
          <CommandPalettePharmacyResults
            data={searchData}
            onNavigate={navigate}
          />
        ) : null}

        {filteredShortcuts.length > 0 ? (
          <CommandGroup
            heading={
              subscriptionInactive ? "Shortcuts" : "Sidebar & shortcuts"
            }
          >
            {filteredShortcuts.map(renderItem)}
          </CommandGroup>
        ) : null}
        {filteredActions.length > 0 ? (
          <CommandGroup heading="Quick actions">
            {filteredActions.map(renderItem)}
          </CommandGroup>
        ) : null}
        {filteredNavigation.length > 0 ? (
          <CommandGroup
            heading={
              subscriptionInactive ? "Go to (renew to unlock)" : "Go to"
            }
          >
            {filteredNavigation.map(renderItem)}
          </CommandGroup>
        ) : null}
      </CommandList>
      <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 border-t px-3 py-2 text-xs text-muted-foreground">
        <span>
          Type {MIN_GLOBAL_SEARCH_LENGTH}+ chars for data
        </span>
        <span>
          <CommandShortcut className="inline">↑↓</CommandShortcut> navigate
        </span>
        <span>
          <CommandShortcut className="inline">↵</CommandShortcut> open
        </span>
        <span>
          <CommandShortcut className="inline">esc</CommandShortcut> close
        </span>
      </div>
    </CommandDialog>
  );
}
