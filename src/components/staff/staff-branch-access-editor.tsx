"use client";

import { useEffect, useState } from "react";
import { GitBranch } from "lucide-react";
import { useSaasBranches } from "@/hooks/useSaasSubscription";
import {
  getStaffBranchAccess,
  updateStaffBranchAccess,
} from "@/lib/http/staff-branches";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";

type Props = {
  pharmacyUserId: string | null;
  disabled?: boolean;
};

export function StaffBranchAccessEditor({ pharmacyUserId, disabled }: Props) {
  const branchesQuery = useSaasBranches();
  const branches = branchesQuery.data ?? [];
  const [loading, setLoading] = useState(false);
  const [unrestricted, setUnrestricted] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (!pharmacyUserId) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const access = await getStaffBranchAccess(pharmacyUserId);
        if (cancelled) return;
        setUnrestricted(access.unrestricted);
        setSelected(access.branchIds);
      } catch {
        if (!cancelled) {
          setUnrestricted(true);
          setSelected([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pharmacyUserId]);

  const persist = async (nextUnrestricted: boolean, nextSelected: string[]) => {
    if (!pharmacyUserId) return;
    await updateStaffBranchAccess(
      pharmacyUserId,
      nextUnrestricted ? [] : nextSelected,
    );
  };

  if (!pharmacyUserId) return null;

  if (loading || branchesQuery.isPending) {
    return (
      <div className="flex items-center gap-2 py-2 text-sm text-neutral-500">
        <Spinner className="h-4 w-4" />
        Loading branch access…
      </div>
    );
  }

  if (branches.length <= 1) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-neutral-500">
        <GitBranch className="h-3.5 w-3.5" />
        Single branch — access is automatic.
      </p>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-dashed border-neutral-200/80 bg-neutral-50/50 p-3 dark:border-neutral-700 dark:bg-neutral-800/30">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Branch access</Label>
          <p className="text-xs text-neutral-500">
            Restrict which branches this person can switch to in the app.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs text-neutral-500">All branches</span>
          <Switch
            checked={unrestricted}
            disabled={disabled}
            onCheckedChange={async (checked) => {
              setUnrestricted(checked);
              try {
                await persist(checked, selected);
              } catch {
                setUnrestricted(!checked);
              }
            }}
          />
        </div>
      </div>

      {!unrestricted ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {branches.map((b) => {
            const checked = selected.includes(b.id);
            return (
              <label
                key={b.id}
                className="flex items-center gap-2 text-sm cursor-pointer"
              >
                <Checkbox
                  checked={checked}
                  disabled={disabled}
                  onCheckedChange={async (isChecked) => {
                    const next = isChecked
                      ? [...selected, b.id]
                      : selected.filter((id) => id !== b.id);
                    setSelected(next);
                    try {
                      await persist(false, next);
                    } catch {
                      setSelected(selected);
                    }
                  }}
                />
                <span className="truncate">{b.name}</span>
              </label>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
