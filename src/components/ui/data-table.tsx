"use client";

import {
  type ColumnDef,
  type ColumnFiltersState,
  type OnChangeFn,
  type PaginationState,
  type Row,
  type SortingState,
  type Table as TanstackTable,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";

import { withDataTableIndexColumn } from "@/components/ui/data-table-index-column";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export type { ColumnDef, TanstackTable };

type ColumnMeta = { className?: string };

function columnMetaClass(meta: unknown): string | undefined {
  return (meta as ColumnMeta | undefined)?.className;
}

export type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  /** Show built-in pagination footer. Default true. */
  pagination?: boolean;
  /** Initial / default page size. Default 10. */
  pageSize?: number;
  pageSizeOptions?: number[];
  emptyMessage?: string;
  className?: string;
  tableClassName?: string;
  /** Enable column sorting. Default true. */
  enableSorting?: boolean;
  /** Global filter string (client-side). Controlled from parent. */
  globalFilter?: string;
  onGlobalFilterChange?: (value: string) => void;
  /** Row id for React keys. Default uses row index. */
  getRowId?: (row: TData, index: number) => string;
  /** Extra class on each row */
  getRowClassName?: (row: TData) => string | undefined;
  /** Rendered above the table (filters, actions). */
  toolbar?: React.ReactNode;
  /** Hide pagination row count text */
  showRowCount?: boolean;

  /** Server-side pagination */
  manualPagination?: boolean;
  pageCount?: number;
  /** Total row count for server-side pagination (footer + page count). */
  rowCount?: number;
  paginationState?: PaginationState;
  onPaginationChange?: OnChangeFn<PaginationState>;

  /** Show loading overlay instead of empty state */
  isLoading?: boolean;
  loadingMessage?: string;
  /** Error banner above the table */
  error?: string | null;
  /** Row click handler (adds pointer cursor) */
  onRowClick?: (row: TData) => void;
  /** Sticky table header when scrolling */
  stickyHeader?: boolean;
  /** Initial column sort */
  initialSorting?: SortingState;
  /** Controlled sorting (optional) */
  sortingState?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  /** Controlled column filters (optional) */
  columnFiltersState?: ColumnFiltersState;
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>;
  /** Hide table when loading and no data yet */
  hideTableWhileLoading?: boolean;
  /** Prepend a `#` column (pagination-aware row numbers). Default false. */
  showRowIndex?: boolean;
};

export function DataTable<TData, TValue>({
  columns,
  data,
  pagination = true,
  pageSize = 10,
  pageSizeOptions,
  emptyMessage = "No results.",
  className,
  tableClassName,
  enableSorting = true,
  globalFilter: globalFilterProp,
  onGlobalFilterChange,
  getRowId,
  getRowClassName,
  toolbar,
  showRowCount,
  manualPagination = false,
  pageCount,
  rowCount,
  paginationState: controlledPagination,
  onPaginationChange: onControlledPaginationChange,
  isLoading = false,
  loadingMessage = "Loading…",
  error = null,
  onRowClick,
  stickyHeader = false,
  initialSorting = [],
  sortingState: controlledSorting,
  onSortingChange: onControlledSortingChange,
  columnFiltersState: controlledColumnFilters,
  onColumnFiltersChange: onControlledColumnFiltersChange,
  hideTableWhileLoading = false,
  showRowIndex = false,
}: DataTableProps<TData, TValue>) {
  const resolvedColumns = useMemo(
    () =>
      showRowIndex
        ? withDataTableIndexColumn(columns as ColumnDef<TData>[])
        : columns,
    [columns, showRowIndex],
  );
  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [internalGlobalFilter, setInternalGlobalFilter] = useState("");
  const [internalPagination, setInternalPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });

  const globalFilter = globalFilterProp ?? internalGlobalFilter;
  const setGlobalFilter = onGlobalFilterChange ?? setInternalGlobalFilter;

  const paginationState = controlledPagination ?? internalPagination;
  const onPaginationChange =
    onControlledPaginationChange ?? setInternalPagination;

  const sortingState = controlledSorting ?? sorting;
  const onSortingChange = onControlledSortingChange ?? setSorting;

  const columnFiltersState = controlledColumnFilters ?? columnFilters;
  const onColumnFiltersChange =
    onControlledColumnFiltersChange ?? setColumnFilters;

  useEffect(() => {
    if (!controlledPagination) {
      setInternalPagination((prev) =>
        prev.pageSize === pageSize ? prev : { ...prev, pageSize },
      );
    }
  }, [pageSize, controlledPagination]);

  useEffect(() => {
    if (!controlledPagination) {
      setInternalPagination((prev) =>
        prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 },
      );
    }
  }, [globalFilter, controlledPagination]);

  const table = useReactTable({
    data,
    columns: resolvedColumns,
    getRowId,
    state: {
      sorting: sortingState,
      columnFilters: columnFiltersState,
      columnVisibility,
      globalFilter,
      pagination: paginationState,
    },
    onSortingChange,
    onColumnFiltersChange,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: pagination && !manualPagination
      ? getPaginationRowModel()
      : undefined,
    manualPagination,
    pageCount: manualPagination ? pageCount : undefined,
    rowCount: manualPagination ? rowCount : undefined,
    enableSorting,
  });

  const showTable = !(hideTableWhileLoading && isLoading && data.length === 0);

  const handleRowClick = (row: Row<TData>) => {
    if (!onRowClick) return;
    onRowClick(row.original);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {toolbar ? <div>{toolbar}</div> : null}
      {error ? (
        <p className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2" role="alert">
          {error}
        </p>
      ) : null}
      {showTable ? (
        <div className={cn("relative rounded-md border", tableClassName)}>
          {isLoading ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/60">
              <Spinner className="size-5" />
              <span className="sr-only">{loadingMessage}</span>
            </div>
          ) : null}
          <Table>
            <TableHeader
              className={cn(stickyHeader && "sticky top-0 z-[1] bg-background shadow-sm")}
            >
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className={columnMetaClass(header.column.columnDef.meta)}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={cn(
                      getRowClassName?.(row.original),
                      onRowClick && "cursor-pointer hover:bg-muted/50",
                    )}
                    onClick={() => handleRowClick(row)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={columnMetaClass(cell.column.columnDef.meta)}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={resolvedColumns.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {isLoading ? loadingMessage : emptyMessage}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      ) : null}
      {pagination && showTable ? (
        <DataTablePagination
          table={table}
          pageSizeOptions={pageSizeOptions}
          showRowCount={showRowCount}
        />
      ) : null}
    </div>
  );
}

/** Hook when you need the table instance (e.g. custom toolbar actions). */
export function useDataTable<TData, TValue>(
  options: Omit<DataTableProps<TData, TValue>, "toolbar" | "className" | "tableClassName">,
) {
  const [sorting, setSorting] = useState<SortingState>(options.initialSorting ?? []);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: options.pageSize ?? 10,
  });

  const table = useReactTable({
    data: options.data,
    columns: options.columns,
    getRowId: options.getRowId,
    state: {
      sorting: options.sortingState ?? sorting,
      columnFilters: options.columnFiltersState ?? columnFilters,
      columnVisibility,
      globalFilter: options.globalFilter ?? globalFilter,
      pagination: options.paginationState ?? pagination,
    },
    onSortingChange: options.onSortingChange ?? setSorting,
    onColumnFiltersChange: options.onColumnFiltersChange ?? setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: options.onGlobalFilterChange ?? setGlobalFilter,
    onPaginationChange: options.onPaginationChange ?? setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: options.enableSorting !== false ? getSortedRowModel() : undefined,
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel:
      options.pagination !== false && !options.manualPagination
        ? getPaginationRowModel()
        : undefined,
    manualPagination: options.manualPagination,
    pageCount: options.pageCount,
    enableSorting: options.enableSorting !== false,
  });

  return table;
}

