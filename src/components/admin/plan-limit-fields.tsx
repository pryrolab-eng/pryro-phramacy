"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  canEditPlanLimit,
  LIMIT_BOOLEAN_REQUIREMENTS,
} from "@/lib/subscription/plan-limit-alignment";

type LimitColumn = keyof typeof LIMIT_BOOLEAN_REQUIREMENTS;

type Props = {
  planType: "main" | "branch_addon";
  featureKeys: string[];
  maxBranches: number;
  maxUsers: number;
  monthlyTxLimit: number;
  onMaxBranchesChange: (value: number) => void;
  onMaxUsersChange: (value: number) => void;
  onMonthlyTxLimitChange: (value: number) => void;
};

const LIMIT_FIELDS: {
  column: LimitColumn;
  label: string;
  min: number;
  valueKey: "maxBranches" | "maxUsers" | "monthlyTxLimit";
  onChangeKey:
    | "onMaxBranchesChange"
    | "onMaxUsersChange"
    | "onMonthlyTxLimitChange";
}[] = [
  {
    column: "max_branches",
    label: "Max branches",
    min: 1,
    valueKey: "maxBranches",
    onChangeKey: "onMaxBranchesChange",
  },
  {
    column: "max_users",
    label: "Max users",
    min: 1,
    valueKey: "maxUsers",
    onChangeKey: "onMaxUsersChange",
  },
  {
    column: "monthly_tx_limit",
    label: "Tx / month",
    min: 0,
    valueKey: "monthlyTxLimit",
    onChangeKey: "onMonthlyTxLimitChange",
  },
];

export function PlanLimitFields({
  planType,
  featureKeys,
  maxBranches,
  maxUsers,
  monthlyTxLimit,
  onMaxBranchesChange,
  onMaxUsersChange,
  onMonthlyTxLimitChange,
}: Props) {
  const values = {
    maxBranches,
    maxUsers,
    monthlyTxLimit,
  };
  const handlers = {
    onMaxBranchesChange,
    onMaxUsersChange,
    onMonthlyTxLimitChange,
  };

  const visibleFields =
    planType === "branch_addon"
      ? LIMIT_FIELDS
      : LIMIT_FIELDS.filter((field) =>
          canEditPlanLimit(field.column, featureKeys),
        );

  if (visibleFields.length === 0) {
    return (
      <p className="text-xs text-muted-foreground rounded-md border border-dashed px-3 py-2">
        Limits appear when matching features are enabled above.
      </p>
    );
  }

  return (
    <div
      className={`grid gap-2 ${
        visibleFields.length === 1
          ? "grid-cols-1"
          : visibleFields.length === 2
            ? "grid-cols-1 sm:grid-cols-2"
            : "grid-cols-1 sm:grid-cols-3"
      }`}
    >
      {visibleFields.map((field) => (
        <div key={field.column} className="grid gap-2">
          <Label>{field.label}</Label>
          <Input
            type="number"
            min={field.min}
            value={values[field.valueKey]}
            onChange={(e) =>
              handlers[field.onChangeKey](Number(e.target.value) || field.min)
            }
          />
        </div>
      ))}
    </div>
  );
}
