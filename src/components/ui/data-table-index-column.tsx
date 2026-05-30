import { type ColumnDef } from "@tanstack/react-table";

export const DATA_TABLE_INDEX_COLUMN_ID = "__row_index";

/** Leading `#` column — row number respects pagination and sort/filter order. */
export function createDataTableIndexColumn<TData>(): ColumnDef<TData> {
  return {
    id: DATA_TABLE_INDEX_COLUMN_ID,
    header: () => (
      <span className="text-xs font-medium text-neutral-500">#</span>
    ),
    cell: ({ row, table }) => {
      const { pageIndex, pageSize } = table.getState().pagination;
      const index = pageIndex * pageSize + row.index + 1;
      return (
        <span className="tabular-nums text-xs font-medium text-neutral-500">
          {index}
        </span>
      );
    },
    enableSorting: false,
    enableGlobalFilter: false,
    enableHiding: false,
    meta: { className: "w-12 text-center" },
  };
}

export function withDataTableIndexColumn<TData>(
  columns: ColumnDef<TData>[],
): ColumnDef<TData>[] {
  if (columns.some((c) => c.id === DATA_TABLE_INDEX_COLUMN_ID)) {
    return columns;
  }
  return [createDataTableIndexColumn<TData>(), ...columns];
}
