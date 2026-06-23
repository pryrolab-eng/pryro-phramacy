"use client";

import * as React from "react";
import { CommandShortcut } from "@/components/ui/command";
import type { CommandPaletteItem } from "@/lib/dashboard/command-palette-items";
import { MIN_GLOBAL_SEARCH_LENGTH } from "@/lib/search/escape-ilike";

export function PaletteShortcut({ keys }: { keys: string[] }) {
  return (
    <span className="ml-auto flex items-center gap-0.5">
      {keys.map((key) => (
        <CommandShortcut key={key} className="inline">
          {key}
        </CommandShortcut>
      ))}
    </span>
  );
}

/** Reuses the global Ctrl/Cmd+B listener registered by SidebarProvider. */
export function toggleSidebarFromPalette() {
  const isMac =
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad/i.test(navigator.platform);
  window.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "b",
      code: "KeyB",
      ctrlKey: !isMac,
      metaKey: isMac,
      bubbles: true,
      cancelable: true,
    }),
  );
}

export function useCommandPaletteHotkey(
  setOpen: React.Dispatch<React.SetStateAction<boolean>>,
) {
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setOpen]);
}

export function filterPaletteItems(
  items: CommandPaletteItem[],
  query: string,
): CommandPaletteItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => {
    const haystack = [
      item.label,
      item.keywords,
      item.href,
      item.lockHint,
      item.id,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function isGlobalSearchQuery(query: string): boolean {
  return query.trim().length >= MIN_GLOBAL_SEARCH_LENGTH;
}

export function hasPharmacySearchHits(
  data:
    | {
        customers: unknown[];
        products: unknown[];
        prescriptions: unknown[];
        sales: unknown[];
        staff?: unknown[];
        branches?: unknown[];
      }
    | undefined,
): boolean {
  if (!data) return false;
  return (
    data.customers.length > 0 ||
    data.products.length > 0 ||
    data.prescriptions.length > 0 ||
    data.sales.length > 0 ||
    (data.staff?.length ?? 0) > 0 ||
    (data.branches?.length ?? 0) > 0
  );
}
