"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  buildAdminCommandPaletteItems,
  groupCommandPaletteItems,
  type CommandPaletteItem,
} from "@/lib/dashboard/command-palette-items";

function PaletteShortcut({ keys }: { keys: string[] }) {
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

function toggleSidebarFromPalette() {
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

/** Global Ctrl+K command palette for platform admin routes. */
export function AdminCommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const items = useMemo(() => buildAdminCommandPaletteItems(), []);
  const { shortcuts, navigation } = useMemo(
    () => groupCommandPaletteItems(items),
    [items],
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const runItem = useCallback(
    (item: CommandPaletteItem) => {
      setOpen(false);
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

  const renderItem = (item: CommandPaletteItem) => (
    <CommandItem
      key={item.id}
      value={`${item.label} ${item.keywords ?? ""}`}
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
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search admin pages…" />
      <CommandList>
        <CommandEmpty>No matching commands.</CommandEmpty>
        {shortcuts.length > 0 ? (
          <CommandGroup heading="Sidebar & shortcuts">
            {shortcuts.map(renderItem)}
          </CommandGroup>
        ) : null}
        {navigation.length > 0 ? (
          <CommandGroup heading="Go to">{navigation.map(renderItem)}</CommandGroup>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}
