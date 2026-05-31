"use client";

import { useState, type ReactNode } from "react";

import { DashboardSearchInput } from "@/components/dashboard/dashboard-search-input";
import { DashboardTableCard } from "@/components/dashboard/dashboard-table-card";
import {
  DataTable,
  type DataTableProps,
} from "@/components/ui/data-table";
import { cn } from "@/lib/utils";

export type DashboardDataTableProps<TData, TValue> = Omit<
  DataTableProps<TData, TValue>,
  "toolbar" | "className" | "tableClassName" | "showRowIndex"
> & {
  title: string;
  description?: string;
  action?: ReactNode;
  /** Search field in the card toolbar (client-side global filter). */
  searchPlaceholder?: string;
  /** Controlled search; use with `onSearchChange`. */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  /** Extra filters/actions beside search. */
  toolbar?: ReactNode;
  /** Content between toolbar and table (e.g. bulk selection bar). */
  tableHeader?: ReactNode;
  /** Leading `#` column. Default true. */
  showIndexColumn?: boolean;
  tableCardClassName?: string;
  tableClassName?: string;
};

/**
 * Admin/dashboard table: card shell, optional search, `#` column, pagination, sort, filter.
 */
export function DashboardDataTable<TData, TValue>({
  title,
  description,
  action,
  searchPlaceholder,
  searchValue: controlledSearch,
  onSearchChange,
  toolbar,
  tableHeader,
  showIndexColumn = true,
  tableCardClassName,
  tableClassName,
  columns,
  pagination = true,
  enableSorting = true,
  pageSize = 10,
  pageSizeOptions = [10, 20, 50],
  showRowCount = true,
  ...dataTableProps
}: DashboardDataTableProps<TData, TValue>) {
  const [internalSearch, setInternalSearch] = useState("");

  const hasBuiltInSearch = Boolean(searchPlaceholder);
  const globalFilter = hasBuiltInSearch
    ? (controlledSearch ?? internalSearch)
    : dataTableProps.globalFilter;
  const onGlobalFilterChange = hasBuiltInSearch
    ? (onSearchChange ?? setInternalSearch)
    : dataTableProps.onGlobalFilterChange;

  const cardToolbar =
    hasBuiltInSearch || toolbar ? (
      <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        {hasBuiltInSearch ? (
          <DashboardSearchInput
            placeholder={searchPlaceholder}
            value={globalFilter ?? ""}
            onChange={(e) => onGlobalFilterChange?.(e.target.value)}
            className="w-full min-w-0 sm:max-w-md sm:flex-1"
          />
        ) : null}
        {toolbar ? (
          <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto">
            {toolbar}
          </div>
        ) : null}
      </div>
    ) : undefined;

  return (
    <DashboardTableCard
      title={title}
      description={description}
      action={action}
      className={tableCardClassName}
      toolbar={cardToolbar}
    >
      {tableHeader}
      <div className={cn("min-w-0 px-3 pb-3 sm:px-4 sm:pb-4", tableHeader && "pt-0")}>
        <DataTable
          {...dataTableProps}
          columns={columns}
          showRowIndex={showIndexColumn}
          globalFilter={globalFilter}
          onGlobalFilterChange={onGlobalFilterChange}
          pagination={pagination}
          enableSorting={enableSorting}
          pageSize={pageSize}
          pageSizeOptions={pageSizeOptions}
          showRowCount={showRowCount}
          tableClassName={cn("border-0", tableClassName)}
        />
      </div>
    </DashboardTableCard>
  );
}
