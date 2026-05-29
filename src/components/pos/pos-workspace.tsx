"use client";

import type { RefObject } from "react";
import {
  AlertTriangle,
  Banknote,
  CreditCard,
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
import { PosShiftPanel } from "@/components/pos/pos-shift-panel";
import { posSurfaces } from "@/components/pos/pos-tokens";
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
  onQuickAddDrug: () => void;
  onQuickAddCategory: () => void;
  onScan: () => void;
  cart: PosCartItem[];
  customer: PosCustomer;
  onCustomerChange: (customer: PosCustomer) => void;
  onCustomerNameChange: (name: string) => void;
  customerSuggestions: CustomerSuggestion[];
  showCustomerSuggestions: boolean;
  onSelectCustomer: (s: CustomerSuggestion) => void;
  onCustomerFocus: () => void;
  onCustomerBlur: () => void;
  onQuickAddPatient: () => void;
  onQuickAddInsurance: () => void;
  canInsurance: boolean;
  onInsuranceTypeChange: (type: string) => void;
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
    onPriceAdjustment,
    onAddGroup,
    onAddProduct,
    onQuickAddDrug,
    onQuickAddCategory,
    onScan,
    cart,
    customer,
    onCustomerChange,
    onCustomerNameChange,
    customerSuggestions,
    showCustomerSuggestions,
    onSelectCustomer,
    onCustomerFocus,
    onCustomerBlur,
    onQuickAddPatient,
    onQuickAddInsurance,
    canInsurance,
    onInsuranceTypeChange,
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
  } = props;

  const itemCount = cart.reduce((n, i) => n + i.quantity, 0);
  const displayTotal = customer.insuranceType ? patientAmount : subtotal;

  return (
    <div className="space-y-4">
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
          label="Customer"
          icon={User}
          value={customer.name.trim() || "Walk-in"}
          hint={customer.phone || "No phone"}
        />
      </DashboardMetricGrid>

      <div className={posSurfaces.workspace}>
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
                size="icon"
                className="h-10 w-10"
                onClick={onQuickAddDrug}
              >
                <Plus className="h-4 w-4" />
              </DashboardButton>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-0.5">
              <button
                type="button"
                onClick={() => onCategoryChange("all")}
                className={cn(
                  posSurfaces.categoryChip,
                  selectedCategory === "all" && posSurfaces.categoryChipActive,
                )}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onCategoryChange(cat.name)}
                  className={cn(
                    posSurfaces.categoryChip,
                    selectedCategory === cat.name &&
                      posSurfaces.categoryChipActive,
                  )}
                >
                  {cat.name}
                </button>
              ))}
              <DashboardButton
                tone="ghost"
                size="sm"
                className="shrink-0"
                onClick={onQuickAddCategory}
              >
                <Plus className="h-3.5 w-3.5" />
              </DashboardButton>
            </div>
          </div>

          <Tabs defaultValue="all" className="flex min-h-0 flex-1 flex-col">
            <div className="border-b border-neutral-100 px-4 py-2 dark:border-neutral-800">
              <DashboardTabsList>
                <TabsTrigger value="all">All products</TabsTrigger>
                <TabsTrigger value="favorites">
                  <Star className="mr-1 h-3.5 w-3.5" />
                  Fast moving
                </TabsTrigger>
              </DashboardTabsList>
            </div>

            <div className={posSurfaces.catalogBody}>
              <TabsContent value="all" className="mt-0 space-y-2">
                {filteredGroups.length === 0 ? (
                  <DashboardPanelEmpty
                    icon={Package}
                    title="No products found"
                    description="Try another search, category, or scan a barcode."
                  />
                ) : (
                  filteredGroups.map((group) => (
                    <div
                      key={group.medicationId}
                      className={posSurfaces.productCard}
                      onClick={() => onAddGroup(group)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") onAddGroup(group);
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-neutral-900 dark:text-neutral-50">
                          {formatProductGroupLabel(group)}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          <Badge variant="outline" className="text-[10px]">
                            FEFO · {group.fefoBatch.batch}
                          </Badge>
                          {group.batchCount > 1 && (
                            <Badge variant="secondary" className="text-[10px]">
                              {group.batchCount} batches
                            </Badge>
                          )}
                          {group.requiresPrescription && (
                            <Badge variant="destructive" className="text-[10px]">
                              Rx
                            </Badge>
                          )}
                          {group.nearestExpiryDays <= 30 && (
                            <Badge variant="destructive" className="text-[10px]">
                              <AlertTriangle className="mr-0.5 h-3 w-3" />
                              {group.nearestExpiryDays}d
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-neutral-500">
                          Stock {group.totalStock}
                        </p>
                      </div>
                      <div
                        className="shrink-0 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Input
                          type="number"
                          className="h-8 w-24 text-right text-sm tabular-nums"
                          value={
                            priceAdjustments[group.fefoBatch.id] ??
                            group.fefoBatch.price
                          }
                          onChange={(e) =>
                            onPriceAdjustment(
                              group.fefoBatch.id,
                              Number(e.target.value),
                            )
                          }
                        />
                        <p className="mt-1 text-xs font-medium tabular-nums text-neutral-600">
                          RWF
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="favorites" className="mt-0 space-y-2">
                {fastMoving.length === 0 ? (
                  <DashboardPanelEmpty
                    icon={Star}
                    title="No fast movers"
                    description="Sales velocity data will appear here."
                  />
                ) : (
                  fastMoving.map((product) => {
                    const group = productGroups.find(
                      (g) => g.medicationId === product.medicationId,
                    );
                    return (
                      <div
                        key={product.id}
                        className={posSurfaces.productCard}
                        onClick={() =>
                          group
                            ? onAddGroup(group)
                            : onAddProduct(product)
                        }
                      >
                        <p className="flex-1 text-sm font-medium">
                          {product.name}
                        </p>
                        <span className="text-sm font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">
                          {product.price.toLocaleString()} RWF
                        </span>
                      </div>
                    );
                  })
                )}
              </TabsContent>
            </div>
          </Tabs>
        </section>

        {/* Order sidebar */}
        <aside className={posSurfaces.sidebar} aria-label="Order checkout">
          <div className={posSurfaces.sidebarScroll}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                Current order
              </h2>
              <Badge variant="secondary" className="tabular-nums">
                {itemCount} items
              </Badge>
            </div>

            <div className="mb-4 space-y-2 rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
              <Label className="text-xs text-neutral-500">Customer</Label>
              <div className="relative flex gap-2">
                <Input
                  placeholder="Name or search…"
                  value={customer.name}
                  onChange={(e) => onCustomerNameChange(e.target.value)}
                  onFocus={onCustomerFocus}
                  onBlur={onCustomerBlur}
                  className="h-9"
                />
                <DashboardButton
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={onQuickAddPatient}
                >
                  <Plus className="h-4 w-4" />
                </DashboardButton>
                {showCustomerSuggestions && customerSuggestions.length > 0 && (
                  <div className="absolute top-full z-50 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-neutral-200/80 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
                    {customerSuggestions.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className="w-full border-b border-neutral-100 px-3 py-2 text-left last:border-0 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800"
                        onMouseDown={() => onSelectCustomer(s)}
                      >
                        <p className="text-sm font-medium">{s.name}</p>
                        <p className="text-xs text-neutral-500">{s.phone}</p>
                      </button>
                    ))}
                  </div>
                )}
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
                ) : null}
              </FeatureGate>
            </div>

            {cart.length === 0 ? (
              <DashboardPanelEmpty
                icon={ShoppingCart}
                title="Cart is empty"
                description="Select products from the catalog or scan a barcode."
                className="min-h-[160px]"
              />
            ) : (
              <ul className="space-y-2">
                {cart.map((item) => (
                  <li key={item.id} className={posSurfaces.cartLine}>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-neutral-500">
                        Batch {item.batch} · {item.price.toLocaleString()} RWF
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
            )}
          </div>

          <div className={posSurfaces.sidebarFooter}>
            <div className={posSurfaces.totalDisplay}>
              <p className="text-xs font-medium uppercase tracking-wide opacity-80">
                Total due
              </p>
              <p className="text-2xl font-semibold tabular-nums tracking-tight">
                {displayTotal.toLocaleString()} RWF
              </p>
              {canInsurance && customer.insuranceType ? (
                <p className="mt-1 text-xs opacity-80">
                  Insurance {insuranceCoverage.toLocaleString()} · Patient{" "}
                  {patientAmount.toLocaleString()}
                </p>
              ) : (
                <p className="mt-1 text-xs opacity-80">
                  Subtotal {subtotal.toLocaleString()} RWF
                </p>
              )}
            </div>

            <PosShiftPanel branchId={activeBranchId} />

            <div className="space-y-2">
              <Label className="text-xs text-neutral-500">Payment method</Label>
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

            <DashboardButton
              tone="primary"
              className="h-12 w-full text-base"
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
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={onHoldSale}>Hold sale</DropdownMenuItem>
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
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={onVoidSale}
                  >
                    Void sale
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
