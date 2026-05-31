"use client";

import { cn } from "@/lib/utils";
import {
  ADMIN_SETTINGS_NAV_GROUPS,
  type AdminSettingsNavItem,
} from "@/components/admin/settings/admin-settings-nav-config";
import type { AdminSettingsTabValue } from "@/lib/admin-settings-tabs";

type Props = {
  activeTab: AdminSettingsTabValue;
  onTabChange: (tab: AdminSettingsTabValue) => void;
};

function NavButton({
  item,
  active,
  onSelect,
}: {
  item: AdminSettingsNavItem;
  active: boolean;
  onSelect: (id: AdminSettingsTabValue) => void;
}) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      className={cn(
        "flex w-full items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors lg:whitespace-normal",
        active
          ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50"
          : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/50 dark:hover:text-neutral-100",
      )}
    >
      <Icon className="size-4 shrink-0 opacity-70" strokeWidth={1.75} />
      {item.label}
    </button>
  );
}

/** Side nav — same layout as pharmacy {@link SettingsNav}. */
export function AdminSettingsNav({ activeTab, onTabChange }: Props) {
  return (
    <nav className="w-full shrink-0 lg:w-[220px]" aria-label="Admin settings">
      <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-1 scroll-smooth lg:sticky lg:top-6 lg:mx-0 lg:flex-col lg:gap-6 lg:overflow-visible lg:px-0 lg:pb-0">
        {ADMIN_SETTINGS_NAV_GROUPS.map((group) => (
          <div key={group.label} className="min-w-[140px] shrink-0 lg:min-w-0">
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.id}>
                  <NavButton
                    item={item}
                    active={item.id === activeTab}
                    onSelect={onTabChange}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
