"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { Crown, Edit } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { DashboardButton } from "@/components/dashboard";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { Switch } from "@/components/ui/switch";
import { formatPlanPriceSuffix } from "@/lib/subscription/plan-period";

export type SubscriptionPlanTableRow = {
  id: string;
  name: string;
  price: number;
  period: string;
  billing_period: string;
  billing_cadence: "monthly" | "yearly";
  plan_type: "main" | "branch_addon";
  users: number;
  popular: boolean;
  is_active: boolean;
  max_branches: number;
  max_users: number;
  monthly_tx_limit: number;
  polar_product_id: string;
};

type ColumnOptions = {
  onEdit: (plan: SubscriptionPlanTableRow) => void;
  onToggleActive: (plan: SubscriptionPlanTableRow, active: boolean) => void;
  togglingPlanId: string | null;
};

export function adminSubscriptionPlanColumns(
  opts: ColumnOptions,
): ColumnDef<SubscriptionPlanTableRow>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Plan" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{row.original.name}</span>
          {row.original.popular ? (
            <Crown className="h-3.5 w-3.5 text-amber-600" aria-label="Popular" />
          ) : null}
        </div>
      ),
    },
    {
      id: "type",
      header: "Type",
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.plan_type === "branch_addon" ? "secondary" : "outline"
          }
        >
          {row.original.plan_type === "branch_addon"
            ? "Branch add-on"
            : "Main plan"}
        </Badge>
      ),
    },
    {
      id: "price",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Price" />
      ),
      cell: ({ row }) => {
        const p = row.original;
        if (p.price === 0) return "Free";
        const suffix = formatPlanPriceSuffix({
          price: p.price,
          period: p.period,
          billingPeriod: p.billing_period,
        });
        return (
          <span>
            RWF {p.price.toLocaleString()}
            {suffix ? (
              <span className="text-muted-foreground text-xs">{suffix}</span>
            ) : null}
          </span>
        );
      },
    },
    {
      accessorKey: "users",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Subscribers" />
      ),
    },
    {
      id: "limits",
      header: "Limits",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {row.original.max_branches} br · {row.original.max_users} users ·{" "}
          {row.original.monthly_tx_limit} tx
        </span>
      ),
    },
    {
      accessorKey: "is_active",
      header: "Offered",
      cell: ({ row }) => (
        <Switch
          checked={row.original.is_active}
          disabled={opts.togglingPlanId === row.original.id}
          onCheckedChange={(checked) =>
            opts.onToggleActive(row.original, checked)
          }
        />
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <DashboardButton
          tone="outline"
          size="sm"
          onClick={() => opts.onEdit(row.original)}
        >
          <Edit className="mr-1 h-4 w-4" strokeWidth={1.75} />
          Edit
        </DashboardButton>
      ),
      meta: { className: "text-right" },
    },
  ];
}
