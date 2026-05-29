"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { useActivePharmacy } from "@/components/providers/active-pharmacy-provider";
import { usePharmacyEntitlements } from "@/hooks/usePharmacyEntitlements";
import {
  buildCommandPaletteItems,
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

/** Reuses the global Ctrl/Cmd+B listener registered by SidebarProvider. */
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

/** Global ⌘K / Ctrl+K command palette for pharmacy dashboard routes. */
export function DashboardCommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { context, isHydrating: ctxHydrating } = useActivePharmacy();
  const {
    can,
    isHydrating: entHydrating,
    isEntitlementsReady,
    entitlements,
  } = usePharmacyEntitlements();

  const items = useMemo(
    () =>
      buildCommandPaletteItems(context.role, can, {
        isAccessAllowed: entitlements.isAccessAllowed,
        isEntitlementsReady,
      }),
    [context.role, can, entitlements.isAccessAllowed, isEntitlementsReady],
  );

  const { shortcuts, actions, navigation } = useMemo(
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

  const loading = ctxHydrating || entHydrating;
  const subscriptionInactive =
    isEntitlementsReady && !entitlements.isAccessAllowed;

  const renderItem = (item: CommandPaletteItem) => (
    <CommandItem
      key={item.id}
      value={`${item.label} ${item.keywords ?? ""} ${item.lockHint ?? ""}`}
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

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder={
          subscriptionInactive
            ? "Search — locked items go to billing…"
            : "Search pages and actions…"
        }
      />
      <CommandList>
        <CommandEmpty>
          {loading ? "Loading…" : "No matching commands."}
        </CommandEmpty>
        {shortcuts.length > 0 ? (
          <CommandGroup
            heading={
              subscriptionInactive ? "Shortcuts" : "Sidebar & shortcuts"
            }
          >
            {shortcuts.map(renderItem)}
          </CommandGroup>
        ) : null}
        {actions.length > 0 ? (
          <CommandGroup heading="Quick actions">
            {actions.map(renderItem)}
          </CommandGroup>
        ) : null}
        {navigation.length > 0 ? (
          <CommandGroup
            heading={
              subscriptionInactive ? "Go to (renew to unlock)" : "Go to"
            }
          >
            {navigation.map(renderItem)}
          </CommandGroup>
        ) : null}
      </CommandList>
      <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 border-t px-3 py-2 text-xs text-muted-foreground">
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
