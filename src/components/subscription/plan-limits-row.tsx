import { Activity, GitBranch, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  maxUsers?: number;
  maxBranches?: number;
  monthlyTxLimit?: number;
  className?: string;
  compact?: boolean;
};

export function PlanLimitsRow({
  maxUsers,
  maxBranches,
  monthlyTxLimit,
  className,
  compact,
}: Props) {
  const hasAny =
    maxUsers != null || maxBranches != null || monthlyTxLimit != null;
  if (!hasAny) return null;

  const cellClass = cn(
    "rounded-lg bg-gray-50 dark:bg-gray-900/60 text-center",
    compact ? "px-2 py-1.5" : "px-2 py-2",
  );

  return (
    <div
      className={cn(
        "grid grid-cols-3 gap-2 text-xs",
        className,
      )}
    >
      {maxBranches != null ? (
        <div className={cellClass}>
          <GitBranch className="mx-auto mb-0.5 size-3.5 text-blue-600" />
          <div className="font-semibold text-gray-900 dark:text-white">
            {maxBranches}
          </div>
          <div className="text-[10px] text-gray-500">Branches</div>
        </div>
      ) : null}
      {maxUsers != null ? (
        <div className={cellClass}>
          <Users className="mx-auto mb-0.5 size-3.5 text-green-600" />
          <div className="font-semibold text-gray-900 dark:text-white">
            {maxUsers}
          </div>
          <div className="text-[10px] text-gray-500">Users</div>
        </div>
      ) : null}
      {monthlyTxLimit != null ? (
        <div className={cellClass}>
          <Activity className="mx-auto mb-0.5 size-3.5 text-purple-600" />
          <div className="font-semibold text-gray-900 dark:text-white">
            {monthlyTxLimit >= 1000
              ? `${Math.round(monthlyTxLimit / 1000)}k`
              : monthlyTxLimit}
          </div>
          <div className="text-[10px] text-gray-500">Tx/mo</div>
        </div>
      ) : null}
    </div>
  );
}
