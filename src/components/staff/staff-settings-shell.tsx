"use client";

import { cn } from "@/lib/utils";
import type { StaffSettingsTabValue } from "@/lib/staff-settings-tabs";
import {
  Building2,
  Shield,
  User,
} from "lucide-react";

const TABS: Array<{
  id: StaffSettingsTabValue;
  label: string;
  icon: typeof User;
}> = [
  { id: "workplace", label: "Workplace", icon: Building2 },
  { id: "account", label: "Account", icon: User },
  { id: "security", label: "Security", icon: Shield },
];

type Props = {
  activeTab: StaffSettingsTabValue;
  onTabChange: (tab: StaffSettingsTabValue) => void;
  children: React.ReactNode;
};

export function StaffSettingsShell({
  activeTab,
  onTabChange,
  children,
}: Props) {
  return (
    <div className="mx-auto flex w-full min-w-0 max-w-5xl flex-col gap-6 p-4 sm:p-6 md:flex-row md:p-8">
      <nav className="w-full shrink-0 md:w-48" aria-label="My settings">
        <p className="mb-3 hidden text-xs font-medium uppercase tracking-wide text-muted-foreground md:block">
          My settings
        </p>
        <ul className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 scroll-smooth md:mx-0 md:flex-col md:overflow-visible md:px-0 md:pb-0">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = tab.id === activeTab;
            return (
              <li key={tab.id}>
                <button
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                    active
                      ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50"
                      : "text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800/50",
                  )}
                >
                  <Icon className="size-4 shrink-0 opacity-70" />
                  {tab.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
