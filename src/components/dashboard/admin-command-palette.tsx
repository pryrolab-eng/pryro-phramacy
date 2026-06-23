"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { CommandPaletteAdminResults } from "@/components/dashboard/command-palette-admin-results";
import {
  filterPaletteItems,
  isGlobalSearchQuery,
  PaletteShortcut,
  toggleSidebarFromPalette,
  useCommandPaletteHotkey,
} from "@/components/dashboard/command-palette-utils";
import { useAdminGlobalSearch } from "@/hooks/useGlobalSearch";
import {
  buildAdminCommandPaletteItems,
  groupCommandPaletteItems,
  type CommandPaletteItem,
} from "@/lib/dashboard/command-palette-items";
import { MIN_GLOBAL_SEARCH_LENGTH } from "@/lib/search/escape-ilike";

/** Global Ctrl+K — search platform data, admin pages, and shortcuts. */
export function AdminCommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useCommandPaletteHotkey(setOpen);

  const items = useMemo(() => buildAdminCommandPaletteItems(), []);
  const { shortcuts, navigation } = useMemo(
    () => groupCommandPaletteItems(items),
    [items],
  );

  const filteredShortcuts = useMemo(
    () => filterPaletteItems(shortcuts, query),
    [shortcuts, query],
  );
  const filteredNavigation = useMemo(
    () => filterPaletteItems(navigation, query),
    [navigation, query],
  );

  const searchQuery = useAdminGlobalSearch(query, open);
  const searching = isGlobalSearchQuery(query);
  const searchData = searchQuery.data;
  const hasDataHits =
    (searchData?.pharmacies.length ?? 0) > 0 ||
    (searchData?.staff?.length ?? 0) > 0 ||
    (searchData?.branches?.length ?? 0) > 0;

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

  const hasStaticHits =
    filteredShortcuts.length > 0 || filteredNavigation.length > 0;

  const emptyMessage = (() => {
    if (searching && (searchQuery.isDebouncing || searchQuery.isFetching)) {
      return "Searching…";
    }
    if (searching && !hasDataHits && !hasStaticHits) {
      return `No results for "${query.trim()}".`;
    }
    if (!hasStaticHits && !searching) return "No matching commands.";
    return "No matching commands.";
  })();

  const renderItem = (item: CommandPaletteItem) => (
    <CommandItem
      key={item.id}
      value={item.id}
      keywords={[
        item.label,
        item.id,
        item.href,
        ...(item.keywords?.split(/\s+/) ?? []),
      ].filter((k): k is string => Boolean(k))}
      onSelect={() => runItem(item)}
    >
      <item.icon className="mr-2 h-4 w-4 text-neutral-500" />
      <span>{item.label}</span>
      {item.shortcutKeys?.length ? (
        <PaletteShortcut keys={item.shortcutKeys} />
      ) : null}
    </CommandItem>
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Global search"
      description="Search pharmacies, admin pages, and shortcuts"
      shouldFilter={false}
    >
      <CommandInput
        placeholder="Search pharmacies, pages, settings…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>{emptyMessage}</CommandEmpty>

        {searching && (searchQuery.isDebouncing || searchQuery.isFetching) ? (
          <CommandGroup heading="Search results">
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
              Searching…
            </div>
          </CommandGroup>
        ) : null}

        {searching && searchData && !searchQuery.isDebouncing ? (
          hasDataHits ? (
            <CommandPaletteAdminResults
              data={searchData}
              onNavigate={navigate}
            />
          ) : (
            <CommandGroup heading="Search results">
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                No results found for &ldquo;{query.trim()}&rdquo;.
              </div>
            </CommandGroup>
          )
        ) : null}

        {filteredShortcuts.length > 0 ? (
          <CommandGroup heading="Sidebar & shortcuts">
            {filteredShortcuts.map(renderItem)}
          </CommandGroup>
        ) : null}
        {filteredNavigation.length > 0 ? (
          <CommandGroup heading="Go to">{filteredNavigation.map(renderItem)}</CommandGroup>
        ) : null}
      </CommandList>
      <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 border-t px-3 py-2 text-xs text-muted-foreground">
        <span>
          Type {MIN_GLOBAL_SEARCH_LENGTH}+ chars for search
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
