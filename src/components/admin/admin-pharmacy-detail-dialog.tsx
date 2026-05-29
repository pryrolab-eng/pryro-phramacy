"use client";

import { useCallback, useEffect, useState, type ComponentType, type ReactNode } from "react";
import {
  Building2,
  Calendar,
  CreditCard,
  GitBranch,
  Info,
  Mail,
  MapPin,
  Phone,
  User,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import type { AdminPharmacyDetail } from "@/lib/admin/pharmacy-detail";
import {
  getAdminPharmacyDetail,
  type AdminPharmacyRow,
} from "@/lib/http/admin/pharmacies";
import { AdminPharmacyBrandingSection } from "@/components/admin/admin-pharmacy-branding-section";
import {
  pharmacyAccessVariant,
  resolvePharmacyPlanDisplay,
  type CatalogPlanLike,
} from "@/lib/admin/plan-stats";

function formatDate(value: string | undefined | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function DetailField({
  icon: Icon,
  label,
  children,
  className,
}: {
  icon?: ComponentType<{ className?: string }>;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {Icon ? <Icon className="h-3.5 w-3.5 shrink-0" /> : null}
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium leading-snug">{children}</dd>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  description,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <h3 className="text-sm font-semibold leading-none">{title}</h3>
        {description ? (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

type Props = {
  pharmacy: AdminPharmacyRow;
  catalog: CatalogPlanLike[];
  onClose: () => void;
};

function resolvePharmacyId(pharmacy: AdminPharmacyRow | null): string | null {
  if (!pharmacy) return null;
  const raw =
    pharmacy.id ??
    (pharmacy as { pharmacy_id?: string | null }).pharmacy_id;
  if (raw == null || String(raw).trim() === "") return null;
  return String(raw);
}

export function AdminPharmacyDetailDialog({
  pharmacy,
  catalog,
  onClose,
}: Props) {
  const pharmacyId = resolvePharmacyId(pharmacy);
  const [detail, setDetail] = useState<AdminPharmacyDetail | null>(null);
  const [loading, setLoading] = useState(Boolean(pharmacyId));
  const [error, setError] = useState<string | null>(null);

  const loadDetail = useCallback(
    async (signal?: AbortSignal) => {
      if (!pharmacyId) {
        setLoading(false);
        setError("Missing store ID — cannot load details.");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await getAdminPharmacyDetail(pharmacyId, { signal });
        setDetail(data);
      } catch (err) {
        if (signal?.aborted) return;
        setDetail(null);
        setError(
          err instanceof Error ? err.message : "Failed to load store details.",
        );
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [pharmacyId],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadDetail(controller.signal);
    return () => controller.abort();
  }, [loadDetail]);

  const fallbackPlan = resolvePharmacyPlanDisplay(
    {
      subscription_plan: String(pharmacy.subscription_plan ?? ""),
      catalog_plan_name: pharmacy.catalog_plan_name as string | null,
      catalog_plan_price: pharmacy.catalog_plan_price as number | null,
      is_free_plan: pharmacy.is_free_plan as boolean | null,
    },
    catalog,
  );

  const planName = fallbackPlan.name;
  const planIsFree = fallbackPlan.isFree;
  const headerPlanName = detail?.plan.name ?? planName;
  const headerPlanIsFree = detail?.plan.isFree ?? planIsFree;
  const headerAccessStatus = detail?.access.status ?? String(pharmacy?.status ?? "active");
  const headerAccessLabel = detail?.access.label ?? (
    headerAccessStatus === "suspended"
      ? "Suspended"
      : headerAccessStatus === "inactive"
        ? "Inactive"
        : headerAccessStatus === "pending_payment"
          ? "Pending payment"
          : "Active"
  );

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto p-0 sm:max-w-2xl">
        <DialogHeader className="space-y-3 border-b px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-3 pr-8">
            <div>
              <DialogTitle className="text-xl">
                {String(pharmacy?.name ?? "Pharmacy")}
              </DialogTitle>
              <DialogDescription className="mt-1 font-mono text-xs">
                {String(pharmacy?.license_number ?? "—")}
              </DialogDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={headerPlanIsFree ? "secondary" : "outline"}>
                {headerPlanName}
              </Badge>
              <Badge variant={pharmacyAccessVariant(headerAccessStatus)}>
                {headerAccessLabel}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {!pharmacyId ? (
          <div className="px-6 py-10 text-center text-sm text-muted-foreground">
            This store has no ID in the database — details cannot be loaded.
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Spinner className="h-5 w-5" />
            Loading store details…
          </div>
        ) : error ? (
          <div className="space-y-4 px-6 py-10 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadDetail()}
            >
              Retry
            </Button>
          </div>
        ) : (
          <AdminPharmacyDetailContent
            pharmacy={pharmacy}
            catalog={catalog}
            detail={detail}
            fallbackPlan={fallbackPlan}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

type ContentProps = {
  pharmacy: AdminPharmacyRow;
  catalog: CatalogPlanLike[];
  detail: AdminPharmacyDetail | null;
  fallbackPlan: ReturnType<typeof resolvePharmacyPlanDisplay>;
};

function AdminPharmacyDetailContent({
  pharmacy,
  catalog,
  detail,
  fallbackPlan,
}: ContentProps) {
  const pharmacyId = resolvePharmacyId(pharmacy);
  const planName = detail?.plan.name ?? fallbackPlan.name;
  const planPriceLabel = detail?.plan.priceLabel ?? fallbackPlan.priceLabel;
  const planIsFree = detail?.plan.isFree ?? fallbackPlan.isFree;
  const p = detail?.pharmacy ?? pharmacy;

  return (
          <div className="space-y-6 px-6 py-5">
            {/* Profile */}
            <section className="space-y-4">
              <SectionTitle
                icon={Building2}
                title="Store profile"
                description="Contact and registration details"
              />
              <dl className="grid gap-4 sm:grid-cols-2">
                <DetailField icon={MapPin} label="Address" className="sm:col-span-2">
                  {String(p?.address ?? "—")}
                </DetailField>
                <DetailField icon={Phone} label="Phone">
                  {String(p?.phone ?? "—")}
                </DetailField>
                <DetailField icon={Mail} label="Store email">
                  {String(p?.email ?? "—")}
                </DetailField>
                <DetailField icon={Calendar} label="Joined">
                  {formatDate(p?.created_at as string | undefined)}
                </DetailField>
                <DetailField icon={User} label="Owner">
                  {detail?.owner?.name || detail?.owner?.email ? (
                    <span className="block">
                      {detail.owner.name ? (
                        <span>{detail.owner.name}</span>
                      ) : null}
                      {detail.owner.email ? (
                        <span className="block font-normal text-muted-foreground">
                          {detail.owner.email}
                        </span>
                      ) : null}
                    </span>
                  ) : (
                    "—"
                  )}
                </DetailField>
              </dl>
            </section>

            <Separator />

            {pharmacyId ? (
              <>
                <AdminPharmacyBrandingSection pharmacyId={pharmacyId} />
                <Separator />
              </>
            ) : null}

            {/* Main subscription */}
            <section className="space-y-4">
              <SectionTitle
                icon={CreditCard}
                title="Main subscription"
                description="The pharmacy's primary SaaS plan — features, user limits, and included branch slots"
              />
              <div className="rounded-lg border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-lg font-semibold">{planName}</p>
                  </div>
                  <Badge
                    variant={planIsFree ? "secondary" : "default"}
                    className="text-sm"
                  >
                    {planPriceLabel}
                  </Badge>
                </div>
                <dl className="mt-4 grid gap-3 border-t pt-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-muted-foreground">Billing status</dt>
                    <dd className="font-medium">
                      {detail?.mainSubscription?.status ??
                        (detail?.entitlements.isAccessAllowed
                          ? "Active (from entitlements)"
                          : "No active main subscription")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Renews / expires</dt>
                    <dd className="font-medium">
                      {detail?.entitlements.expiresAt
                        ? formatDate(detail.entitlements.expiresAt)
                        : "—"}
                      {detail?.entitlements.daysRemaining != null &&
                      detail.entitlements.daysRemaining > 0 ? (
                        <span className="ml-1 text-muted-foreground">
                          ({detail.entitlements.daysRemaining}d left)
                        </span>
                      ) : null}
                    </dd>
                  </div>
                </dl>
                {detail?.pendingMainSubscription ? (
                  <div className="mt-3 rounded-md border bg-muted/30 px-3 py-2 text-sm">
                    <span className="font-medium">Pending change:</span>{" "}
                    <span className="font-medium">
                      {detail.pendingMainSubscription.planName}
                    </span>{" "}
                    <span className="text-muted-foreground">
                      ({detail.pendingMainSubscription.status})
                    </span>
                  </div>
                ) : null}
              </div>
            </section>

            <Separator />

            {/* Branch add-ons */}
            <section className="space-y-4">
              <SectionTitle
                icon={GitBranch}
                title="Branches & add-ons"
                description="Extra locations beyond what the main plan includes"
              />
              <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-sm">
                <p className="flex gap-2 text-muted-foreground">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    A <strong className="text-foreground">branch add-on</strong> is
                    a separate paid subscription for one extra store location. Each
                    add-on unlocks one additional branch slot after checkout.
                  </span>
                </p>
              </div>

              {detail ? (
                <>
                  <dl className="grid gap-3 rounded-lg border p-4 sm:grid-cols-3">
                    <div>
                      <dt className="text-xs text-muted-foreground">
                        Branches in use
                      </dt>
                      <dd className="text-lg font-semibold tabular-nums">
                        {detail.capacity.branchesInUse}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">
                        Total slots
                      </dt>
                      <dd className="text-lg font-semibold tabular-nums">
                        {detail.capacity.totalSlots}
                        <span className="ml-1 text-sm font-normal text-muted-foreground">
                          ({detail.capacity.slotsFromMainPlan} plan
                          {detail.capacity.slotsFromAddons > 0
                            ? ` + ${detail.capacity.slotsFromAddons} add-on`
                            : ""}
                          )
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">
                        Can add branch
                      </dt>
                      <dd>
                        <Badge
                          variant={
                            detail.capacity.canAddBranch ? "default" : "secondary"
                          }
                        >
                          {detail.capacity.canAddBranch ? "Yes" : "At limit"}
                        </Badge>
                      </dd>
                    </div>
                  </dl>

                  {detail.branchAddons.catalogProductName ? (
                    <p className="text-xs text-muted-foreground">
                      Catalog add-on product:{" "}
                      <span className="font-medium text-foreground">
                        {detail.branchAddons.catalogProductName}
                      </span>
                      {detail.branchAddons.catalogProductPrice != null ? (
                        <span>
                          {" "}
                          — RWF{" "}
                          {detail.branchAddons.catalogProductPrice.toLocaleString()}
                          /mo per branch
                        </span>
                      ) : null}
                    </p>
                  ) : null}

                  {detail.branchAddons.items.length > 0 ? (
                    <ul className="space-y-2">
                      {detail.branchAddons.items.map((addon) => (
                        <li
                          key={addon.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                        >
                          <div>
                            <p className="font-medium">
                              {addon.branchName ?? "Branch (unnamed)"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {addon.planName} · {addon.status}
                            </p>
                          </div>
                          <Badge variant="outline" className="font-normal">
                            RWF {addon.price.toLocaleString()}/mo
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No active branch add-on subscriptions.
                      {Number(pharmacy?.branch_addons_active ?? 0) > 0
                        ? ` (${pharmacy?.branch_addons_active} listed in table cache.)`
                        : ""}
                    </p>
                  )}
                </>
              ) : null}
            </section>

            <Separator />

            {/* Limits */}
            <section className="space-y-4">
              <SectionTitle
                icon={Users}
                title="Limits & usage"
                description="From the effective main plan and entitlements resolver"
              />
              {detail ? (
                <dl className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border p-3">
                    <dt className="text-xs text-muted-foreground">Staff</dt>
                    <dd className="mt-1 text-lg font-semibold tabular-nums">
                      {detail.entitlements.usage.activeUsers}
                      <span className="text-sm font-normal text-muted-foreground">
                        {" "}
                        / {detail.entitlements.limits.maxUsers}
                      </span>
                    </dd>
                  </div>
                  <div className="rounded-lg border p-3">
                    <dt className="text-xs text-muted-foreground">Branches</dt>
                    <dd className="mt-1 text-lg font-semibold tabular-nums">
                      {detail.entitlements.usage.activeBranches}
                      <span className="text-sm font-normal text-muted-foreground">
                        {" "}
                        / {detail.entitlements.limits.totalBranchSlots}
                      </span>
                    </dd>
                  </div>
                  <div className="rounded-lg border p-3 sm:col-span-2">
                    <dt className="text-xs text-muted-foreground">
                      Monthly transactions (per branch)
                    </dt>
                    <dd className="mt-1 font-medium tabular-nums">
                      {detail.entitlements.limits.monthlyTxPerBranch.toLocaleString()}{" "}
                      / branch / month
                    </dd>
                  </div>
                  <div className="rounded-lg border p-3 sm:col-span-2">
                    <dt className="text-xs text-muted-foreground">
                      Enabled features
                    </dt>
                    <dd className="mt-1 font-medium">
                      {detail.entitlements.featureCount} catalog features on this
                      plan
                      {detail.entitlements.isExpired ? (
                        <Badge variant="destructive" className="ml-2">
                          Expired
                        </Badge>
                      ) : !detail.entitlements.isAccessAllowed ? (
                        <Badge variant="destructive" className="ml-2">
                          Access blocked
                        </Badge>
                      ) : null}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Could not load entitlement details.
                </p>
              )}
            </section>
          </div>
  );
}
