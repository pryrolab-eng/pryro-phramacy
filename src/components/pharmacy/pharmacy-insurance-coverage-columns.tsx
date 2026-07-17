"use client";

import { useEffect, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import type { InsuranceCoveredMedicationRow } from "@/lib/http/insurance-covered-medications";

export type PharmacyInsuranceCoverageColumnOptions = {
  onToggle: (med: InsuranceCoveredMedicationRow, covered: boolean) => void;
  onExternalCode: (
    med: InsuranceCoveredMedicationRow,
    externalCode: string | null,
  ) => void;
};

function InsurerCodeCell({
  med,
  onExternalCode,
}: {
  med: InsuranceCoveredMedicationRow;
  onExternalCode: (code: string | null) => void;
}) {
  const [code, setCode] = useState(med.externalCode ?? "");

  useEffect(() => {
    setCode(med.externalCode ?? "");
  }, [med.externalCode, med.id]);

  return (
    <Input
      className="h-8 max-w-[200px]"
      placeholder={med.covered ? "e.g. RSSB code" : "—"}
      value={code}
      disabled={!med.covered}
      onChange={(e) => setCode(e.target.value)}
      onBlur={() => {
        const trimmed = code.trim() || null;
        if (trimmed !== (med.externalCode ?? null)) {
          onExternalCode(trimmed);
        }
      }}
    />
  );
}

export function pharmacyInsuranceCoverageColumns(
  opts: PharmacyInsuranceCoverageColumnOptions,
): ColumnDef<InsuranceCoveredMedicationRow>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Product" />
      ),
      cell: ({ row }) => (
        <span className="flex flex-wrap items-center gap-2 font-medium">
          {row.original.name}
          {row.original.covered ? (
            <Badge variant="success" className="text-[10px] font-normal">
              Covered
            </Badge>
          ) : null}
        </span>
      ),
    },
    {
      accessorKey: "category",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Category" />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground capitalize">
          {row.original.category ?? "—"}
        </span>
      ),
    },
    {
      id: "covered",
      accessorFn: (row) => (row.covered ? 1 : 0),
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Covered" />
      ),
      cell: ({ row }) => (
        <Switch
          checked={row.original.covered}
          onCheckedChange={(checked) => opts.onToggle(row.original, checked)}
          aria-label={`Covered for insurer: ${row.original.name}`}
        />
      ),
      enableSorting: true,
    },
    {
      id: "externalCode",
      accessorKey: "externalCode",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Insurer code" />
      ),
      cell: ({ row }) => (
        <InsurerCodeCell
          med={row.original}
          onExternalCode={(code) => opts.onExternalCode(row.original, code)}
        />
      ),
      enableSorting: false,
    },
  ];
}
