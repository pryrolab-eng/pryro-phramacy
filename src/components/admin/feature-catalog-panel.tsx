"use client";

import Link from "next/link";
import { Fragment, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import {
  BarChart3,
  CreditCard,
  Gauge,
  GitBranch,
  Layers,
  LayoutDashboard,
  Package,
  Pencil,
  Plus,
  Search,
  Settings,
  ShoppingCart,
  TrendingUp,
  UserCog,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

function groupIcon(group: string): LucideIcon {
  return GROUP_ICONS[group] ?? Layers;
}

const TYPE_LABELS: Record<PlatformFeatureRow["feature_type"], string> = {
  boolean: "Access gate",
  limit: "Numeric limit",
  metered: "Usage meter",
};

const TYPE_VARIANT: Record<
  PlatformFeatureRow["feature_type"],
  "default" | "secondary" | "outline"
> = {
  boolean: "default",
  limit: "secondary",
  metered: "outline",
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

function RouteChips({ routes }: { routes: string[] }) {
  if (routes.length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  const visible = routes.slice(0, 2);
  const rest = routes.length - visible.length;
  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((r) => (
        <Badge key={r} variant="outline" className="font-mono text-[10px] font-normal">
          {r}
        </Badge>
      ))}
      {rest > 0 ? (
        <Badge variant="secondary" className="text-[10px]">
          +{rest}
        </Badge>
      ) : null}
    </div>
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

  if (featuresQuery.isPending) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (featuresQuery.isError) {
    return (
      <div className="p-6">
        <Card className="border-destructive/40">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Could not load the feature catalog. Refresh or check your admin permissions.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Feature catalog"
        description="Capabilities that power plan entitlements, sidebar gates, and API enforcement."
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/subscriptions">Plan matrix</Link>
            </Button>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add feature
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">{stats.groups} groups</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.active}</p>
            <p className="text-xs text-muted-foreground">
              {stats.total - stats.active} inactive
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Access gates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.boolean}</p>
            <p className="text-xs text-muted-foreground">Boolean entitlements</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Limits & meters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.limits}</p>
            <p className="text-xs text-muted-foreground">Plan quota columns</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <Card className="lg:w-56 shrink-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Groups</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 p-2 pt-0">
            <button
              type="button"
              onClick={() => setGroupFilter("all")}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
                groupFilter === "all"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted",
              )}
            >
              <span>All groups</span>
              <span className="text-xs opacity-80">{features.length}</span>
            </button>
            {groups.map((group) => {
              const Icon = groupIcon(group);
              const count = features.filter((f) => f.group === group).length;
              return (
                <button
                  key={group}
                  type="button"
                  onClick={() => setGroupFilter(group)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                    groupFilter === group
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-80" />
                  <span className="truncate flex-1 text-left">{group}</span>
                  <span className="text-xs opacity-80">{count}</span>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card className="min-w-0 flex-1">
          <CardHeader className="space-y-4 border-b pb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base">
                {groupFilter === "all" ? "All features" : groupFilter}
                <span className="ml-2 font-normal text-muted-foreground">
                  ({filtered.length})
                </span>
              </CardTitle>
              <div className="flex items-center gap-2 text-sm">
                <Switch
                  id="show-inactive"
                  checked={showInactive}
                  onCheckedChange={setShowInactive}
                />
                <Label htmlFor="show-inactive" className="font-normal cursor-pointer">
                  Show inactive
                </Label>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search name, key, or description…"
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
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
          </CardHeader>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No features match your filters.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[28%]">Feature</TableHead>
                    <TableHead className="w-[22%]">Key</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="hidden md:table-cell">Routes</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((f, i) => {
                    const prev = filtered[i - 1];
                    const showGroupHeader =
                      groupFilter === "all" && (!prev || prev.group !== f.group);
                    const Icon = groupIcon(f.group);
                    return (
                      <Fragment key={f.key}>
                        {showGroupHeader ? (
                          <TableRow className="bg-muted/40 hover:bg-muted/40">
                            <TableCell colSpan={6} className="py-2">
                              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                <Icon className="h-3.5 w-3.5" />
                                {f.group}
                                <span className="font-normal normal-case">
                                  ({countByGroup.get(f.group) ?? 0})
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : null}
                        <TableRow className={cn(!f.is_active && "opacity-60")}>
                          <TableCell>
                            <p className="font-medium">{f.display_name}</p>
                            {f.description ? (
                              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                                {f.description}
                              </p>
                            ) : null}
                          </TableCell>
                          <TableCell>
                            <code className="text-xs text-muted-foreground">{f.key}</code>
                          </TableCell>
                          <TableCell>
                            <Badge variant={TYPE_VARIANT[f.feature_type]}>
                              {TYPE_LABELS[f.feature_type]}
                            </Badge>
                            {f.limit_column ? (
                              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                                {f.limit_column}
                              </p>
                            ) : null}
                          </TableCell>
                          <TableCell className="hidden md:table-cell max-w-[200px]">
                            <RouteChips routes={f.nav_routes} />
                          </TableCell>
                          <TableCell>
                            <Badge variant={f.is_active ? "default" : "secondary"}>
                              {f.is_active ? "Active" : "Off"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEdit(f)}
                              aria-label={`Edit ${f.display_name}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Sheet open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Edit feature</SheetTitle>
            <SheetDescription>
              <code className="text-xs">{editing?.key}</code>
            </SheetDescription>
          </SheetHeader>
          <FeatureFormFields form={editForm} setForm={setEditForm} />
          <SheetFooter className="mt-6 gap-2 sm:justify-between">
            <div className="flex items-center gap-2">
              <Switch
                id="edit-active"
                checked={editForm.is_active}
                onCheckedChange={(v) =>
                  setEditForm((p) => ({ ...p, is_active: Boolean(v) }))
                }
              />
              <Label htmlFor="edit-active">Active in catalog</Label>
            </div>
            <Button onClick={saveEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving…" : "Save changes"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add feature</DialogTitle>
            <DialogDescription>
              Create a new entitlement key. Assign it to plans on the subscriptions page.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="new-key">Key (immutable)</Label>
              <Input
                id="new-key"
                placeholder="e.g. pos.discounts"
                className="font-mono"
                value={createKey}
                onChange={(e) => setCreateKey(e.target.value.toLowerCase())}
              />
            </div>
            <FeatureFormFields form={createForm} setForm={setCreateForm} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating…" : "Create feature"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FeatureFormFields({
  form,
  setForm,
}: {
  form: FeatureFormState;
  setForm: Dispatch<SetStateAction<FeatureFormState>>;
}) {
  return (
    <div className="mt-6 space-y-4">
      <div>
        <Label>Display name</Label>
        <Input
          value={form.display_name}
          onChange={(e) => setForm((p) => ({ ...p, display_name: e.target.value }))}
        />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea
          rows={3}
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Group</Label>
          <Input
            value={form.group}
            onChange={(e) => setForm((p) => ({ ...p, group: e.target.value }))}
          />
        </div>
        <div>
          <Label>Sort order</Label>
          <Input
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
          <SelectTrigger>
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
            placeholder="max_users, max_branches, monthly_tx_limit"
            className="font-mono text-sm"
            value={form.limit_column}
            onChange={(e) => setForm((p) => ({ ...p, limit_column: e.target.value }))}
          />
        </div>
      ) : null}
      <div>
        <Label>Nav routes</Label>
        <Textarea
          rows={3}
          placeholder="/pos, /inventory (comma or newline separated)"
          className="font-mono text-sm"
          value={form.nav_routes}
          onChange={(e) => setForm((p) => ({ ...p, nav_routes: e.target.value }))}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Routes used for sidebar and page guards. Leave empty if API-only.
        </p>
      </div>
    </div>
  );
}
