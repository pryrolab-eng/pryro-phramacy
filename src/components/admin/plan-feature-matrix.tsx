"use client";

import { useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useAdminFeatures } from "@/hooks/useAdminFeatures";
import { Spinner } from "@/components/ui/spinner";

type Props = {
  selectedKeys: string[];
  onChange: (keys: string[]) => void;
  disabled?: boolean;
};

export function PlanFeatureMatrix({ selectedKeys, onChange, disabled }: Props) {
  const featuresQuery = useAdminFeatures();
  const selected = useMemo(() => new Set(selectedKeys), [selectedKeys]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof featuresQuery.data>();
    for (const f of featuresQuery.data ?? []) {
      if (f.feature_type !== "boolean" || !f.is_active) continue;
      const list = map.get(f.group) ?? [];
      list.push(f);
      map.set(f.group, list);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [featuresQuery.data]);

  if (featuresQuery.isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Spinner className="size-5" />
      </div>
    );
  }

  const toggle = (key: string, checked: boolean) => {
    const next = new Set(selected);
    if (checked) next.add(key);
    else next.delete(key);
    onChange(Array.from(next));
  };

  return (
    <div className="space-y-4 max-h-72 overflow-y-auto border rounded-md p-3">
      {grouped.map(([group, items]) => (
        <div key={group}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            {group}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {items?.map((f) => (
              <label
                key={f.key}
                className="flex items-start gap-2 text-sm cursor-pointer"
              >
                <Checkbox
                  checked={selected.has(f.key)}
                  disabled={disabled}
                  onCheckedChange={(v) => toggle(f.key, Boolean(v))}
                />
                <span>
                  <span className="font-medium">{f.display_name}</span>
                  {f.description ? (
                    <span className="block text-xs text-muted-foreground">
                      {f.description}
                    </span>
                  ) : null}
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
