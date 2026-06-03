"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AdminPharmacyRow } from "@/lib/http/admin/pharmacies";
import {
  pharmacyAccessLabel,
  pharmacyAccessVariant,
  resolvePharmacyPlanDisplay,
  type CatalogPlanLike,
} from "@/lib/admin/plan-stats";

function formatDate(value: string | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

function PlanCellContent({
  pharmacy,
  catalog,
}: {
  pharmacy: AdminPharmacyRow;
  catalog: CatalogPlanLike[];
}) {
  const plan = resolvePharmacyPlanDisplay(
    {
      subscription_plan: String(pharmacy.subscription_plan ?? ""),
      catalog_plan_name: pharmacy.catalog_plan_name as string | null | undefined,
      catalog_plan_price: pharmacy.catalog_plan_price as number | null | undefined,
      is_free_plan: pharmacy.is_free_plan as boolean | null | undefined,
    },
    catalog,
  );
  const branchAddons = Number(pharmacy.branch_addons_active ?? 0);

  return (
    <div>
      <p className="font-medium leading-tight">{plan.name}</p>
      <div className="mt-1 flex flex-wrap items-center gap-1">
        <Badge
          variant={plan.isFree ? "secondary" : "outline"}
          className="font-normal"
        >
          {plan.priceLabel}
        </Badge>
        {branchAddons > 0 ? (
          <Badge variant="outline" className="font-normal text-muted-foreground">
            +{branchAddons} branch add-on{branchAddons === 1 ? "" : "s"}
          </Badge>
        ) : null}
      </div>
    </div>
  );
}

export type AdminStoresTableActions = {
  onView: (row: AdminPharmacyRow) => void;
  onEdit: (row: AdminPharmacyRow) => void;
  onDelete: (id: string, name: string) => void;
};

export function createAdminStoresColumns(
  catalog: CatalogPlanLike[],
  actions: AdminStoresTableActions,
): ColumnDef<AdminPharmacyRow>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Pharmacy" />
      ),
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div>
            <p className="font-medium">{String(p.name ?? "")}</p>
            <p className="font-mono text-xs text-muted-foreground">
              {String(p.license_number ?? "—")}
            </p>
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground md:hidden">
              {String(p.email ?? "")}
            </p>
          </div>
        );
      },
    },
    {
      id: "contact",
      header: "Contact",
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="hidden md:block">
            <p className="text-sm">{String(p.phone ?? "—")}</p>
            <p className="max-w-[200px] truncate text-xs text-muted-foreground">
              {String(p.email ?? "—")}
            </p>
          </div>
        );
      },
      meta: { className: "hidden md:table-cell" },
    },
    {
      id: "plan",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Plan" />
      ),
      accessorFn: (row) =>
        resolvePharmacyPlanDisplay(
          {
            subscription_plan: String(row.subscription_plan ?? ""),
            catalog_plan_name: row.catalog_plan_name as string | null | undefined,
            catalog_plan_price: row.catalog_plan_price as number | null | undefined,
            is_free_plan: row.is_free_plan as boolean | null | undefined,
          },
          catalog,
        ).name,
      cell: ({ row }) => (
        <PlanCellContent pharmacy={row.original} catalog={catalog} />
      ),
    },
    {
      id: "access",
      accessorFn: (row) =>
        String(row.access_label ?? row.access_status ?? row.status ?? "active"),
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Access" />
      ),
      cell: ({ row }) => {
        const p = row.original;
        const accessStatus = String(
          p.access_status ?? p.status ?? "active",
        );
        const accessLabel = String(
          p.access_label ??
            pharmacyAccessLabel(accessStatus),
        );
        return (
          <Badge variant={pharmacyAccessVariant(accessStatus)}>
            {accessLabel}
          </Badge>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Joined" />
      ),
      meta: { className: "hidden sm:table-cell" },
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.created_at)}
        </span>
      ),
    },
    {
      id: "actions",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const p = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => actions.onView(p)}>
                <Eye className="mr-2 h-4 w-4" />
                View details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onEdit(p)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() =>
                  actions.onDelete(p.id, String(p.name ?? "pharmacy"))
                }
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
