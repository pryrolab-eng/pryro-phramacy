"use client";

import { type ColumnDef } from "@tanstack/react-table";
import {
  Edit,
  MoreHorizontal,
  Package,
  QrCode,
  Trash2,
} from "lucide-react";

import { Badge, badgeVariantFromTone } from "@/components/ui/badge";
import { PRYROX_BRAND_BLUE } from "@/lib/brand/colors";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import {
  DashboardButton,
  DashboardProgressTrack,
} from "@/components/dashboard";

export type InventoryTableRow = {
  id: string;
  medicationId?: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  maxStock?: number;
  price: number;
  batchNumber: string;
  expiryDate: string;
};

function getStockStatus(stock: number, minStock: number): {
  label: string;
  variant: ReturnType<typeof badgeVariantFromTone>;
} {
  if (stock <= minStock)
    return { label: "Low Stock", variant: badgeVariantFromTone("danger") };
  if (stock <= minStock * 2)
    return { label: "Medium", variant: badgeVariantFromTone("warning") };
  return { label: "In Stock", variant: badgeVariantFromTone("success") };
}

function getExpiryStatus(expiryDate: string): {
  label: string;
  variant: ReturnType<typeof badgeVariantFromTone>;
} {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const daysToExpiry = Math.ceil(
    (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (daysToExpiry <= 30)
    return {
      label: `${daysToExpiry}d`,
      variant: badgeVariantFromTone("danger"),
    };
  if (daysToExpiry <= 60)
    return {
      label: `${daysToExpiry}d`,
      variant: badgeVariantFromTone("warning"),
    };
  return {
    label: `${daysToExpiry}d`,
    variant: badgeVariantFromTone("success"),
  };
}

export type InventoryColumnsOptions = {
  selectedIds: string[];
  allFilteredSelected: boolean;
  someFilteredSelected: boolean;
  onToggleSelectAll: (checked: boolean) => void;
  onToggleRow: (id: string, checked: boolean) => void;
  onEdit: (item: InventoryTableRow) => void;
  onGenerateBarcode: (item: InventoryTableRow) => void;
  onDelete: (id: string) => void;
};

export function inventoryColumns(
  opts: InventoryColumnsOptions,
): ColumnDef<InventoryTableRow>[] {
  return [
    {
      id: "select",
      header: () => (
        <Checkbox
          checked={
            opts.allFilteredSelected
              ? true
              : opts.someFilteredSelected
                ? "indeterminate"
                : false
          }
          onCheckedChange={(value) => opts.onToggleSelectAll(value === true)}
          aria-label="Select all matching products"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={opts.selectedIds.includes(row.original.id)}
          onCheckedChange={(value) =>
            opts.onToggleRow(row.original.id, value === true)
          }
          aria-label={`Select ${row.original.name}`}
          onClick={(e) => e.stopPropagation()}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      meta: { className: "w-12" },
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Product" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: PRYROX_BRAND_BLUE }}
          >
            <Package className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="font-medium">{row.original.name}</div>
            <div className="text-sm text-muted-foreground">
              Batch: {row.original.batchNumber}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Category" />
      ),
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.category}
        </Badge>
      ),
    },
    {
      id: "stock",
      accessorFn: (row) => row.stock,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Stock" />
      ),
      cell: ({ row }) => {
        const { stock, minStock, maxStock } = row.original;
        const stockPercentage =
          (stock / (maxStock || minStock * 3)) * 100;
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{stock}</span>
              <span className="text-sm text-muted-foreground">
                / {minStock} min
              </span>
            </div>
            <DashboardProgressTrack
              value={Math.min(stockPercentage, 100)}
              className="h-1"
            />
          </div>
        );
      },
    },
    {
      accessorKey: "price",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Price" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.price.toLocaleString()} RWF
        </span>
      ),
    },
    {
      id: "status",
      accessorFn: (row) => getStockStatus(row.stock, row.minStock).label,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const stockStatus = getStockStatus(
          row.original.stock,
          row.original.minStock,
        );
        return (
          <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
        );
      },
    },
    {
      id: "expiry",
      accessorFn: (row) => row.expiryDate,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Expiry" />
      ),
      cell: ({ row }) => {
        const expiryStatus = getExpiryStatus(row.original.expiryDate);
        return (
          <Badge variant={expiryStatus.variant}>{expiryStatus.label}</Badge>
        );
      },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <DashboardButton
                tone="ghost"
                className="h-8 w-8 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </DashboardButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => opts.onEdit(row.original)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => opts.onGenerateBarcode(row.original)}
              >
                <QrCode className="mr-2 h-4 w-4" />
                Generate Barcode
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => opts.onDelete(row.original.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
      enableSorting: false,
      meta: { className: "text-right" },
    },
  ];
}
