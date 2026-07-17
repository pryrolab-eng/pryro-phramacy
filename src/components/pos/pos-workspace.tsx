"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import {
  Banknote,
  CreditCard,
  Maximize2,
  Minimize2,
  Minus,
  Package,
  Plus,
  Scan,
  ShoppingCart,
  Smartphone,
  Star,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DashboardButton,
  DashboardMetricGrid,
  DashboardSearchInput,
  DashboardStatCard,
  DashboardTabsList,
  DashboardPanelEmpty,
} from "@/components/dashboard";
import { FeatureGate } from "@/components/subscription/feature-gate";
import { InsuranceSelector } from "@/components/insurance-selector";
import {
  paginateList,
  PosCatalogPagination,
} from "@/components/pos/pos-catalog-pagination";
import { PosCategoryFilter } from "@/components/pos/pos-category-filter";
import { PosShiftPanel } from "@/components/pos/pos-shift-panel";
import {
  POS_CART_SCROLL_AFTER_LINES,
  POS_CATALOG_DEFAULT_PAGE_SIZE,
  POS_LOW_STOCK_THRESHOLD,
  formatPosNearExpiryLabel,
  posSurfaces,
} from "@/components/pos/pos-tokens";
import { cn } from "@/lib/utils";
import {
  formatProductGroupLabel,
  type PosProductGroup,
} from "@/lib/pos/product-groups";
import type { PosCartItem, PosCustomer, PosProduct } from "@/hooks/usePos";

type Category = { id: string; name: string };

type CustomerSuggestion = {
  id: string;
  name: string;
  phone: string;
  insurance_number?: string | null;
};

export type PosWorkspaceProps = {
  searchInputRef: RefObject<HTMLInputElement | null>;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onSearchEnter: () => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  categories: Category[];
  filteredGroups: PosProductGroup[];
  fastMoving: PosProduct[];
  productGroups: PosProductGroup[];
  priceAdjustments: Record<string, number>;
  onPriceAdjustment: (id: string, price: number) => void;
  onAddGroup: (group: PosProductGroup) => void;
  onAddProduct: (product: PosProduct) => void;
  onQuickAddProduct: () => void;
  onScan: () => void;
  cart: PosCartItem[];
  customer: PosCustomer;
  onCustomerChange: (customer: PosCustomer) => void;
  onCustomerNameChange: (name: string) => void;
  customerSuggestions: CustomerSuggestion[];
  showCustomerSuggestions: boolean;
  customerSearchFetching?: boolean;
  onSelectCustomer: (s: CustomerSuggestion) => void;
  onCustomerFocus: () => void;
  onCustomerBlur: () => void;
  onQuickAddPatient: () => void;
  onQuickAddInsurance: () => void;
  canInsurance: boolean;
  onInsuranceTypeChange: (type: string) => void;
  onOpenInsuranceProcessing?: () => void;
  updateQuantity: (id: string, qty: number) => void;
  subtotal: number;
  insuranceCoverage: number;
  patientAmount: number;
  activeBranchId: string | null;
  paymentMethod: string;
  onPaymentMethodChange: (method: string) => void;
  cashAmount: string;
  onCashAmountChange: (v: string) => void;
  insuranceAmount: string;
  onInsuranceAmountChange: (v: string) => void;
  onProcessSale: () => void;
  onClearCart: () => void;
  onHoldSale: () => void;
  onLookupCustomer: () => void;
  onPriceCheck: () => void;
  onVoidSale: () => void;
  onBackupCart?: () => void;
  saleDisabled: boolean;
  hasOpenShift?: boolean;
  shiftCheckReady?: boolean;
  showTeamShifts?: boolean;
  canHold?: boolean;
  canVoid?: boolean;
};

function PaymentMethodButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        posSurfaces.paymentOption,
        active && posSurfaces.paymentOptionActive,
      )}
    >
      {children}
    </button>
  );
}

/** Sidebar shorter than this uses payment dropdown to keep cart visible. */
const POS_COMPACT_PAYMENT_MAX_HEIGHT = 760;

function formatStockHighlight(stock: number): {
  label: string;
  tone: "ok" | "low" | "out";
} {
  if (stock <= 0) return { label: "Out of stock", tone: "out" };
  if (stock <= POS_LOW_STOCK_THRESHOLD) {
    return { label: `Low stock · ${stock}`, tone: "low" };
  }
  return { label: `Stock ${stock}`, tone: "ok" };
}

export function PosWorkspace(props: PosWorkspaceProps) {
  const {
    searchInputRef,
    searchTerm,
    onSearchTermChange,
    onSearchEnter,
    selectedCategory,
    onCategoryChange,
    categories,
    filteredGroups,
    fastMoving,
    productGroups,
    priceAdjustments,
    onAddGroup,
    onAddProduct,
    onQuickAddProduct,
    onScan,
    cart,
    customer,
    onCustomerChange,
    onCustomerNameChange,
    customerSuggestions,
    showCustomerSuggestions,
    customerSearchFetching = false,
    onSelectCustomer,
    onCustomerFocus,
    onCustomerBlur,
    onQuickAddPatient,
    onQuickAddInsurance,
    canInsurance,
    onInsuranceTypeChange,
    onOpenInsuranceProcessing,
    updateQuantity,
    subtotal,
    insuranceCoverage,
    patientAmount,
    activeBranchId,
    paymentMethod,
    onPaymentMethodChange,
    cashAmount,
    onCashAmountChange,
    insuranceAmount,
    onInsuranceAmountChange,
    onProcessSale,
    onClearCart,
    onHoldSale,
    onLookupCustomer,
    onPriceCheck,
    onVoidSale,
    onBackupCart,
    saleDisabled,
    hasOpenShift = true,
    shiftCheckReady = true,
    showTeamShifts = false,
    canHold = true,
    canVoid = true,
  } = props;

  const shiftBlocksSale = shiftCheckReady && !hasOpenShift;

  const itemCount = cart.reduce((n, i) => n + i.quantity, 0);
  const displayTotal = customer.insuranceType ? patientAmount : subtotal;

  const [catalogTab, setCatalogTab] = useState("all");
  const [catalogPage, setCatalogPage] = useState(1);
  const [pageSize, setPageSize] = useState(POS_CATALOG_DEFAULT_PAGE_SIZE);
  const catalogListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCatalogPage(1);
  }, [searchTerm, selectedCategory, catalogTab, pageSize]);

  const paginatedGroups = useMemo(
    () => paginateList(filteredGroups, catalogPage, pageSize),
    [filteredGroups, catalogPage, pageSize],
  );

  const paginatedFastMoving = useMemo(
    () => paginateList(fastMoving, catalogPage, pageSize),
    [fastMoving, catalogPage, pageSize],
  );

  const catalogTotal =
    catalogTab === "all" ? filteredGroups.length : fastMoving.length;

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(catalogTotal / pageSize) || 1);
    if (catalogPage > totalPages) setCatalogPage(totalPages);
  }, [catalogTotal, pageSize, catalogPage]);

  const scrollCatalogToTop = () => {
    catalogListRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToCatalogPage = (page: number) => {
    setCatalogPage(page);
    scrollCatalogToTop();
  };

  const cartNeedsScroll = cart.length > POS_CART_SCROLL_AFTER_LINES;
  const [fullscreen, setFullscreen] = useState(false);
  const [compactPayment, setCompactPayment] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  /** Product area was trapping the wheel — pass through to page when list can't scroll. */
  useEffect(() => {
    if (fullscreen) return;
    const el = catalogListRef.current;
    if (!el) return;

    const onWheel = (event: WheelEvent) => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const maxScroll = scrollHeight - clientHeight;
      const noOverflow = maxScroll <= 1;
      const atTop = scrollTop <= 0;
      const atBottom = scrollTop >= maxScroll - 1;
      const goingUp = event.deltaY < 0;
      const goingDown = event.deltaY > 0;

      if (noOverflow || (goingUp && atTop) || (goingDown && atBottom)) {
        const root =
          document.getElementById("dashboard-main-scroll") ??
          document.scrollingElement;
        if (!root) return;
        event.preventDefault();
        root.scrollTop += event.deltaY;
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [fullscreen, catalogTab, paginatedGroups.length, paginatedFastMoving.length]);

  useEffect(() => {
    const node = sidebarRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;

    const update = (height: number) => {
      setCompactPayment(height > 0 && height < POS_COMPACT_PAYMENT_MAX_HEIGHT);
    };

    update(node.getBoundingClientRect().height);
    const observer = new ResizeObserver((entries) => {
      const height = entries[0]?.contentRect.height ?? 0;
      update(height);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [fullscreen]);

  useEffect(() => {
    if (!fullscreen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.dataset.posFullscreen = "true";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      delete document.body.dataset.posFullscreen;
    };
  }, [fullscreen]);

  const content = (
    <div
      className={cn(
        "flex flex-col gap-4",
        fullscreen && "h-full max-h-full min-h-0 flex-1 gap-0 overflow-hidden",
      )}
    >
      {!fullscreen ? (
        <DashboardMetricGrid className="grid-cols-2 sm:grid-cols-4">
          <DashboardStatCard
            label="Cart"
            icon={ShoppingCart}
            value={itemCount}
            hint={`${cart.length} line${cart.length === 1 ? "" : "s"}`}
          />
          <DashboardStatCard
            label="Total due"
            icon={CreditCard}
            value={`${displayTotal.toLocaleString()} RWF`}
            hint={customer.insuranceType ? "Patient copay" : "Before payment"}
          />
          <DashboardStatCard
            label="Catalog"
            icon={Package}
            value={filteredGroups.length}
            hint="Products match filter"
          />
          <DashboardStatCard
            label="Payer"
            icon={User}
            value={customer.name.trim() || "Walk-in"}
            hint={
              customer.id
                ? "Registered customer"
                : customer.phone || "Walk-in — not in registry"
            }
          />
        </DashboardMetricGrid>
      ) : null}

      <div
        className={cn(
          posSurfaces.workspace,
          fullscreen && posSurfaces.workspaceFullscreen,
        )}
      >
        {/* Catalog */}
        <section className={posSurfaces.catalog} aria-label="Product catalog">
          <div className={posSurfaces.catalogHeader}>
            <div className="flex gap-2">
              <DashboardSearchInput
                ref={searchInputRef}
                placeholder="Search or scan barcode (Enter)"
                value={searchTerm}
                onChange={(e) => onSearchTermChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onSearchEnter();
                  }
                }}
                className="h-10 flex-1"
              />
              <DashboardButton size="icon" className="h-10 w-10" onClick={onScan}>
                <Scan className="h-4 w-4" />
              </DashboardButton>
              <DashboardButton
                size="sm"
                className="h-10 shrink-0 gap-1.5 px-3"
                onClick={onQuickAddProduct}
                title="Add product"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add product</span>
              </DashboardButton>
              <DashboardButton
                size="icon"
                className="h-10 w-10 shrink-0"
                tone="outline"
                title={fullscreen ? "Exit full window (Esc)" : "Full window POS"}
                aria-pressed={fullscreen}
                onClick={() => setFullscreen((open) => !open)}
              >
                {fullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </DashboardButton>
            </div>

            <PosCategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={onCategoryChange}
            />
          </div>

          <Tabs
            value={catalogTab}
            onValueChange={(value) => {
              setCatalogTab(value);
              setCatalogPage(1);
            }}
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            <div className="shrink-0 border-b border-neutral-100 px-4 py-2 dark:border-neutral-800">
              <DashboardTabsList>
                <TabsTrigger value="all">All products</TabsTrigger>
                <TabsTrigger value="favorites">
                  <Star className="mr-1 h-3.5 w-3.5" />
                  Fast moving
                </TabsTrigger>
              </DashboardTabsList>
            </div>

            <TabsContent
              value="all"
              className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
            >
              <div
                ref={catalogTab === "all" ? catalogListRef : undefined}
                className={cn(
                  posSurfaces.catalogList,
                  fullscreen && posSurfaces.catalogListFullscreen,
                )}
              >
                {filteredGroups.length === 0 ? (
                  <DashboardPanelEmpty
                    icon={Package}
                    title="No products found"
                    description="Try another search, category, or scan a barcode."
                  />
                ) : (
                  <div
                    className={cn(
                      posSurfaces.catalogGrid,
                      fullscreen && posSurfaces.catalogGridFullscreen,
                    )}
                  >
                    {paginatedGroups.map((group) => {
                      const price =
                        priceAdjustments[group.fefoBatch.id] ??
                        group.fefoBatch.price;
                      const expiryLabel = formatPosNearExpiryLabel(
                        group.nearestExpiryDays,
                      );
                      const stock = formatStockHighlight(group.totalStock);
                      return (
                        <div
                          key={group.medicationId}
                          className={cn(
                            posSurfaces.productCard,
                            stock.tone === "low" && posSurfaces.productCardLow,
                          )}
                          onClick={() => onAddGroup(group)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") onAddGroup(group);
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            <p className="line-clamp-2 min-w-0 flex-1 text-sm font-medium leading-snug text-neutral-900 dark:text-neutral-50">
                              {formatProductGroupLabel(group)}
                            </p>
                            {group.requiresPrescription ? (
                              <Badge
                                variant="destructive"
                                className="shrink-0 text-[10px]"
                              >
                                Rx
                              </Badge>
                            ) : null}
                          </div>
                          <div className={posSurfaces.productCardMeta}>
                            <span
                              className={cn(
                                stock.tone === "low" &&
                                  posSurfaces.productCardStockLow,
                                stock.tone === "out" &&
                                  posSurfaces.productCardStockOut,
                              )}
                            >
                              {stock.label}
                            </span>
                            {expiryLabel ? (
                              <span className={posSurfaces.productCardExpiry}>
                                {expiryLabel}
                              </span>
                            ) : null}
                          </div>
                          <p className={posSurfaces.productCardPrice}>
                            {price.toLocaleString()}{" "}
                            <span className="text-[10px] font-medium text-neutral-500">
                              RWF
                            </span>
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              {filteredGroups.length > 0 ? (
                <PosCatalogPagination
                  page={catalogPage}
                  pageSize={pageSize}
                  totalItems={filteredGroups.length}
                  onPageChange={goToCatalogPage}
                  onPageSizeChange={setPageSize}
                />
              ) : (
                <div className={posSurfaces.catalogFooter}>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    No products
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent
              value="favorites"
              className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
            >
              <div
                ref={catalogTab === "favorites" ? catalogListRef : undefined}
                className={cn(
                  posSurfaces.catalogList,
                  fullscreen && posSurfaces.catalogListFullscreen,
                )}
              >
                {fastMoving.length === 0 ? (
                  <DashboardPanelEmpty
                    icon={Star}
                    title="No fast movers"
                    description="Sales velocity data will appear here."
                  />
                ) : (
                  <div
                    className={cn(
                      posSurfaces.catalogGrid,
                      fullscreen && posSurfaces.catalogGridFullscreen,
                    )}
                  >
                    {paginatedFastMoving.map((product, index) => {
                      const group = productGroups.find(
                        (g) => g.medicationId === product.medicationId,
                      );
                      const rank = (catalogPage - 1) * pageSize + index + 1;
                      const stock = group?.totalStock ?? product.stock;
                      const requiresRx =
                        group?.requiresPrescription ??
                        product.requiresPrescription;
                      const expiryDays =
                        group?.nearestExpiryDays ?? product.daysToExpiry;
                      const expiryLabel = formatPosNearExpiryLabel(expiryDays);
                      const stockHighlight = formatStockHighlight(stock);
                      const price = group
                        ? (priceAdjustments[group.fefoBatch.id] ??
                          group.fefoBatch.price)
                        : product.price;

                      return (
                        <div
                          key={product.id}
                          className={cn(
                            posSurfaces.productCardFast,
                            stockHighlight.tone === "low" &&
                              posSurfaces.productCardLow,
                          )}
                          onClick={() =>
                            group ? onAddGroup(group) : onAddProduct(product)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              group
                                ? onAddGroup(group)
                                : onAddProduct(product);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            <span className={posSurfaces.productCardFastRank}>
                              #{rank}
                            </span>
                            {requiresRx ? (
                              <Badge
                                variant="destructive"
                                className="shrink-0 text-[10px]"
                              >
                                Rx
                              </Badge>
                            ) : (
                              <span className="relative flex h-1.5 w-1.5 shrink-0">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                              </span>
                            )}
                          </div>
                          <p className="line-clamp-2 text-sm font-medium leading-snug text-neutral-900 dark:text-neutral-50">
                            {group
                              ? formatProductGroupLabel(group)
                              : product.name}
                          </p>
                          <div className={posSurfaces.productCardMeta}>
                            <span
                              className={cn(
                                stockHighlight.tone === "low" &&
                                  posSurfaces.productCardStockLow,
                                stockHighlight.tone === "out" &&
                                  posSurfaces.productCardStockOut,
                              )}
                            >
                              {stockHighlight.label}
                            </span>
                            {expiryLabel ? (
                              <span className={posSurfaces.productCardExpiry}>
                                {expiryLabel}
                              </span>
                            ) : null}
                          </div>
                          <p className={posSurfaces.productCardPrice}>
                            {price.toLocaleString()}{" "}
                            <span className="text-[10px] font-medium text-neutral-500">
                              RWF
                            </span>
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              {fastMoving.length > 0 ? (
                <PosCatalogPagination
                  page={catalogPage}
                  pageSize={pageSize}
                  totalItems={fastMoving.length}
                  onPageChange={goToCatalogPage}
                  onPageSizeChange={setPageSize}
                />
              ) : (
                <div className={posSurfaces.catalogFooter}>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    No products
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </section>

        {/* Cart + payment */}
        <aside
          ref={sidebarRef}
          className={posSurfaces.sidebar}
          aria-label="Order and payment"
        >
          <div className={posSurfaces.sidebarTop}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                Current order
              </h2>
              <Badge variant="secondary" className="tabular-nums">
                {itemCount} items
              </Badge>
            </div>

            <div className="relative z-20 space-y-2 overflow-visible rounded-lg border border-neutral-200/80 bg-neutral-50/50 p-2.5 dark:border-neutral-800 dark:bg-neutral-900/40">
              <Label className="text-xs text-neutral-500">Payer</Label>
              <div className="relative flex gap-2">
                <Input
                  placeholder="Name, phone, or insurance #…"
                  value={customer.name}
                  onChange={(e) => onCustomerNameChange(e.target.value)}
                  onFocus={onCustomerFocus}
                  onBlur={onCustomerBlur}
                  className="h-9"
                  autoComplete="off"
                />
                <DashboardButton
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={onQuickAddPatient}
                >
                  <Plus className="h-4 w-4" />
                </DashboardButton>
                {showCustomerSuggestions ? (
                  <div className="absolute left-0 top-full z-[110] mt-1 max-h-40 w-[calc(100%-2.75rem)] overflow-y-auto rounded-lg border border-neutral-200/80 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
                    {customerSearchFetching ? (
                      <p className="px-3 py-2 text-sm text-neutral-500">
                        Searching…
                      </p>
                    ) : customerSuggestions.length === 0 ? (
                      <p className="px-3 py-2 text-sm text-neutral-500">
                        No customers found
                      </p>
                    ) : (
                      customerSuggestions.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          className="w-full border-b border-neutral-100 px-3 py-2 text-left last:border-0 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800"
                          onMouseDown={() => onSelectCustomer(s)}
                        >
                          <p className="text-sm font-medium">{s.name}</p>
                          <p className="text-xs text-neutral-500">
                            {s.phone || "No phone"}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                ) : null}
              </div>
              <FeatureGate featureKey="pos.insurance" compact>
                <div className="flex gap-2 pt-1">
                  <div className="min-w-0 flex-1">
                    <InsuranceSelector
                      value={customer.insuranceType || "cash"}
                      onValueChange={onInsuranceTypeChange}
                      coveragePercent={customer.coveragePercent}
                    />
                  </div>
                  <DashboardButton
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={onQuickAddInsurance}
                  >
                    <Plus className="h-4 w-4" />
                  </DashboardButton>
                </div>
                {customer.insuranceType ? (
                  <>
                    <Input
                      placeholder="Insurance number"
                      value={customer.insuranceNumber}
                      onChange={(e) =>
                        onCustomerChange({
                          ...customer,
                          insuranceNumber: e.target.value,
                        })
                      }
                      className="mt-2 h-9"
                    />
                    {cart.length > 0 && onOpenInsuranceProcessing ? (
                      <DashboardButton
                        type="button"
                        size="sm"
                        className="mt-2 h-8 w-full text-xs"
                        onClick={onOpenInsuranceProcessing}
                      >
                        Insurance claim details
                      </DashboardButton>
                    ) : null}
                  </>
                ) : null}
              </FeatureGate>
            </div>
          </div>

          <div
            className={cn(
              posSurfaces.sidebarCart,
              cart.length === 0
                ? posSurfaces.sidebarCartEmpty
                : posSurfaces.sidebarCartScroll,
              cartNeedsScroll && posSurfaces.sidebarCartCap,
            )}
            aria-label="Cart line items"
            role="region"
          >
            {cart.length === 0 ? (
              <DashboardPanelEmpty
                icon={ShoppingCart}
                title="Cart is empty"
                description="Select products from the catalog or scan a barcode."
                className="min-h-0 border-0 bg-transparent py-4 shadow-none"
              />
            ) : (
              <>
                {cartNeedsScroll ? (
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                    {cart.length} lines — scroll to see all
                  </p>
                ) : null}
                <ul className="space-y-2 pr-0.5">
                  {cart.map((item) => (
                    <li key={item.id} className={posSurfaces.cartLine}>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-neutral-500">
                          Batch {item.batch} · {item.price.toLocaleString()}{" "}
                          RWF
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {item.requiresPrescription && (
                            <Badge variant="destructive" className="text-[10px]">
                              Rx
                            </Badge>
                          )}
                          {item.daysToExpiry <= 30 && (
                            <Badge variant="destructive" className="text-[10px]">
                              Exp {item.daysToExpiry}d
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <DashboardButton
                          size="icon"
                          className="h-7 w-7"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                        >
                          <Minus className="h-3 w-3" />
                        </DashboardButton>
                        <span className="w-6 text-center text-sm font-medium tabular-nums">
                          {item.quantity}
                        </span>
                        <DashboardButton
                          size="icon"
                          className="h-7 w-7"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                        >
                          <Plus className="h-3 w-3" />
                        </DashboardButton>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <div
            className={cn(
              posSurfaces.sidebarFooter,
              compactPayment &&
                fullscreen &&
                posSurfaces.sidebarFooterFullscreen,
            )}
          >
            <div className={posSurfaces.totalDisplay}>
              <p className="text-xs font-medium uppercase tracking-wide opacity-80">
                Total due
              </p>
              <p className="text-xl font-semibold tabular-nums tracking-tight">
                {displayTotal.toLocaleString()} RWF
              </p>
              {canInsurance && customer.insuranceType ? (
                <p className="mt-0.5 text-xs opacity-80">
                  Insurance {insuranceCoverage.toLocaleString()} · Patient{" "}
                  {patientAmount.toLocaleString()}
                </p>
              ) : (
                <p className="mt-0.5 text-xs opacity-80">
                  Subtotal {subtotal.toLocaleString()} RWF
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-neutral-500">Payment method</Label>
              {fullscreen && compactPayment ? (
                <Select
                  value={paymentMethod || "cash"}
                  onValueChange={onPaymentMethodChange}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent className="z-[110]">
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="mobile">Mobile</SelectItem>
                    {canInsurance ? (
                      <>
                        <SelectItem value="insurance">Insurance</SelectItem>
                        <SelectItem value="split">Split</SelectItem>
                      </>
                    ) : null}
                  </SelectContent>
                </Select>
              ) : (
                <div className={posSurfaces.paymentGrid}>
                  <PaymentMethodButton
                    active={paymentMethod === "cash"}
                    onClick={() => onPaymentMethodChange("cash")}
                  >
                    <Banknote className="h-4 w-4" />
                    Cash
                  </PaymentMethodButton>
                  <PaymentMethodButton
                    active={paymentMethod === "card"}
                    onClick={() => onPaymentMethodChange("card")}
                  >
                    <CreditCard className="h-4 w-4" />
                    Card
                  </PaymentMethodButton>
                  <PaymentMethodButton
                    active={paymentMethod === "mobile"}
                    onClick={() => onPaymentMethodChange("mobile")}
                  >
                    <Smartphone className="h-4 w-4" />
                    Mobile
                  </PaymentMethodButton>
                  {canInsurance ? (
                    <>
                      <PaymentMethodButton
                        active={paymentMethod === "insurance"}
                        onClick={() => onPaymentMethodChange("insurance")}
                      >
                        Insurance
                      </PaymentMethodButton>
                      <PaymentMethodButton
                        active={paymentMethod === "split"}
                        onClick={() => onPaymentMethodChange("split")}
                      >
                        Split
                      </PaymentMethodButton>
                    </>
                  ) : null}
                </div>
              )}
            </div>

            {canInsurance && paymentMethod === "split" && (
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Cash"
                  type="number"
                  value={cashAmount}
                  onChange={(e) => onCashAmountChange(e.target.value)}
                  className="h-9"
                />
                <Input
                  placeholder="Insurance"
                  type="number"
                  value={insuranceAmount}
                  onChange={(e) => onInsuranceAmountChange(e.target.value)}
                  className="h-9"
                />
              </div>
            )}

            <PosShiftPanel
              branchId={activeBranchId}
              showTeamShifts={showTeamShifts}
              shiftRequired
            />

            {shiftBlocksSale ? (
              <p className="text-center text-xs font-medium text-amber-800 dark:text-amber-200">
                Open your cashier shift above to complete a sale.
              </p>
            ) : null}
            <DashboardButton
              tone="primary"
              className="h-11 w-full text-base"
              onClick={onProcessSale}
              disabled={saleDisabled}
            >
              Complete sale
              <span className="ml-2 text-xs opacity-70">F2</span>
            </DashboardButton>

            <div className="flex gap-2">
              <DashboardButton className="flex-1" onClick={onClearCart}>
                Clear
              </DashboardButton>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <DashboardButton className="flex-1">More</DashboardButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="z-[110] w-48">
                  {canHold && (
                    <DropdownMenuItem onClick={onHoldSale}>Hold sale</DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={onLookupCustomer}>
                    Find customer
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onPriceCheck}>
                    Price check
                  </DropdownMenuItem>
                  {onBackupCart ? (
                    <DropdownMenuItem onClick={onBackupCart}>
                      Backup cart
                    </DropdownMenuItem>
                  ) : null}
                  {canVoid && (
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={onVoidSale}
                    >
                      Void sale
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );

  if (fullscreen) {
    return (
      <>
        <div className="invisible flex flex-col gap-4" aria-hidden>
          <div className="h-[28rem]" />
        </div>
        <div
          className={posSurfaces.fullscreenOverlay}
          role="dialog"
          aria-modal="true"
          aria-label="Point of Sale full window"
        >
          {content}
        </div>
      </>
    );
  }

  return content;
}
