"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SETTINGS_NAV_GROUPS,
  SETTINGS_TAB_FEATURE_KEYS,
  type SettingsNavItem,
} from "@/components/settings/settings-nav-config";
import type { SettingsTabValue } from "@/lib/settings-tabs";
import { usePharmacyEntitlements } from "@/hooks/usePharmacyEntitlements";
import { UpgradePlanDialog } from "@/components/subscription/upgrade-plan-dialog";

type Props = {
  activeTab: SettingsTabValue;
  onTabChange: (tab: SettingsTabValue) => void;
};

function NavButton({
  item,
  active,
  locked,
  onSelect,
}: {
  item: SettingsNavItem;
  active: boolean;
  locked?: boolean;
  onSelect: (id: SettingsTabValue) => void;
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
        locked && !active && "opacity-80",
      )}
    >
      <Icon
        className={cn("size-4 shrink-0", locked ? "opacity-50" : "opacity-70")}
        strokeWidth={1.75}
      />
      <span className={locked ? "opacity-90" : undefined}>{item.label}</span>
      {locked ? (
        <Lock className="ml-auto size-3 shrink-0 text-neutral-400" />
      ) : null}
    </button>
  );
}

function FeatureNavItem({
  item,
  featureKey,
  activeTab,
  onTabChange,
}: {
  item: SettingsNavItem;
  featureKey: string;
  activeTab: SettingsTabValue;
  onTabChange: (tab: SettingsTabValue) => void;
}) {
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const { can, isHydrating, isEntitlementsReady, featureLabel } =
    usePharmacyEntitlements();
  const allowed = isEntitlementsReady && can(featureKey);
  const active = allowed && item.id === activeTab;
  const locked = isEntitlementsReady && !allowed;

  return (
    <li>
      <NavButton
        item={item}
        active={active}
        locked={!isHydrating && locked}
        onSelect={() => {
          if (isHydrating) return;
          if (allowed) {
            onTabChange(item.id);
            return;
          }
          setUpgradeOpen(true);
        }}
      />
      <UpgradePlanDialog
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        featureLabel={featureLabel(featureKey)}
      />
    </li>
  );
}

export function SettingsNav({ activeTab, onTabChange }: Props) {
  return (
    <nav className="w-full shrink-0 lg:w-[220px]" aria-label="Settings">
      <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-1 scroll-smooth lg:sticky lg:top-6 lg:mx-0 lg:flex-col lg:gap-6 lg:overflow-visible lg:px-0 lg:pb-0">
        {SETTINGS_NAV_GROUPS.map((group) => (
          <div key={group.label} className="min-w-[140px] shrink-0 lg:min-w-0">
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const featureKey = SETTINGS_TAB_FEATURE_KEYS[item.id];
                if (featureKey) {
                  return (
                    <FeatureNavItem
                      key={item.id}
                      item={item}
                      featureKey={featureKey}
                      activeTab={activeTab}
                      onTabChange={onTabChange}
                    />
                  );
                }
                return (
                  <li key={item.id}>
                    <NavButton
                      item={item}
                      active={item.id === activeTab}
                      onSelect={onTabChange}
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
