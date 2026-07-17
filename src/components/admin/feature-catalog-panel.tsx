"use client";

import Link from "next/link";
import {
  Fragment,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  BarChart3,
  CheckCircle2,
  CreditCard,
  Gauge,
  GitBranch,
  Layers,
  LayoutDashboard,
  Package,
  Pencil,
  Plus,
  Settings,
  ShoppingCart,
  ToggleLeft,
  TrendingUp,
  UserCog,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatusChip } from "@/components/admin/dashboard/admin-dashboard-ui";
import {
  DashboardButton,
  DashboardDialogActions,
  DashboardDialogBody,
  DashboardDialogContent,
  DashboardDialogDescription,
  DashboardDialogHeader,
  DashboardDialogTitle,
  DashboardMetricGrid,
  DashboardPanelEmpty,
  DashboardSearchInput,
  DashboardSectionCard,
  DashboardStatCard,
} from "@/components/dashboard";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  useAdminFeatures,
  useCreateAdminFeatureMutation,
  useUpdateAdminFeatureMutation,
} from "@/hooks/useAdminFeatures";
import type { PlatformFeatureRow } from "@/lib/subscription/plan-features";
import type { UpsertPlatformFeatureInput } from "@/lib/http/admin/features";

const PAGE_SIZE = 15;

const GROUP_ICONS: Record<string, LucideIcon> = {
  Core: LayoutDashboard,
  POS: ShoppingCart,
  Inventory: Package,
  CRM: Users,
  Sales: TrendingUp,
  Reports: BarChart3,
  Branches: GitBranch,
  Staff: UserCog,
  Settings: Settings,
  Billing: CreditCard,
  Limits: Gauge,
};

const selectTriggerClass =
  "h-8 w-full rounded-lg border-neutral-200/80 bg-white text-sm shadow-sm sm:w-[180px] dark:border-neutral-700 dark:bg-neutral-900";

function groupIcon(group: string): LucideIcon {
  return GROUP_ICONS[group] ?? Layers;
}

const TYPE_LABELS: Record<PlatformFeatureRow["feature_type"], string> = {
  boolean: "Access gate",
  limit: "Numeric limit",
  metered: "Usage meter",
};

const TYPE_LABELS_SHORT: Record<PlatformFeatureRow["feature_type"], string> = {
  boolean: "Gate",
  limit: "Limit",
  metered: "Meter",
};

type FeatureFormState = {
  display_name: string;
  description: string;
  group: string;
  feature_type: PlatformFeatureRow["feature_type"];
  limit_column: string;
  nav_routes: string;
  sort_order: string;
  is_active: boolean;
};

const emptyForm = (): FeatureFormState => ({
  display_name: "",
  description: "",
  group: "Core",
  feature_type: "boolean",
  limit_column: "",
  nav_routes: "",
  sort_order: "0",
  is_active: true,
});

function formFromRow(row: PlatformFeatureRow): FeatureFormState {
  return {
    display_name: row.display_name,
    description: row.description ?? "",
    group: row.group,
    feature_type: row.feature_type,
    limit_column: row.limit_column ?? "",
    nav_routes: row.nav_routes.join(", "),
    sort_order: String(row.sort_order ?? 0),
    is_active: row.is_active,
  };
}

function parseRoutes(raw: string): string[] {
  return raw
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function bodyFromForm(
  form: FeatureFormState,
  key?: string,
): UpsertPlatformFeatureInput {
  return {
    key: key ?? "",
    display_name: form.display_name.trim(),
    description: form.description.trim() || undefined,
    group: form.group.trim() || "General",
    feature_type: form.feature_type,
    limit_column:
      form.feature_type === "limit" || form.feature_type === "metered"
        ? form.limit_column.trim() || null
        : null,
    nav_routes: parseRoutes(form.nav_routes),
    sort_order: Number(form.sort_order) || 0,
    is_active: form.is_active,
  };
}

function routeChipParts(route: string) {
  const segments = route.split("/").filter(Boolean);
  if (segments.length === 0) {
    return { full: route, prefix: "", leaf: route };
  }
  const leaf = segments[segments.length - 1]!;
  const prefix =
    segments.length > 1 ? `/${segments.slice(0, -1).join("/")}/` : "/";
  return { full: route, prefix, leaf };
}

function RouteChip({ route }: { route: string }) {
  const { full, prefix, leaf } = routeChipParts(route);
  return (
    <Badge
      variant="outline"
      title={full}
      className="inline-flex max-w-full shrink-0 items-center gap-0 whitespace-nowrap border-neutral-200/80 py-0.5 font-mono text-[10px] font-normal dark:border-neutral-700"
    >
      {prefix ? (
        <span className="max-w-[5.5rem] truncate text-neutral-400">{prefix}</span>
      ) : null}
      <span>{leaf}</span>
    </Badge>
  );
}

function RouteChips({ routes }: { routes: string[] }) {
  if (routes.length === 0) {
    return <span className="text-xs text-neutral-500">—</span>;
  }

  const maxVisible = 2;
  const visible = routes.slice(0, maxVisible);
  const hidden = routes.slice(maxVisible);

  return (
    <div className="flex min-w-0 flex-col items-start gap-1.5 sm:flex-row sm:flex-wrap sm:items-center">
      {visible.map((r) => (
        <RouteChip key={r} route={r} />
      ))}
      {hidden.length > 0 ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="secondary"
              className="shrink-0 cursor-default whitespace-nowrap text-[10px] tabular-nums"
            >
              +{hidden.length}
            </Badge>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="max-w-xs space-y-1.5 p-3 font-mono text-xs"
          >
            <p className="font-sans text-[10px] font-medium text-muted-foreground">
              Additional routes
            </p>
            <ul className="space-y-1">
              {hidden.map((r) => (
                <li key={r} className="break-all text-foreground">
                  {r}
                </li>
              ))}
            </ul>
          </TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  );
}

function groupNavButtonClass(active: boolean) {
  return cn(
    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
    active
      ? "bg-primary font-medium text-primary-foreground"
      : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800/80",
  );
}

export function FeatureCatalogPanel() {
  const featuresQuery = useAdminFeatures();
  const updateMutation = useUpdateAdminFeatureMutation();
  const createMutation = useCreateAdminFeatureMutation();

  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showInactive, setShowInactive] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);

  const [editing, setEditing] = useState<PlatformFeatureRow | null>(null);
  const [editForm, setEditForm] = useState<FeatureFormState>(emptyForm);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [createKey, setCreateKey] = useState("");

  const features = featuresQuery.data ?? [];

  const stats = useMemo(() => {
    const active = features.filter((f) => f.is_active).length;
    const boolean = features.filter((f) => f.feature_type === "boolean").length;
    const limits = features.filter(
      (f) => f.feature_type === "limit" || f.feature_type === "metered",
    ).length;
    const groups = new Set(features.map((f) => f.group)).size;
    return { total: features.length, active, boolean, limits, groups };
  }, [features]);

  const groups = useMemo(() => {
    const set = new Set(features.map((f) => f.group));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [features]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return features
      .filter((f) => {
        if (!showInactive && !f.is_active) return false;
        if (groupFilter !== "all" && f.group !== groupFilter) return false;
        if (typeFilter !== "all" && f.feature_type !== typeFilter) return false;
        if (!q) return true;
        return (
          f.key.toLowerCase().includes(q) ||
          f.display_name.toLowerCase().includes(q) ||
          (f.description ?? "").toLowerCase().includes(q) ||
          f.group.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const g = a.group.localeCompare(b.group);
        if (g !== 0) return g;
        return a.sort_order - b.sort_order || a.display_name.localeCompare(b.display_name);
      });
  }, [features, search, groupFilter, typeFilter, showInactive]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    setPageIndex(0);
  }, [search, groupFilter, typeFilter, showInactive]);

  useEffect(() => {
    if (pageIndex > pageCount - 1) {
      setPageIndex(Math.max(0, pageCount - 1));
    }
  }, [pageIndex, pageCount]);

  const pageRows = useMemo(
    () => filtered.slice(pageIndex * PAGE_SIZE, pageIndex * PAGE_SIZE + PAGE_SIZE),
    [filtered, pageIndex],
  );

  const countByGroup = useMemo(() => {
    const m = new Map<string, number>();
    for (const f of filtered) {
      m.set(f.group, (m.get(f.group) ?? 0) + 1);
    }
    return m;
  }, [filtered]);

  const openEdit = (row: PlatformFeatureRow) => {
    setEditing(row);
    setEditForm(formFromRow(row));
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      await updateMutation.mutateAsync({
        key: editing.key,
        body: bodyFromForm(editForm),
      });
      toast({ title: "Feature updated", description: editing.key });
      setEditing(null);
    } catch (e) {
      toast({
        title: "Could not save",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const saveCreate = async () => {
    const key = createKey.trim();
    if (!key || !/^[a-z][a-z0-9._-]*$/.test(key)) {
      toast({
        title: "Invalid key",
        description: "Use lowercase letters, numbers, dots, dashes (e.g. pos.refunds).",
        variant: "destructive",
      });
      return;
    }
    try {
      await createMutation.mutateAsync(bodyFromForm(createForm, key));
      toast({ title: "Feature created", description: key });
      setCreateOpen(false);
      setCreateKey("");
      setCreateForm(emptyForm());
    } catch (e) {
      toast({
        title: "Could not create",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  if (featuresQuery.isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Spinner className="size-6" />
        <p className="text-sm text-neutral-500">Loading feature catalog…</p>
      </div>
    );
  }

  if (featuresQuery.isError) {
    return (
      <p className="text-sm text-destructive" role="alert">
        Could not load the feature catalog. Refresh or check your admin permissions.
      </p>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
    <>
      <AdminPageHeader
        pinTitle="Feature catalog"
        title="Feature catalog"
        description="Capabilities that power plan entitlements, sidebar gates, and API enforcement."
        actions={
          <>
            <DashboardButton tone="outline" asChild>
              <Link href="/admin/subscriptions">Plan matrix</Link>
            </DashboardButton>
            <DashboardButton tone="primary" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" strokeWidth={1.75} />
              Add feature
            </DashboardButton>
          </>
        }
      />

      <DashboardMetricGrid className="mb-4 lg:grid-cols-4">
        <DashboardStatCard
          label="Total features"
          icon={Layers}
          value={stats.total}
          hint={`${stats.groups} groups`}
        />
        <DashboardStatCard
          label="Active"
          icon={CheckCircle2}
          value={stats.active}
          hint={`${stats.total - stats.active} inactive`}
        />
        <DashboardStatCard
          label="Access gates"
          icon={ToggleLeft}
          value={stats.boolean}
          hint="Boolean entitlements"
        />
        <DashboardStatCard
          label="Limits & meters"
          icon={Gauge}
          value={stats.limits}
          hint="Plan quota columns"
        />
      </DashboardMetricGrid>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <DashboardSectionCard
          title="Groups"
          className="shrink-0 lg:sticky lg:top-4 lg:w-56 lg:self-start lg:max-h-[calc(100dvh-2rem)] lg:flex lg:flex-col"
          contentClassName="min-h-0 flex-1 overflow-y-auto p-2 pt-0"
        >
          <nav className="space-y-0.5">
            <button
              type="button"
              onClick={() => setGroupFilter("all")}
              className={groupNavButtonClass(groupFilter === "all")}
            >
              <span className="flex-1 text-left">All groups</span>
              <span className="text-xs tabular-nums opacity-80">{features.length}</span>
            </button>
            {groups.map((group) => {
              const Icon = groupIcon(group);
              const count = features.filter((f) => f.group === group).length;
              return (
                <button
                  key={group}
                  type="button"
                  onClick={() => setGroupFilter(group)}
                  className={groupNavButtonClass(groupFilter === group)}
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-80" strokeWidth={1.75} />
                  <span className="min-w-0 flex-1 truncate text-left">{group}</span>
                  <span className="text-xs tabular-nums opacity-80">{count}</span>
                </button>
              );
            })}
          </nav>
        </DashboardSectionCard>

        <DashboardSectionCard
          title={groupFilter === "all" ? "All features" : groupFilter}
          description={`${filtered.length} matching · page ${pageIndex + 1} of ${pageCount}`}
          className="min-w-0 flex-1"
          contentClassName="p-0"
          action={
            <div className="flex items-center gap-2">
              <Switch
                id="show-inactive"
                checked={showInactive}
                onCheckedChange={setShowInactive}
              />
              <Label
                htmlFor="show-inactive"
                className="cursor-pointer text-sm font-normal text-neutral-600 dark:text-neutral-400"
              >
                Show inactive
              </Label>
            </div>
          }
        >
          <div className="flex flex-col gap-2 border-b border-neutral-100 px-5 py-3 dark:border-neutral-800 sm:flex-row sm:items-center">
            <DashboardSearchInput
              placeholder="Search name, key, or description…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="min-w-0 flex-1"
            />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className={selectTriggerClass}>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="boolean">Access gate</SelectItem>
                <SelectItem value="limit">Numeric limit</SelectItem>
                <SelectItem value="metered">Usage meter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <DashboardPanelEmpty
              icon={Layers}
              className="mx-4 my-8 border-0 bg-transparent shadow-none"
              title="No features match"
              description="Try another group, type, or search term."
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-12 text-center text-xs text-neutral-500">
                        #
                      </TableHead>
                      <TableHead className="w-[26%]">Feature</TableHead>
                      <TableHead className="w-[20%]">Key</TableHead>
                      <TableHead className="min-w-[5.5rem] whitespace-nowrap">
                        Type
                      </TableHead>
                      <TableHead className="hidden md:table-cell">Routes</TableHead>
                      <TableHead className="min-w-[4.5rem] whitespace-nowrap">
                        Status
                      </TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageRows.map((f, i) => {
                      const globalIndex = pageIndex * PAGE_SIZE + i;
                      const prev = pageRows[i - 1];
                      const showGroupHeader =
                        groupFilter === "all" && (!prev || prev.group !== f.group);
                      const Icon = groupIcon(f.group);
                      return (
                        <Fragment key={f.key}>
                          {showGroupHeader ? (
                            <TableRow className="bg-neutral-50/80 hover:bg-neutral-50/80 dark:bg-neutral-900/40">
                              <TableCell colSpan={7} className="py-2">
                                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                                  <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                                  {f.group}
                                  <span className="font-normal normal-case">
                                    ({countByGroup.get(f.group) ?? 0})
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : null}
                          <TableRow
                            className={cn(
                              !f.is_active && "opacity-60",
                              "hover:bg-neutral-50/80 dark:hover:bg-neutral-900/30",
                            )}
                          >
                            <TableCell className="text-center text-xs tabular-nums text-neutral-500">
                              {globalIndex + 1}
                            </TableCell>
                            <TableCell>
                              <p className="font-medium text-neutral-900 dark:text-neutral-50">
                                {f.display_name}
                              </p>
                              {f.description ? (
                                <p className="mt-0.5 line-clamp-2 text-xs text-neutral-500">
                                  {f.description}
                                </p>
                              ) : null}
                            </TableCell>
                            <TableCell>
                              <code className="text-xs text-neutral-600 dark:text-neutral-400">
                                {f.key}
                              </code>
                            </TableCell>
                            <TableCell className="align-top">
                              <AdminStatusChip
                                tone="plan"
                                title={TYPE_LABELS[f.feature_type]}
                              >
                                {TYPE_LABELS_SHORT[f.feature_type]}
                              </AdminStatusChip>
                              {f.limit_column ? (
                                <p className="mt-1 whitespace-nowrap font-mono text-[10px] text-neutral-500">
                                  {f.limit_column}
                                </p>
                              ) : null}
                            </TableCell>
                            <TableCell className="hidden min-w-[12rem] md:table-cell lg:min-w-[14rem]">
                              <RouteChips routes={f.nav_routes} />
                            </TableCell>
                            <TableCell>
                              <AdminStatusChip tone={f.is_active ? "active" : "inactive"}>
                                {f.is_active ? "Active" : "Off"}
                              </AdminStatusChip>
                            </TableCell>
                            <TableCell>
                              <DashboardButton
                                tone="ghost"
                                size="sm"
                                className="h-8 w-8 px-0"
                                onClick={() => openEdit(f)}
                                aria-label={`Edit ${f.display_name}`}
                              >
                                <Pencil className="h-4 w-4" strokeWidth={1.75} />
                              </DashboardButton>
                            </TableCell>
                          </TableRow>
                        </Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col gap-3 border-t border-neutral-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">
                <p className="text-sm text-neutral-500">
                  {filtered.length} feature{filtered.length === 1 ? "" : "s"}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <DashboardButton
                    tone="outline"
                    size="sm"
                    disabled={pageIndex <= 0}
                    onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                  >
                    Previous
                  </DashboardButton>
                  <span className="text-sm font-medium tabular-nums text-neutral-700 dark:text-neutral-300">
                    Page {pageIndex + 1} of {pageCount}
                  </span>
                  <DashboardButton
                    tone="outline"
                    size="sm"
                    disabled={pageIndex >= pageCount - 1}
                    onClick={() =>
                      setPageIndex((p) => Math.min(pageCount - 1, p + 1))
                    }
                  >
                    Next
                  </DashboardButton>
                </div>
              </div>
            </>
          )}
        </DashboardSectionCard>
      </div>

      <Sheet open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent className="overflow-y-auto border-neutral-200/80 sm:max-w-md dark:border-neutral-800">
          <SheetHeader>
            <SheetTitle>Edit feature</SheetTitle>
            <SheetDescription>
              <code className="rounded bg-neutral-100 px-1 text-xs dark:bg-neutral-800">
                {editing?.key}
              </code>
            </SheetDescription>
          </SheetHeader>
          <FeatureFormFields form={editForm} setForm={setEditForm} />
          <SheetFooter className="mt-6 flex-col gap-3 sm:flex-col">
            <div className="flex w-full items-center justify-between rounded-lg border border-neutral-200/80 bg-neutral-50/80 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900/40">
              <Label htmlFor="edit-active" className="cursor-pointer">
                Active in catalog
              </Label>
              <Switch
                id="edit-active"
                checked={editForm.is_active}
                onCheckedChange={(v) =>
                  setEditForm((p) => ({ ...p, is_active: Boolean(v) }))
                }
              />
            </div>
            <DashboardButton
              tone="primary"
              className="w-full"
              onClick={() => void saveEdit()}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving…" : "Save changes"}
            </DashboardButton>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DashboardDialogContent className="flex max-h-[min(90dvh,calc(100vh-2rem))] flex-col gap-0 overflow-hidden sm:max-w-lg">
          <DashboardDialogHeader>
            <DashboardDialogTitle>Add feature</DashboardDialogTitle>
            <DashboardDialogDescription>
              Create a new entitlement key. Assign it to plans on the subscriptions page.
            </DashboardDialogDescription>
          </DashboardDialogHeader>
          <DashboardDialogBody className="max-h-none flex-1 overflow-y-auto">
            <div className="space-y-3">
              <div>
                <Label htmlFor="new-key">Key (immutable)</Label>
                <Input
                  id="new-key"
                  placeholder="e.g. pos.discounts"
                  className="mt-1.5 font-mono"
                  value={createKey}
                  onChange={(e) => setCreateKey(e.target.value.toLowerCase())}
                />
              </div>
              <FeatureFormFields form={createForm} setForm={setCreateForm} compact />
            </div>
          </DashboardDialogBody>
          <DashboardDialogActions
            cancelLabel="Cancel"
            confirmLabel="Create feature"
            onCancel={() => setCreateOpen(false)}
            onConfirm={() => void saveCreate()}
            confirmLoading={createMutation.isPending}
          />
        </DashboardDialogContent>
      </Dialog>
    </>
    </TooltipProvider>
  );
}

function FeatureFormFields({
  form,
  setForm,
  compact,
}: {
  form: FeatureFormState;
  setForm: Dispatch<SetStateAction<FeatureFormState>>;
  compact?: boolean;
}) {
  return (
    <div className={cn("space-y-4", compact ? "mt-0" : "mt-6")}>
      <div>
        <Label>Display name</Label>
        <Input
          className="mt-1.5"
          value={form.display_name}
          onChange={(e) => setForm((p) => ({ ...p, display_name: e.target.value }))}
        />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea
          className="mt-1.5"
          rows={3}
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Group</Label>
          <Input
            className="mt-1.5"
            value={form.group}
            onChange={(e) => setForm((p) => ({ ...p, group: e.target.value }))}
          />
        </div>
        <div>
          <Label>Sort order</Label>
          <Input
            className="mt-1.5"
            type="number"
            value={form.sort_order}
            onChange={(e) => setForm((p) => ({ ...p, sort_order: e.target.value }))}
          />
        </div>
      </div>
      <div>
        <Label>Feature type</Label>
        <Select
          value={form.feature_type}
          onValueChange={(v) =>
            setForm((p) => ({
              ...p,
              feature_type: v as PlatformFeatureRow["feature_type"],
            }))
          }
        >
          <SelectTrigger className={cn(selectTriggerClass, "mt-1.5 w-full")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="boolean">Access gate (boolean)</SelectItem>
            <SelectItem value="limit">Numeric limit</SelectItem>
            <SelectItem value="metered">Usage meter</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {form.feature_type !== "boolean" ? (
        <div>
          <Label>Plan column</Label>
          <Input
            className="mt-1.5 font-mono text-sm"
            placeholder="max_users, max_branches, monthly_tx_limit"
            value={form.limit_column}
            onChange={(e) => setForm((p) => ({ ...p, limit_column: e.target.value }))}
          />
        </div>
      ) : null}
      <div>
        <Label>Nav routes</Label>
        <Textarea
          className="mt-1.5 font-mono text-sm"
          rows={3}
          placeholder="/pharmacy/pos, /pharmacy/inventory (comma or newline)"
          value={form.nav_routes}
          onChange={(e) => setForm((p) => ({ ...p, nav_routes: e.target.value }))}
        />
        <p className="mt-1 text-xs text-neutral-500">
          Routes used for sidebar and page guards. Leave empty if API-only.
        </p>
      </div>
    </div>
  );
}
