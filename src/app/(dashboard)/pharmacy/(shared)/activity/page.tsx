"use client";



import { useEffect, useMemo, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import type { PaginationState, Updater } from "@tanstack/react-table";

import { useActivityLogs, activityLogsKeys } from "@/hooks/useActivityLogs";

import { useDebouncedValue } from "@/hooks/useDebouncedValue";

import { auditTableLabel } from "@/lib/audit/format-activity-log";

import { createActivityLogColumns } from "@/components/pharmacy/activity-log-columns";

import {

  DashboardPageHeader,

  DashboardPageShell,

  DashboardMetricGrid,

  DashboardStatCard,

  DashboardTableCard,

  DashboardSearchInput,

  DashboardFilterBar,

  DashboardFilterField,

  DashboardListFooterPagination,

  DashboardPanelEmpty,

  DashboardPageLoading,

  DashboardButton,

  DashboardListRow,

} from "@/components/dashboard";

import { Badge } from "@/components/ui/badge";

import { DataTable } from "@/components/ui/data-table";

import {

  Select,

  SelectContent,

  SelectItem,

  SelectTrigger,

  SelectValue,

} from "@/components/ui/select";

import { Input } from "@/components/ui/input";

import { FeatureGate } from "@/components/subscription/feature-gate";

import {

  History,

  Plus,

  Pencil,

  Trash2,

  RefreshCw,

  X,

} from "lucide-react";

import { ApiError } from "@/lib/http/client";

import { cn } from "@/lib/utils";



function actionVariant(

  action: string,

): "default" | "secondary" | "destructive" | "outline" {

  if (action === "DELETE") return "destructive";

  if (action === "INSERT") return "default";

  return "secondary";

}



function formatLogTime(iso: string | null) {

  if (!iso) return "—";

  return new Date(iso).toLocaleString(undefined, {

    dateStyle: "short",

    timeStyle: "short",

  });

}



export default function ActivityPage() {

  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);

  const [pageSize, setPageSize] = useState(25);

  const [searchTerm, setSearchTerm] = useState("");

  const [actionFilter, setActionFilter] = useState("all");

  const [tableFilter, setTableFilter] = useState("all");

  const [userFilter, setUserFilter] = useState("all");

  const [fromDate, setFromDate] = useState("");

  const [toDate, setToDate] = useState("");



  const debouncedSearch = useDebouncedValue(searchTerm.trim(), 300);

  const columns = useMemo(() => createActivityLogColumns(), []);



  const hasActiveFilters =

    Boolean(debouncedSearch) ||

    actionFilter !== "all" ||

    tableFilter !== "all" ||

    userFilter !== "all" ||

    Boolean(fromDate) ||

    Boolean(toDate);



  useEffect(() => {

    setPage(1);

  }, [

    debouncedSearch,

    actionFilter,

    tableFilter,

    userFilter,

    fromDate,

    toDate,

    pageSize,

  ]);



  const queryFilters = useMemo(

    () => ({

      offset: (page - 1) * pageSize,

      limit: pageSize,

      action: actionFilter,

      table: tableFilter,

      userId: userFilter,

      q: debouncedSearch || undefined,

      from: fromDate || undefined,

      to: toDate || undefined,

      facets: true,

    }),

    [

      page,

      pageSize,

      actionFilter,

      tableFilter,

      userFilter,

      debouncedSearch,

      fromDate,

      toDate,

    ],

  );



  const logsQuery = useActivityLogs(queryFilters);

  const items = logsQuery.data?.items ?? [];

  const total = logsQuery.data?.total ?? 0;

  const stats = logsQuery.data?.stats;

  const facets = logsQuery.data?.facets;

  const pageCount = Math.max(1, Math.ceil(total / pageSize) || 1);



  const paginationState = useMemo<PaginationState>(

    () => ({ pageIndex: page - 1, pageSize }),

    [page, pageSize],

  );



  const handlePaginationChange = (updater: Updater<PaginationState>) => {

    const next =

      typeof updater === "function" ? updater(paginationState) : updater;

    setPage(next.pageIndex + 1);

    setPageSize(next.pageSize);

  };



  const auditLogsDisabled =

    logsQuery.error instanceof ApiError &&

    logsQuery.error.status === 403 &&

    logsQuery.error.message === "audit_logs_disabled";



  const clearFilters = () => {

    setSearchTerm("");

    setActionFilter("all");

    setTableFilter("all");

    setUserFilter("all");

    setFromDate("");

    setToDate("");

    setPage(1);

  };



  const refresh = () => {

    void queryClient.invalidateQueries({ queryKey: activityLogsKeys.all });

  };



  if (logsQuery.isPending && !logsQuery.data) {

    return <DashboardPageLoading label="Loading activity log…" />;

  }



  return (

    <FeatureGate featureKey="reports.view">

      <DashboardPageShell>

        <DashboardPageHeader

          title="Activity log"

          description="Full audit trail for your pharmacy — sales, inventory, staff, subscriptions, and settings."

          actions={

            <DashboardButton

              variant="outline"

              size="sm"

              onClick={refresh}

              disabled={logsQuery.isFetching}

            >

              <RefreshCw

                className={cn(

                  "mr-2 h-4 w-4",

                  logsQuery.isFetching && "animate-spin",

                )}

              />

              Refresh

            </DashboardButton>

          }

        />



        <DashboardMetricGrid>

          <DashboardStatCard

            label="Total events"

            value={(stats?.total ?? total).toLocaleString()}

            hint={hasActiveFilters ? "Matching filters" : "All recorded activity"}

            icon={History}

          />

          <DashboardStatCard

            label="Created"

            value={(stats?.inserts ?? 0).toLocaleString()}

            hint="INSERT operations"

            icon={Plus}

          />

          <DashboardStatCard

            label="Updated"

            value={(stats?.updates ?? 0).toLocaleString()}

            hint="UPDATE operations"

            icon={Pencil}

          />

          <DashboardStatCard

            label="Deleted"

            value={(stats?.deletes ?? 0).toLocaleString()}

            hint="DELETE operations"

            icon={Trash2}

          />

        </DashboardMetricGrid>



        <DashboardFilterBar

          description="Narrow by user, module, action, or date range"

          action={

            hasActiveFilters ? (

              <DashboardButton variant="ghost" size="sm" onClick={clearFilters}>

                <X className="mr-1.5 h-4 w-4" />

                Clear filters

              </DashboardButton>

            ) : undefined

          }

        >

          <DashboardFilterField label="Search" className="sm:col-span-2">

            <DashboardSearchInput

              placeholder="Search action, module, record ID…"

              value={searchTerm}

              onChange={(e) => setSearchTerm(e.target.value)}

            />

          </DashboardFilterField>

          <DashboardFilterField label="Action">

            <Select value={actionFilter} onValueChange={setActionFilter}>

              <SelectTrigger>

                <SelectValue placeholder="All actions" />

              </SelectTrigger>

              <SelectContent>

                <SelectItem value="all">All actions</SelectItem>

                {(facets?.actions ?? ["INSERT", "UPDATE", "DELETE"]).map(

                  (action) => (

                    <SelectItem key={action} value={action}>

                      {action}

                    </SelectItem>

                  ),

                )}

              </SelectContent>

            </Select>

          </DashboardFilterField>

          <DashboardFilterField label="Module">

            <Select value={tableFilter} onValueChange={setTableFilter}>

              <SelectTrigger>

                <SelectValue placeholder="All modules" />

              </SelectTrigger>

              <SelectContent>

                <SelectItem value="all">All modules</SelectItem>

                {(facets?.tables ?? []).map((table) => (

                  <SelectItem key={table} value={table}>

                    {auditTableLabel(table)}

                  </SelectItem>

                ))}

              </SelectContent>

            </Select>

          </DashboardFilterField>

          <DashboardFilterField label="User">

            <Select value={userFilter} onValueChange={setUserFilter}>

              <SelectTrigger>

                <SelectValue placeholder="All users" />

              </SelectTrigger>

              <SelectContent>

                <SelectItem value="all">All users</SelectItem>

                {(facets?.users ?? [{ id: "system", label: "System" }]).map(

                  (u) => (

                    <SelectItem key={u.id} value={u.id}>

                      {u.label}

                    </SelectItem>

                  ),

                )}

              </SelectContent>

            </Select>

          </DashboardFilterField>

          <DashboardFilterField label="From date">

            <Input

              type="date"

              value={fromDate}

              onChange={(e) => setFromDate(e.target.value)}

            />

          </DashboardFilterField>

          <DashboardFilterField label="To date">

            <Input

              type="date"

              value={toDate}

              onChange={(e) => setToDate(e.target.value)}

            />

          </DashboardFilterField>

        </DashboardFilterBar>



        <DashboardTableCard

          title="Audit events"

          description="Populated from application audit logs. Retention depends on platform settings."

        >

          {auditLogsDisabled ? (

            <DashboardPanelEmpty

              icon={History}

              title="Activity logging is disabled"

              description="Audit logs have been turned off by the platform administrator."

              className="border-0 shadow-none"

            />

          ) : items.length === 0 ? (

            <DashboardPanelEmpty

              icon={History}

              title={hasActiveFilters ? "No matching events" : "No activity yet"}

              description={

                hasActiveFilters

                  ? "Try clearing filters or widening the date range."

                  : "Changes to sales, inventory, and staff will appear here."

              }

              className="border-0 shadow-none"

            />

          ) : (

            <>

              <ul className="divide-y divide-neutral-100 md:hidden dark:divide-neutral-800">

                {items.map((log) => (

                  <li key={log.id} className="px-4 py-3">

                    <DashboardListRow className="flex-col items-stretch gap-2 border-0 p-0 shadow-none">

                      <div className="flex items-start justify-between gap-2">

                        <p className="text-sm font-medium leading-snug">

                          {log.summary}

                        </p>

                        <Badge

                          variant={actionVariant(log.action)}

                          className="shrink-0"

                        >

                          {log.action}

                        </Badge>

                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">

                        <span>

                          {log.userLabel}

                          {log.tableName

                            ? ` · ${auditTableLabel(log.tableName)}`

                            : ""}

                        </span>

                        <span className="tabular-nums">

                          {formatLogTime(log.createdAt)}

                        </span>

                      </div>

                    </DashboardListRow>

                  </li>

                ))}

              </ul>



              <div className="hidden px-3 pb-0 md:block sm:px-4">

                <DataTable

                  columns={columns}

                  data={items}

                  getRowId={(row) => row.id}

                  enableSorting={false}

                  pagination={false}

                  manualPagination

                  pageCount={pageCount}

                  rowCount={total}

                  paginationState={paginationState}

                  onPaginationChange={handlePaginationChange}

                  tableClassName="border-0"

                  isLoading={logsQuery.isFetching}

                  loadingMessage="Loading events…"

                />

              </div>



              <div className="border-t border-neutral-100 dark:border-neutral-800">

                <DashboardListFooterPagination

                  page={page}

                  pageSize={pageSize}

                  totalItems={total}

                  onPageChange={setPage}

                  onPageSizeChange={(size) => {

                    setPageSize(size);

                    setPage(1);

                  }}

                  pageSizeOptions={[25, 50, 100]}

                />

              </div>

            </>

          )}

        </DashboardTableCard>

      </DashboardPageShell>

    </FeatureGate>

  );

}


