'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { getCustomer } from '@/lib/http/customers'
import { usePharmacyStore } from '@/hooks/usePharmacyStore'
import {
  checkPosTransactionAllowed,
  useAnalyzeCartSafetyMutation,
  useCustomerSearch,
  useHoldPosSaleMutation,
  useInsuranceLookupMutation,
  useInsuranceProcessMutation,
  usePosCategories,
  usePosCustomerLookupMutation,
  usePosFastMoving,
  usePosPriceCheckMutation,
  usePosProducts,
  useProcessPosSaleMutation,
  useQuickAddPosEntityMutation,
  useQuickAddPosPatientMutation,
  useVoidPosSaleMutation,
  useInsuranceCoveragePreview,
  useCashierShift,
  type PosCartItem,
  type PosCustomer,
  type PosProduct,
  type PrescriptionConfirmation,
} from '@/hooks/usePos'
import { useCreateInventoryCategoryMutation } from '@/hooks/useInventory'
import { usePharmacySettingsInfo } from '@/hooks/usePharmacySettingsPage'
import { useInvoiceTemplate } from '@/hooks/useInvoiceTemplate'
import {
  cartHasNearExpiry,
  cartRequiresPrescription,
} from '@/lib/pos/pharmacy-rules'
import {
  filterProductGroups,
  groupPosProducts,
  type PosProductGroup,
} from '@/lib/pos/product-groups'
import {
  addMedicationToCart,
  setCartLineQuantity,
  type PosCartLine,
} from '@/lib/pos/pos-cart'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, CreditCard, AlertTriangle, Brain, RotateCcw } from 'lucide-react'
import {
  DashboardPageShell,
  DashboardPageHeader,
  DashboardPageLoading,
  DashboardButton,
  DashboardToolbar,
  Dialog,
  DashboardDialogContent,
  DashboardDialogHeader,
  DashboardDialogTitle,
  DashboardDialogDescription,
  DashboardDialogBody,
  DashboardDialogFooter,
  DashboardDialogActions,
  dashboardSurfaces,
  SubscriptionWelcomeGate,
} from '@/components/dashboard'
import { cn } from '@/lib/utils'
import { FeatureGate } from '@/components/subscription/feature-gate'
import { usePharmacyEntitlements } from '@/hooks/usePharmacyEntitlements'
import { useAiPageContext } from '@/components/ai-panel'
import { createPosPageContext } from '@/lib/ai/page-context'
import { useActivePharmacy } from '@/components/providers/active-pharmacy-provider'
import { PosReturnsDialog } from '@/components/pos/pos-returns-dialog'
import { PosWorkspace } from '@/components/pos/pos-workspace'
import { PosAddProductForm } from '@/components/pos/pos-add-product-form'
import { PosInsuranceProcessingDialog } from '@/components/pos/pos-insurance-processing-dialog'
import { PosReceiptPreviewDialog } from '@/components/pos/pos-receipt-preview-dialog'
import { PHARMACY_ROUTES } from '@/lib/routes/pharmacy-paths'
import {
  type PosReceiptInput,
} from '@/lib/pos/print-receipt'
import type { AiSafetyResult } from '@/lib/http/pos'
import type { CategoryCatalogItem } from '@/lib/pharmacy/category-catalog'

type Product = PosProduct
type CartItem = PosCartItem
type Customer = PosCustomer
type PosUtilityDialog = 'customer-lookup' | 'price-check' | 'void-sale' | null

function createEmptyPosCustomer(): Customer {
  return {
    id: null,
    name: '',
    phone: '',
    insuranceNumber: '',
    insuranceType: '',
    coveragePercent: 0,
  }
}

export default function POSPage() {
  return (
    <SubscriptionWelcomeGate>
      <POSPageContent />
    </SubscriptionWelcomeGate>
  )
}

function POSPageContent() {
  const searchParams = useSearchParams()
  const preloadedCustomerIdRef = useRef<string | null>(null)
  const { can } = usePharmacyEntitlements()
  const { activeBranchId, isHydrating: isContextHydrating, context } =
    useActivePharmacy()
  const shiftQuery = useCashierShift(activeBranchId)
  const pharmacySettingsQuery = usePharmacySettingsInfo({
    enabled: Boolean(context.activePharmacyId),
  })
  const invoiceTemplateQuery = useInvoiceTemplate({
    enabled: Boolean(context.activePharmacyId),
  })
  const hasOpenShift = Boolean(shiftQuery.data)
  const shiftCheckReady =
    !shiftQuery.isLoading && !isContextHydrating && Boolean(activeBranchId)
  const isPharmacyOwner = context.role === 'pharmacy_owner'
  const productsQuery = usePosProducts({ branchId: activeBranchId })
  const fastMovingQuery = usePosFastMoving({ branchId: activeBranchId })
  const categoriesQuery = usePosCategories()
  const products = productsQuery.data ?? []
  const fastMoving = fastMovingQuery.data ?? []
  const categories = (categoriesQuery.data ?? []) as CategoryCatalogItem[]

  const [cart, setCart] = useState<CartItem[]>([])
  const [customer, setCustomer] = useState<Customer>(createEmptyPosCustomer)
  const [customerSearchQuery, setCustomerSearchQuery] = useState('')
  const customerSearchResult = useCustomerSearch(customerSearchQuery)
  const customerSuggestions = customerSearchResult.data ?? []
  const [customerSearchFocused, setCustomerSearchFocused] = useState(false)
  const trimmedCustomerSearchQuery = customerSearchQuery.trim()
  const showCustomerSuggestions =
    customerSearchFocused && trimmedCustomerSearchQuery.length >= 2
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [priceAdjustments, setPriceAdjustments] = useState<{[key: string]: number}>({})
  const [paymentMethod, setPaymentMethod] = useState('')
  const [cashAmount, setCashAmount] = useState('')
  const [insuranceAmount, setInsuranceAmount] = useState('')
  const [quickAddDialog, setQuickAddDialog] = useState<'product' | 'patient' | 'insurance' | 'rama-beneficiary' | null>(null)
  const [quickAddProductCategory, setQuickAddProductCategory] = useState('')
  const [insuranceInterfaceOpen, setInsuranceInterfaceOpen] = useState(false)
  const [ramaBeneficiaryOpen, setRamaBeneficiaryOpen] = useState(false)
  const [alertsOpen, setAlertsOpen] = useState(false)
  const [returnsDialogOpen, setReturnsDialogOpen] = useState(false)
  const [utilityDialog, setUtilityDialog] = useState<PosUtilityDialog>(null)
  const [utilityInput, setUtilityInput] = useState('')
  const [utilityReason, setUtilityReason] = useState('User requested')
  const [aiSafetyOpen, setAiSafetyOpen] = useState(false)
  const [aiSafetyResult, setAiSafetyResult] = useState<AiSafetyResult | null>(null)
  const [aiSafetyLoading, setAiSafetyLoading] = useState(false)
  const [rxDialogOpen, setRxDialogOpen] = useState(false)
  const [pendingNearExpiry, setPendingNearExpiry] = useState<PosProduct | null>(null)
  const [rxForm, setRxForm] = useState({ patientName: '', prescriberName: '', notes: '' })
  const [prescriptionConfirmed, setPrescriptionConfirmed] = useState(false)
  const [nearExpiryAcknowledged, setNearExpiryAcknowledged] = useState(false)
  const [checkoutAfterRx, setCheckoutAfterRx] = useState(false)
  const [checkoutNearExpiryOpen, setCheckoutNearExpiryOpen] = useState(false)
  const [receiptPreviewOpen, setReceiptPreviewOpen] = useState(false)
  const [pendingReceipt, setPendingReceipt] = useState<PosReceiptInput | null>(null)
  const deferredCheckoutRef = useRef<{
    prescriptionConfirmation?: PrescriptionConfirmation
    nearExpiryAcknowledged?: boolean
    paymentTransactionId?: string
  }>(undefined)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const loading =
    isContextHydrating ||
    productsQuery.isLoading ||
    fastMovingQuery.isLoading ||
    categoriesQuery.isLoading

  useAiPageContext('pos', createPosPageContext({
    route: '/pharmacy/pos',
    summary: {
      cartItemCount: cart.length,
      cartTotal: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
      productCount: products.length,
      lowStockCount: products.filter(p => p.daysToExpiry <= 30).length,
      expiringSoonCount: products.filter(p => p.daysToExpiry <= 60).length,
    },
  }))

  const saleMutation = useProcessPosSaleMutation()
  const holdSaleMutation = useHoldPosSaleMutation()
  const voidSaleMutation = useVoidPosSaleMutation()
  const customerLookupMutation = usePosCustomerLookupMutation()
  const priceCheckMutation = usePosPriceCheckMutation()
  const quickAddPatientMutation = useQuickAddPosPatientMutation()
  const quickAddEntityMutation = useQuickAddPosEntityMutation()
  const createCategoryMutation = useCreateInventoryCategoryMutation()
  const aiSafetyMutation = useAnalyzeCartSafetyMutation()
  const insuranceLookupMutation = useInsuranceLookupMutation()
  const insuranceProcessMutation = useInsuranceProcessMutation()

  const openUtilityDialog = useCallback((dialog: Exclude<PosUtilityDialog, null>) => {
    setUtilityDialog(dialog)
    setUtilityInput('')
    setUtilityReason(dialog === 'void-sale' ? 'User requested' : '')
  }, [])

  const closeUtilityDialog = useCallback(() => {
    setUtilityDialog(null)
    setUtilityInput('')
    setUtilityReason('User requested')
  }, [])

  const runUtilityDialog = useCallback(async () => {
    const value = utilityInput.trim()
    if (!utilityDialog || !value) return

    try {
      if (utilityDialog === 'customer-lookup') {
        const customers = await customerLookupMutation.mutateAsync(value)
        if (customers.length) {
          const found = customers[0]
          setCustomer((current) => ({
            ...current,
            id: found.id ?? null,
            name: found.name,
            phone: found.phone ?? value,
          }))
          toast.success(`Found ${found.name}`)
        } else {
          toast.info('Customer not found')
        }
      }

      if (utilityDialog === 'price-check') {
        const found = await priceCheckMutation.mutateAsync(value)
        if (found.length) {
          toast.success(`${found[0].name}: ${found[0].price} RWF`)
          setSearchTerm(value)
        } else {
          toast.info('Product not found')
        }
      }

      if (utilityDialog === 'void-sale') {
        const data = await voidSaleMutation.mutateAsync({
          saleId: value,
          reason: utilityReason.trim() || 'User requested',
        })
        if (data.success) {
          toast.success('Sale voided successfully')
        } else {
          toast.error(data.error || 'Failed to void sale')
        }
      }

      closeUtilityDialog()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Action failed')
    }
  }, [
    closeUtilityDialog,
    customerLookupMutation,
    priceCheckMutation,
    utilityDialog,
    utilityInput,
    utilityReason,
    voidSaleMutation,
  ])
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (
        event.key === 'F2' &&
        cart.length > 0 &&
        paymentMethod &&
        hasOpenShift
      ) {
        event.preventDefault()
        processSale()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [cart, paymentMethod, hasOpenShift])
  
  const productGroups = useMemo(
    () => groupPosProducts(products as PosCartLine[]),
    [products],
  )

  const filteredGroups = useMemo(
    () => filterProductGroups(productGroups, searchTerm, selectedCategory),
    [productGroups, searchTerm, selectedCategory],
  )

  const applyCart = useCallback((next: PosCartLine[]) => {
    setCart(next)
  }, [])

  const handleAddProduct = useCallback(
    async (batch: Product, options?: { acknowledgeNearExpiry?: boolean }) => {
      const result = addMedicationToCart(
        cart as PosCartLine[],
        products as PosCartLine[],
        batch as PosCartLine,
        priceAdjustments,
        options,
      )

      if (result.needsNearExpiryConfirm) {
        setPendingNearExpiry(batch)
        return
      }

      if (result.error) {
        toast.error(result.error)
        return
      }

      applyCart(result.cart)
    },
    [cart, products, priceAdjustments, applyCart],
  )

  const handleAddGroup = useCallback(
    (group: PosProductGroup, options?: { acknowledgeNearExpiry?: boolean }) => {
      void handleAddProduct(group.fefoBatch, options)
    },
    [handleAddProduct],
  )

  const tryBarcodeAdd = useCallback(() => {
    const code = searchTerm.trim()
    if (!code) {
      searchInputRef.current?.focus()
      toast.info('Scan or enter a barcode in the product search field.')
      return
    }
    const normalizedCode = code.toLowerCase()
    const byBarcode = productGroups.filter(
      (g) => g.barcode && g.barcode.toLowerCase() === normalizedCode,
    )
    if (byBarcode.length === 1) {
      handleAddGroup(byBarcode[0]!)
      setSearchTerm('')
      toast.success(`${byBarcode[0]!.name} added from barcode`)
      return
    }
    if (filteredGroups.length === 1) {
      handleAddGroup(filteredGroups[0]!)
      setSearchTerm('')
      toast.success(`${filteredGroups[0]!.name} added`)
      return
    }
    if (byBarcode.length > 1 || filteredGroups.length > 1) {
      toast.info('Multiple products match. Select the correct product from the catalog.')
      return
    }
    toast.info('No product matched that barcode or search.')
  }, [searchTerm, productGroups, filteredGroups, handleAddGroup])

  useEffect(() => {
    setAiSafetyResult(null)
  }, [cart])

  const updateQuantity = (inventoryId: string, quantity: number) => {
    const { cart: next, error } = setCartLineQuantity(
      cart as PosCartLine[],
      products as PosCartLine[],
      inventoryId,
      quantity,
      priceAdjustments,
    )
    if (error) {
      toast.error(error)
      return
    }
    applyCart(next)
  }

  const coverageLines = useMemo(
    () =>
      cart.map((item) => ({
        inventoryId: item.id,
        medicationId: item.medicationId,
        medicationName: item.name,
        quantity: item.quantity,
        shelfUnitPrice: priceAdjustments[item.id] ?? item.price,
      })),
    [cart, priceAdjustments],
  );

  const coveragePreviewQuery = useInsuranceCoveragePreview(
    customer.insuranceType,
    coverageLines,
  );

  const coverageTotals = coveragePreviewQuery.data?.success
    ? coveragePreviewQuery.data
    : null;

  const getSubtotal = () => {
    if (coverageTotals) return coverageTotals.subtotal;
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getInsuranceCoverage = () => {
    if (coverageTotals) return coverageTotals.insuranceCoverage;
    return 0;
  };

  const getPatientAmount = () => {
    if (coverageTotals) return coverageTotals.patientCopay;
    return getSubtotal();
  };

  const openInsuranceProcessing = useCallback(() => {
    if (!customer.insuranceType) return
    if (cart.length === 0) {
      toast.error('Add products to the cart before processing insurance.')
      return
    }
    setInsuranceInterfaceOpen(true)
  }, [cart.length, customer.insuranceType])

  useEffect(() => {
    if (insuranceInterfaceOpen && cart.length === 0) {
      setInsuranceInterfaceOpen(false)
    }
  }, [insuranceInterfaceOpen, cart.length])

  useEffect(() => {
    if (!customer.insuranceType || cart.length === 0) return
    const copay = Math.round(getPatientAmount())
    if (copay > 0) {
      setCashAmount(String(copay))
    }
  }, [
    customer.insuranceType,
    cart.length,
    coverageTotals?.patientCopay,
    coverageTotals?.subtotal,
  ])

  const selectCustomer = (selectedCustomer: {
    id: string
    name: string
    phone: string | null
    insurance_number?: string | null
  }) => {
    setCustomer({
      id: selectedCustomer.id,
      name: selectedCustomer.name,
      phone: selectedCustomer.phone ?? '',
      insuranceNumber: selectedCustomer.insurance_number || '',
      insuranceType: selectedCustomer.insurance_number ? 'RSSB' : '',
      coveragePercent: selectedCustomer.insurance_number ? 90 : 0
    })
    setCustomerSearchQuery(selectedCustomer.name)
    setCustomerSearchFocused(false)
  }

  useEffect(() => {
    const customerId = searchParams.get('customerId')
    if (!customerId || preloadedCustomerIdRef.current === customerId) return
    preloadedCustomerIdRef.current = customerId

    void getCustomer(customerId)
      .then(({ customer: c }) => {
        const insuranceNumber = c.insurance_number ?? c.insurance ?? ''
        setCustomer({
          id: c.id,
          name: c.name,
          phone: c.phone,
          insuranceNumber,
          insuranceType: insuranceNumber ? 'RSSB' : '',
          coveragePercent: insuranceNumber ? 90 : 0,
        })
        setCustomerSearchQuery(c.name)
        setCustomerSearchFocused(false)
      })
      .catch(() => {
        preloadedCustomerIdRef.current = null
      })
  }, [searchParams])

  const { addSale, updateStock } = usePharmacyStore()

  // ── Subscription / transaction gate ──────────────────────
  const [txBlocked, setTxBlocked] = useState<{
    reason: string
    message: string
    tx_count?: number
    tx_limit?: number
  } | null>(null)

  const activePharmacyName =
    context.memberships.find((m) => m.pharmacyId === context.activePharmacyId)
      ?.pharmacyName ?? 'Pharmacy'
  const cashierName =
    context.user.fullName?.trim() ||
    context.user.email?.trim() ||
    'Cashier'

  const completeSale = async (opts?: {
    prescriptionConfirmation?: PrescriptionConfirmation
    nearExpiryAcknowledged?: boolean
    paymentTransactionId?: string
  }) => {
    if (cart.length === 0) {
      toast.error('Cart is empty. Add items to process sale.')
      return
    }

    if (!paymentMethod) {
      toast.error('Please select a payment method.')
      return
    }

    if (!activeBranchId) {
      toast.error('Select a branch before processing a sale.')
      return
    }

    if (shiftCheckReady && !hasOpenShift) {
      toast.error('Open your cashier shift before completing a sale.')
      return
    }

    if (cartRequiresPrescription(cart) && !opts?.prescriptionConfirmation?.confirmed) {
      setRxForm({
        patientName: customer.name.trim(),
        prescriberName: '',
        notes: '',
      })
      setCheckoutAfterRx(true)
      setRxDialogOpen(true)
      return
    }

    if (cartHasNearExpiry(cart) && !opts?.nearExpiryAcknowledged && !nearExpiryAcknowledged) {
      deferredCheckoutRef.current = opts
      setCheckoutNearExpiryOpen(true)
      return
    }

    const gate = await checkPosTransactionAllowed(activeBranchId)
    if (!gate.allowed) {
      setTxBlocked({
        reason: gate.reason ?? 'limit_reached',
        message: gate.message ?? 'Transaction limit reached for this branch.',
        tx_count: gate.tx_count,
        tx_limit: gate.tx_limit,
      })
      return
    }

    const prescriptionConfirmation: PrescriptionConfirmation | undefined =
      opts?.prescriptionConfirmation ??
      (prescriptionConfirmed
        ? {
            confirmed: true,
            patientName: rxForm.patientName || customer.name,
            prescriberName: rxForm.prescriberName,
            notes: rxForm.notes,
          }
        : undefined)

    const saleData = {
      customer,
      items: cart,
      subtotal: getSubtotal(),
      insuranceCoverage: getInsuranceCoverage(),
      patientAmount: getPatientAmount(),
      paymentMethod,
      cashAmount: parseFloat(cashAmount) || 0,
      insuranceAmount: parseFloat(insuranceAmount) || 0,
      branchId: activeBranchId,
      prescriptionConfirmation,
      nearExpiryAcknowledged:
        opts?.nearExpiryAcknowledged ?? nearExpiryAcknowledged ?? cartHasNearExpiry(cart),
      paymentTransactionId: opts?.paymentTransactionId || undefined,
    }
    
    try {
      console.log('Processing sale...', saleData)

      const result = await saleMutation.mutateAsync(saleData)
      console.log('Sale API response:', result)

      const receiptNumber = result.receiptNumber || `RCP-${Date.now()}`
      const saleSubtotal = getSubtotal()
      const saleInsuranceCoverage = getInsuranceCoverage()
      const salePatientAmount = getPatientAmount()

      const pharmacySettings = pharmacySettingsQuery.data
      const invoiceTemplate = invoiceTemplateQuery.data

      const receiptInput: PosReceiptInput = {
        receiptNumber,
        pharmacyName: pharmacySettings?.name || activePharmacyName,
        address: pharmacySettings?.location,
        phone: pharmacySettings?.phone,
        email: pharmacySettings?.email,
        licenseNumber: pharmacySettings?.license,
        footerText:
          invoiceTemplate?.footerText?.trim() || 'Thank you for your business',
        cashierName,
        customer: { ...customer },
        patientName: prescriptionConfirmation?.patientName?.trim() || undefined,
        items: cart.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        subtotal: saleSubtotal,
        insuranceCoverage: saleInsuranceCoverage,
        patientAmount: salePatientAmount,
        paymentMethod,
      }

      setPendingReceipt(receiptInput)
      setReceiptPreviewOpen(true)

      toast.success('Sale completed', {
        description: `Receipt ${receiptNumber} · ${saleSubtotal.toLocaleString()} RWF · review receipt to print`,
        duration: 6000,
      })
      
      // Clear form
      setCart([])
      setCustomer(createEmptyPosCustomer())
      setCashAmount('')
      setInsuranceAmount('')
      setPaymentMethod('')
      setPriceAdjustments({})
      setPrescriptionConfirmed(false)
      setNearExpiryAcknowledged(false)
      setRxForm({ patientName: '', prescriberName: '', notes: '' })
      
    } catch (error) {
      console.error('Sale processing error:', error)
      toast.error(
        error instanceof Error ? error.message : 'Sale could not be completed',
        {
          description: 'The sale may not have been saved. Check Sales or try again.',
        },
      )
    }
  }

  const processSale = () => {
    void completeSale()
  }

  const confirmPrescriptionAndCheckout = () => {
    const prescriberName = rxForm.prescriberName.trim()
    if (!prescriberName) {
      toast.error('Enter the prescriber / doctor name before continuing.')
      return
    }
    setPrescriptionConfirmed(true)
    setRxDialogOpen(false)
    const confirmation: PrescriptionConfirmation = {
      confirmed: true,
      patientName: rxForm.patientName.trim() || customer.name.trim(),
      prescriberName,
      notes: rxForm.notes.trim() || undefined,
    }
    if (checkoutAfterRx) {
      setCheckoutAfterRx(false)
      void completeSale({
        prescriptionConfirmation: confirmation,
        nearExpiryAcknowledged,
      })
    }
  }

  if (loading) {
    return <DashboardPageLoading label="Loading POS…" />
  }

  if (!activeBranchId) {
    return (
      <DashboardPageShell>
        <DashboardPageHeader
          title="Point of Sale"
          description="Scan, sell, and settle — FEFO stock, Rx gate, shifts & returns"
        />
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-neutral-200 bg-neutral-50/80 px-6 py-12 text-center dark:border-neutral-800 dark:bg-neutral-900/40">
          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
            Select a location to open POS
          </p>
          <p className="max-w-md text-sm text-neutral-600 dark:text-neutral-400">
            Stock is per location: Headquarters (HQ) distributes to satellite
            branches via Inventory → Transfer. Use the branch switcher in the top
            bar, or open Branches to add an outlet.
          </p>
        </div>
      </DashboardPageShell>
    )
  }

  const lowStockCount = products.filter((p) => p.stock <= 20).length
  const expiringCount = products.filter((p) => p.daysToExpiry <= 90).length

  return (
    <DashboardPageShell className="[&>div]:max-w-none [&>div]:space-y-4 [&>div]:p-4 md:[&>div]:p-6">
      <DashboardPageHeader
        title="Point of Sale"
        description="Scan, sell, and settle — FEFO stock, Rx gate, shifts & returns"
        actions={
          <DashboardToolbar>
            <DashboardButton
              tone="ghost"
              size="icon"
              title="AI safety check"
              onClick={() => setAiSafetyOpen(true)}
            >
              <Brain className="h-4 w-4 text-violet-600" />
            </DashboardButton>
            <DashboardButton tone="outline" onClick={() => {
              setQuickAddProductCategory('')
              setQuickAddDialog('product')
            }}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add product
            </DashboardButton>
            <DashboardButton tone="outline" onClick={() => setAlertsOpen(true)}>
              Alerts
              {(lowStockCount > 0 || expiringCount > 0) && (
                <span className="ml-1.5 inline-flex gap-0.5">
                  {lowStockCount > 0 && (
                    <span className="size-1.5 rounded-full bg-red-500" />
                  )}
                  {expiringCount > 0 && (
                    <span className="size-1.5 rounded-full bg-amber-500" />
                  )}
                </span>
              )}
            </DashboardButton>
            {can('pos.returns') && (
              <DashboardButton tone="outline" onClick={() => setReturnsDialogOpen(true)}>
                <RotateCcw className="mr-1.5 h-4 w-4" />
                Returns
              </DashboardButton>
            )}
          </DashboardToolbar>
        }
      />

      <PosWorkspace
        searchInputRef={searchInputRef}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        onSearchEnter={tryBarcodeAdd}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={categories}
        filteredGroups={filteredGroups}
        fastMoving={fastMoving}
        productGroups={productGroups}
        priceAdjustments={priceAdjustments}
        onPriceAdjustment={(id, price) =>
          setPriceAdjustments({ ...priceAdjustments, [id]: price })
        }
        onAddGroup={handleAddGroup}
        onAddProduct={(p) => void handleAddProduct(p)}
        onQuickAddProduct={() => {
          setQuickAddProductCategory('')
          setQuickAddDialog('product')
        }}
        onScan={() => {
          searchInputRef.current?.focus()
          tryBarcodeAdd()
        }}
        cart={cart}
        customer={customer}
        onCustomerChange={setCustomer}
        onCustomerNameChange={(name) => {
          setCustomer((prev) => ({ ...prev, id: null, name }))
          setCustomerSearchQuery(name)
        }}
        customerSuggestions={customerSuggestions}
        showCustomerSuggestions={showCustomerSuggestions}
        customerSearchFetching={
          customerSearchResult.isFetching || customerSearchResult.isDebouncing
        }
        onSelectCustomer={selectCustomer}
        onCustomerFocus={() => setCustomerSearchFocused(true)}
        onCustomerBlur={() =>
          setTimeout(() => setCustomerSearchFocused(false), 200)
        }
        onQuickAddPatient={() => setQuickAddDialog('patient')}
        onQuickAddInsurance={() => setQuickAddDialog('insurance')}
        canInsurance={can('pos.insurance')}
        onInsuranceTypeChange={(insuranceType) => {
          const coverageMap = { RAMA: 100, MMI: 85, RSSB: 90, Radiant: 80 }
          const coverage =
            coverageMap[insuranceType as keyof typeof coverageMap] || 0
          const finalInsuranceType =
            insuranceType === 'cash' ? '' : insuranceType
          setCustomer({
            ...customer,
            insuranceType: finalInsuranceType,
            coveragePercent: coverage,
          })
          if (finalInsuranceType) {
            if (cart.length === 0) {
              toast.error(
                'Add products to the cart first. Insurance amounts are calculated from cart items.',
              )
            } else {
              setInsuranceInterfaceOpen(true)
            }
          } else {
            setInsuranceInterfaceOpen(false)
          }
        }}
        onOpenInsuranceProcessing={openInsuranceProcessing}
        updateQuantity={updateQuantity}
        subtotal={getSubtotal()}
        insuranceCoverage={getInsuranceCoverage()}
        patientAmount={getPatientAmount()}
        activeBranchId={activeBranchId}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={setPaymentMethod}
        cashAmount={cashAmount}
        onCashAmountChange={setCashAmount}
        insuranceAmount={insuranceAmount}
        onInsuranceAmountChange={setInsuranceAmount}
        onProcessSale={processSale}
        onClearCart={() => setCart([])}
        onHoldSale={async () => {
          const data = await holdSaleMutation.mutateAsync({ cart, customer })
          if (data.success) {
            toast.success('Sale held successfully')
          } else {
            toast.error('Failed to hold sale')
          }
        }}
        onLookupCustomer={() => openUtilityDialog('customer-lookup')}
        onPriceCheck={() => openUtilityDialog('price-check')}
        onVoidSale={() => openUtilityDialog('void-sale')}
        onBackupCart={() => {
          localStorage.setItem(
            'pos_backup',
            JSON.stringify({
              cart,
              customer,
              timestamp: new Date().toISOString(),
              priceAdjustments,
            }),
          )
          toast.success('Cart backup saved locally')
        }}
        saleDisabled={
          cart.length === 0 ||
          !paymentMethod ||
          (shiftCheckReady && !hasOpenShift)
        }
        hasOpenShift={hasOpenShift}
        shiftCheckReady={shiftCheckReady}
        showTeamShifts={isPharmacyOwner}
        canHold={can('pos.hold')}
        canVoid={can('pos.void')}
      />

      <FeatureGate featureKey="pos.insurance" hideWhenLocked>
        <PosInsuranceProcessingDialog
          open={insuranceInterfaceOpen}
          onOpenChange={setInsuranceInterfaceOpen}
          customer={customer}
          onCustomerChange={setCustomer}
          subtotal={getSubtotal()}
          insuranceCoverage={getInsuranceCoverage()}
          patientCopay={getPatientAmount()}
          cartItemCount={cart.length}
          coverageLines={coverageTotals?.lines}
          coverageLoading={coveragePreviewQuery.isFetching}
          onOpenRamaBeneficiary={() => setRamaBeneficiaryOpen(true)}
          lookupPending={insuranceLookupMutation.isPending}
          processPending={insuranceProcessMutation.isPending}
          onLookup={(insuranceNumber) =>
            insuranceLookupMutation.mutateAsync(insuranceNumber)
          }
          onProcess={(payload) =>
            insuranceProcessMutation.mutateAsync({
              ...payload,
              lines: coverageLines,
            })
          }
        />
      </FeatureGate>

      <Dialog open={utilityDialog !== null} onOpenChange={(open) => !open && closeUtilityDialog()}>
        <DashboardDialogContent className="sm:max-w-md">
          <DashboardDialogHeader>
            <DashboardDialogTitle>
              {utilityDialog === 'customer-lookup' && 'Lookup customer'}
              {utilityDialog === 'price-check' && 'Check product price'}
              {utilityDialog === 'void-sale' && 'Void sale'}
            </DashboardDialogTitle>
            <DashboardDialogDescription>
              {utilityDialog === 'customer-lookup' &&
                'Search by customer phone and apply the first match to the sale.'}
              {utilityDialog === 'price-check' &&
                'Search by product name or barcode before adding it to the cart.'}
              {utilityDialog === 'void-sale' &&
                'Enter the sale ID and reason before voiding a completed sale.'}
            </DashboardDialogDescription>
          </DashboardDialogHeader>
          <DashboardDialogBody className="space-y-3">
            <Input
              autoFocus
              value={utilityInput}
              onChange={(event) => setUtilityInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  void runUtilityDialog()
                }
              }}
              placeholder={
                utilityDialog === 'customer-lookup'
                  ? 'Customer phone'
                  : utilityDialog === 'price-check'
                    ? 'Product name or barcode'
                    : 'Sale ID'
              }
            />
            {utilityDialog === 'void-sale' && (
              <Input
                value={utilityReason}
                onChange={(event) => setUtilityReason(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    void runUtilityDialog()
                  }
                }}
                placeholder="Void reason"
              />
            )}
          </DashboardDialogBody>
          <DashboardDialogActions
            confirmLabel={
              utilityDialog === 'customer-lookup'
                ? 'Lookup'
                : utilityDialog === 'price-check'
                  ? 'Check price'
                  : 'Void sale'
            }
            onConfirm={() => void runUtilityDialog()}
            confirmDisabled={
              !utilityInput.trim() ||
              customerLookupMutation.isPending ||
              priceCheckMutation.isPending ||
              voidSaleMutation.isPending
            }
            confirmLoading={
              customerLookupMutation.isPending ||
              priceCheckMutation.isPending ||
              voidSaleMutation.isPending
            }
            onCancel={closeUtilityDialog}
          />
        </DashboardDialogContent>
      </Dialog>

      <Dialog open={ramaBeneficiaryOpen} onOpenChange={setRamaBeneficiaryOpen}>
        <DashboardDialogContent className="max-w-2xl">
          <DashboardDialogHeader>
            <DashboardDialogTitle>RAMA beneficiary</DashboardDialogTitle>
            <DashboardDialogDescription>
              Register and manage insurance beneficiaries under RAMA.
            </DashboardDialogDescription>
          </DashboardDialogHeader>
          <DashboardDialogBody className="max-h-96 space-y-4 overflow-y-auto">
            <div className="space-y-3">
              <h4 className="font-medium text-sm">1. Identification Details</h4>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="CODE (auto-generated)" disabled />
                <Input placeholder="AFFILIATION NUMBER" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="FIRST NAME AFFILIATE" />
                <Input placeholder="SECOND NAME AFFILIATE" />
              </div>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="LINK (Relationship)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="self">Self</SelectItem>
                  <SelectItem value="spouse">Spouse</SelectItem>
                  <SelectItem value="dependent">Dependent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm">2. Beneficiary Information</h4>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="FIRST NAME BENEFICIARY" />
                <Input placeholder="SECOND NAME BENEFICIARY" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="DATE OF BIRTH" type="date" />
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="GENDER" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input placeholder="PLACE OF AFFILIATION" />
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm">3. Insurance Details</h4>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="INSURANCE" value="RAMA" disabled />
                <Input placeholder="BENEFICIARY NUMBER" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="PERCENTAGE (e.g., 15%)" />
                <Input placeholder="EXPIRATION DATE" type="date" />
              </div>
              <Input placeholder="DEPARTMENT" />
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm">4. Contact & Verification</h4>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="V_TELNUMBER" />
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="STATUS" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activated">Activated</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="PIN" />
                <Input placeholder="GLOBAL INEZA ID" />
              </div>
            </div>
          </DashboardDialogBody>
          <DashboardDialogActions
            cancelLabel="Cancel"
            confirmLabel="Save"
            onCancel={() => setRamaBeneficiaryOpen(false)}
            onConfirm={() => setRamaBeneficiaryOpen(false)}
          />
        </DashboardDialogContent>
      </Dialog>

      {/* Alerts drawer */}
      {alertsOpen && (
        <div className={cn("fixed right-0 top-0 z-50 flex h-full w-80 flex-col border-l shadow-xl", dashboardSurfaces.card)}>
          <div className="p-3 border-b flex justify-between items-center">
            <h2 className="font-medium text-sm">Alerts</h2>
            <div className="flex gap-1">
              <DashboardButton size="sm" className="h-7 text-xs" onClick={() => {
                toast.info('Export is temporarily disabled for security reasons')
              }}>
                Excel
              </DashboardButton>
              <DashboardButton size="icon" className="h-7 w-7" onClick={() => setAlertsOpen(false)}>×</DashboardButton>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* Low Stock */}
            {products.filter(p => p.stock <= 20).length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-xs font-medium text-red-600">Low Stock ({products.filter(p => p.stock <= 20).length})</span>
                </div>
                <div className="space-y-1">
                  {products.filter(p => p.stock <= 20).map(product => (
                    <div key={product.id} className="p-2 bg-red-50 rounded text-xs border-l-2 border-red-500">
                      <div className="font-medium">{product.name}</div>
                      <div className="text-gray-500">Stock: {product.stock}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Expiring */}
            {products.filter(p => p.daysToExpiry <= 90).length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-xs font-medium text-yellow-600">Expiring ({products.filter(p => p.daysToExpiry <= 90).length})</span>
                </div>
                <div className="space-y-1">
                  {products.filter(p => p.daysToExpiry <= 90).map(product => (
                    <div key={product.id} className={`p-2 rounded text-xs border-l-2 ${
                      product.daysToExpiry <= 30 ? 'bg-red-50 border-red-500' :
                      product.daysToExpiry <= 60 ? 'bg-yellow-50 border-yellow-500' :
                      'bg-blue-50 border-blue-500'
                    }`}>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-gray-500">{product.daysToExpiry}d left</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {products.filter(p => p.stock <= 20 || p.daysToExpiry <= 90).length === 0 && (
              <div className="text-green-600 text-xs text-center py-4">✅ No alerts</div>
            )}
          </div>
        </div>
      )}

      <Dialog open={quickAddDialog !== null} onOpenChange={() => setQuickAddDialog(null)}>
        <DashboardDialogContent
          className={cn(
            (quickAddDialog === 'product' || quickAddDialog === 'rama-beneficiary') &&
              'sm:max-w-2xl',
          )}
        >
          <DashboardDialogHeader>
            <DashboardDialogTitle>
              {quickAddDialog === 'product' && 'Add product'}
              {quickAddDialog === 'patient' && 'Quick add patient'}
              {quickAddDialog === 'insurance' && 'Quick add insurance'}
              {quickAddDialog === 'rama-beneficiary' && 'RAMA beneficiary'}
            </DashboardDialogTitle>
            {quickAddDialog === 'product' && (
              <DashboardDialogDescription>
                Add a new item to branch inventory. Required fields: name, category, and stock levels.
              </DashboardDialogDescription>
            )}
          </DashboardDialogHeader>
          <DashboardDialogBody>
          <form id="pos-quick-add-form" className="space-y-4">
            {quickAddDialog === 'product' && (
              <PosAddProductForm
                category={quickAddProductCategory}
                onCategoryChange={setQuickAddProductCategory}
                categories={categories}
                onCreateCategory={async (name) => {
                  const result = await createCategoryMutation.mutateAsync(name)
                  return {
                    success: result.success,
                    categoryId: result.categoryId,
                    error: result.error,
                  }
                }}
              />
            )}
            {quickAddDialog === 'patient' && (
              <>
                <Input name="patientName" placeholder="Patient name" required />
                <Input name="phoneNumber" placeholder="Phone number" required />
                <Input name="insuranceNumber" placeholder="Insurance number (optional)" />
              </>
            )}
            {quickAddDialog === 'insurance' && (
              <>
                <Input name="insuranceName" placeholder="Insurance name" />
                <Input name="coveragePercentage" placeholder="Coverage percentage" type="number" />
              </>
            )}
            {quickAddDialog === 'rama-beneficiary' && (
              <div className="max-h-96 overflow-y-auto space-y-4">
                <div className="text-sm text-muted-foreground mb-4">
                  Register and manage insurance beneficiaries under the RAMA system
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">1. Identification Details</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="CODE (auto-generated)" disabled />
                    <Input placeholder="AFFILIATION NUMBER" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="FIRST NAME AFFILIATE" />
                    <Input placeholder="SECOND NAME AFFILIATE" />
                  </div>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="LINK (Relationship)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="self">Self</SelectItem>
                      <SelectItem value="spouse">Spouse</SelectItem>
                      <SelectItem value="dependent">Dependent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-sm">2. Beneficiary Information</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="FIRST NAME BENEFICIARY" />
                    <Input placeholder="SECOND NAME BENEFICIARY" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="DATE OF BIRTH" type="date" />
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="GENDER" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Input placeholder="PLACE OF AFFILIATION" />
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-sm">3. Insurance Details</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="INSURANCE" value="RAMA" disabled />
                    <Input placeholder="BENEFICIARY NUMBER" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="PERCENTAGE (e.g., 15%)" />
                    <Input placeholder="EXPIRATION DATE" type="date" />
                  </div>
                  <Input placeholder="DEPARTMENT" />
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-sm">4. Contact & Verification</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="V_TELNUMBER" />
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="STATUS" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="activated">Activated</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="PIN" />
                    <Input placeholder="GLOBAL INEZA ID" />
                  </div>
                </div>
              </div>
            )}
          </form>
          </DashboardDialogBody>
          <DashboardDialogFooter>
            <DashboardButton type="button" onClick={() => setQuickAddDialog(null)}>
              Cancel
            </DashboardButton>
            <DashboardButton
              type="button"
              tone="primary"
              onClick={async () => {
              if (quickAddDialog === 'patient') {
                const form = document.querySelector('form')
                const patientName = (form?.querySelector('input[name="patientName"]') as HTMLInputElement | null)?.value?.trim()
                const phoneNumber = (form?.querySelector('input[name="phoneNumber"]') as HTMLInputElement | null)?.value?.trim()
                const insuranceNumber = (form?.querySelector('input[name="insuranceNumber"]') as HTMLInputElement | null)?.value?.trim()
                
                if (!patientName || !phoneNumber) {
                  toast.error('Patient name and phone number are required')
                  return
                }

                try {
                  const result = await quickAddPatientMutation.mutateAsync({
                    patientName,
                    phoneNumber,
                    insuranceNumber,
                  })

                  if (result.success && result.customer) {
                    toast.success('Patient added')
                    setQuickAddDialog(null)
                    form?.reset()

                    setCustomer({
                      id: result.customer.id ?? null,
                      name: result.customer.name,
                      phone: result.customer.phone,
                      insuranceNumber: result.customer.insurance_number || '',
                      insuranceType: result.customer.insurance_number ? 'RSSB' : '',
                      coveragePercent: result.customer.insurance_number ? 90 : 0,
                    })
                    setCustomerSearchQuery(result.customer.phone)
                  } else {
                    toast.error(result.error || 'Failed to add patient')
                  }
                } catch (err) {
                  toast.error(
                    err instanceof Error ? err.message : 'Failed to add patient',
                  )
                }
                return
              }
              
              // Handle other dialogs
              const form = document.querySelector('form') as HTMLFormElement | null
              if (!form) return
              const formData = new FormData(form)
              const data = Object.fromEntries(formData)
              
              let endpoint = ''
              if (quickAddDialog === 'product') endpoint = '/api/pos/quick-add-drug'
              if (quickAddDialog === 'insurance') endpoint = '/api/pos/quick-add-insurance'

              if (endpoint === '/api/pos/quick-add-drug') {
                const productName = String(data.productName ?? '').trim()
                if (!productName) {
                  toast.error('Product name is required')
                  return
                }
                if (!quickAddProductCategory.trim()) {
                  toast.error('Please select or add a category')
                  return
                }
                data.category = quickAddProductCategory
              }

              if (endpoint) {
                try {
                  const result = await quickAddEntityMutation.mutateAsync({
                    endpoint: endpoint as '/api/pos/quick-add-drug' | '/api/pos/quick-add-insurance',
                    body: data,
                  })
                  if (result.success) {
                    toast.success(
                      quickAddDialog === 'product'
                        ? 'Product added — tap the row to sell'
                        : 'Added successfully',
                    )
                    setQuickAddDialog(null)
                    setQuickAddProductCategory('')
                    form?.reset()
                    if (quickAddDialog === 'product') {
                      setSearchTerm('')
                      setSelectedCategory('all')
                    }
                    if (quickAddDialog === 'insurance') {
                      window.location.reload()
                    }
                  } else {
                    toast.error(result.error || 'Request failed')
                  }
                } catch (err) {
                  toast.error(
                    err instanceof Error ? err.message : 'Failed to save. Try again.',
                  )
                }
              }
            }}
            >
              {quickAddDialog === 'product' ? 'Add product' : 'Add'}
            </DashboardButton>
          </DashboardDialogFooter>
        </DashboardDialogContent>
      </Dialog>

      <FeatureGate featureKey="pos.returns">
        <PosReturnsDialog
          open={returnsDialogOpen}
          onOpenChange={setReturnsDialogOpen}
          branchId={activeBranchId}
        />
      </FeatureGate>

      <PosReceiptPreviewDialog
        open={receiptPreviewOpen}
        onOpenChange={setReceiptPreviewOpen}
        receipt={pendingReceipt}
      />

      {/* Transaction Blocked Overlay */}
      <Dialog open={Boolean(txBlocked)} onOpenChange={(open) => !open && setTxBlocked(null)}>
        <DashboardDialogContent className="sm:max-w-md">
          <DashboardDialogHeader>
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/50">
              <AlertTriangle className="h-7 w-7 text-red-600 dark:text-red-400" />
            </div>
            <DashboardDialogTitle className="text-center">
              {txBlocked?.reason === 'no_subscription'
                ? 'No Active Subscription'
                : txBlocked?.reason === 'check_failed'
                  ? 'Usage Check Failed'
                  : txBlocked?.reason === 'no_branch'
                    ? 'Branch Required'
                    : 'Transaction Limit Reached'}
            </DashboardDialogTitle>
            <DashboardDialogDescription className="text-center">
              {txBlocked?.message}
            </DashboardDialogDescription>
          </DashboardDialogHeader>
          <DashboardDialogBody className="space-y-3">
            {txBlocked?.tx_count != null && txBlocked?.tx_limit != null ? (
              <div className="rounded-lg border border-red-200/80 bg-red-50/80 px-3 py-2.5 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
                <p className="font-medium tabular-nums">
                  {txBlocked.tx_count.toLocaleString()} /{' '}
                  {txBlocked.tx_limit.toLocaleString()} transactions used this month
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-red-200/80 bg-red-50/80 px-3 py-2.5 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
                {txBlocked?.reason === 'no_subscription'
                  ? 'This branch has no active subscription. Contact your pharmacy owner to subscribe.'
                  : txBlocked?.reason === 'check_failed'
                    ? 'The usage check could not complete. Refresh the page and try again. Your plan limit may still be available.'
                    : 'This branch has reached its monthly transaction limit. Sales are blocked until the billing cycle resets or the plan is upgraded.'}
              </div>
            )}
          </DashboardDialogBody>
          <DashboardDialogActions
            cancelLabel="Dismiss"
            confirmLabel={
              txBlocked?.reason === 'check_failed' ? 'Retry' : 'View billing'
            }
            onCancel={() => setTxBlocked(null)}
            onConfirm={() => {
              if (txBlocked?.reason === 'check_failed') {
                setTxBlocked(null)
                return
              }
              window.location.href = PHARMACY_ROUTES.billing
            }}
            confirmTone={txBlocked?.reason === 'check_failed' ? 'primary' : 'destructive'}
          />
        </DashboardDialogContent>
      </Dialog>

      {/* Drug Safety Check Dialog */}
      {aiSafetyOpen && (
        <div 
          className="fixed bottom-8 right-8 w-96 bg-blue-50 shadow-lg border z-50 rounded-2xl"
          style={{
            transform: 'translate(0, 0)'
          }}
          onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => {
            const dialog = e.currentTarget
            const startX = e.clientX - dialog.offsetLeft
            const startY = e.clientY - dialog.offsetTop
            
            const handleMouseMove = (e: MouseEvent) => {
              dialog.style.left = (e.clientX - startX) + 'px'
              dialog.style.top = (e.clientY - startY) + 'px'
              dialog.style.right = 'auto'
              dialog.style.bottom = 'auto'
            }
            
            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove)
              document.removeEventListener('mouseup', handleMouseUp)
            }
            
            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
          }}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-3 cursor-move">
              <h3 className="font-medium flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-600" />
                Drug safety check
              </h3>
              <DashboardButton tone="ghost" size="sm" onClick={() => setAiSafetyOpen(false)}>×</DashboardButton>
            </div>
            
            <div className="space-y-3 max-h-80 overflow-y-auto">
              <div className="p-3 bg-purple-50 rounded">
                <h4 className="text-sm font-medium mb-1">Cart Items</h4>
                {cart.length > 0 ? (
                  <div className="text-xs space-y-1">
                    {cart.map(item => (
                      <div key={item.id}>{item.name} x{item.quantity}</div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-600">No items to analyze</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <DashboardButton
                  tone="primary"
                  size="sm"
                  className="rounded-xl bg-violet-600 hover:bg-violet-700"
                  onClick={async () => {
                    setAiSafetyLoading(true)
                    try {
                      const data = await aiSafetyMutation.mutateAsync(cart)
                      if (data.success && data.result) {
                        setAiSafetyResult(data.result)
                      } else {
                        toast.error('Analysis failed')
                      }
                    } catch {
                      toast.error('Analysis failed')
                    }
                    setAiSafetyLoading(false)
                  }}
                  disabled={aiSafetyLoading || cart.length === 0}
                >
                  {aiSafetyLoading ? 'Checking...' : 'Run check'}
                </DashboardButton>
                <DashboardButton size="sm" className="rounded-xl" onClick={() => {
                  if (aiSafetyResult) {
                    toast.message('Drug safety check', {
                      description: [
                        `Interactions: ${aiSafetyResult.interactions.length}`,
                        `Warnings: ${aiSafetyResult.warnings.length}`,
                        `Severity: ${aiSafetyResult.severity.toUpperCase()}`,
                        aiSafetyResult.recommendations.length
                          ? aiSafetyResult.recommendations.join(' · ')
                          : 'No recommendations',
                      ].join(' · '),
                      duration: 10000,
                    })
                  } else {
                    toast.info('Run analysis first')
                  }
                }}>
                  Get Advice
                </DashboardButton>
              </div>
              
              <div className={`p-3 rounded text-xs ${
                aiSafetyResult?.severity === 'danger' ? 'bg-red-50' :
                aiSafetyResult?.severity === 'caution' ? 'bg-yellow-50' :
                'bg-blue-50'
              }`}>
                <h4 className="font-medium mb-1">Safety recommendations</h4>
                {aiSafetyResult ? (
                  <div className="space-y-2">
                    {aiSafetyResult.source ? (
                      <div className="text-[11px] text-gray-600">
                        Source: {aiSafetyResult.source.name}
                      </div>
                    ) : null}
                    {aiSafetyResult.interactions.length > 0 && (
                      <div>
                        <div className="font-medium text-red-600">Interactions:</div>
                        {aiSafetyResult.interactions.map((int: string, i: number) => (
                          <div key={i}>{int}</div>
                        ))}
                      </div>
                    )}
                    {aiSafetyResult.warnings.length > 0 && (
                      <div>
                        <div className="font-medium">Warnings:</div>
                        {aiSafetyResult.warnings.map((warn: string, i: number) => (
                          <div key={i}>{warn}</div>
                        ))}
                      </div>
                    )}
                    <div>
                      <div className="font-medium">Recommendations:</div>
                      {aiSafetyResult.recommendations.map((rec: string, i: number) => (
                        <div key={i}>{rec}</div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-600">Run check to analyze safety</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <Dialog open={checkoutNearExpiryOpen} onOpenChange={setCheckoutNearExpiryOpen}>
        <DashboardDialogContent className="sm:max-w-md">
          <DashboardDialogHeader>
            <DashboardDialogTitle>Near-expiry items in cart</DashboardDialogTitle>
            <DashboardDialogDescription>
              One or more items expire within 30 days. Continue with this sale?
            </DashboardDialogDescription>
          </DashboardDialogHeader>
          <DashboardDialogActions
            cancelLabel="Cancel"
            confirmLabel="Continue sale"
            onCancel={() => {
              setCheckoutNearExpiryOpen(false)
              deferredCheckoutRef.current = undefined
            }}
            onConfirm={() => {
              setCheckoutNearExpiryOpen(false)
              setNearExpiryAcknowledged(true)
              const deferred = deferredCheckoutRef.current
              deferredCheckoutRef.current = undefined
              void completeSale({
                ...deferred,
                nearExpiryAcknowledged: true,
              })
            }}
          />
        </DashboardDialogContent>
      </Dialog>

      <Dialog open={Boolean(pendingNearExpiry)} onOpenChange={(open) => !open && setPendingNearExpiry(null)}>
        <DashboardDialogContent className="sm:max-w-md">
          <DashboardDialogHeader>
            <DashboardDialogTitle>Near-expiry stock</DashboardDialogTitle>
            <DashboardDialogDescription>
              {pendingNearExpiry
                ? `${pendingNearExpiry.name} (batch ${pendingNearExpiry.batch}) expires in ${pendingNearExpiry.daysToExpiry} days. Continue adding to cart?`
                : ''}
            </DashboardDialogDescription>
          </DashboardDialogHeader>
          <DashboardDialogActions
            cancelLabel="Cancel"
            confirmLabel="Continue"
            onCancel={() => setPendingNearExpiry(null)}
            onConfirm={() => {
              const batch = pendingNearExpiry
              setPendingNearExpiry(null)
              setNearExpiryAcknowledged(true)
              if (batch) {
                void handleAddProduct(batch, { acknowledgeNearExpiry: true })
              }
            }}
          />
        </DashboardDialogContent>
      </Dialog>

      <Dialog open={rxDialogOpen} onOpenChange={setRxDialogOpen}>
        <DashboardDialogContent className="sm:max-w-md">
          <DashboardDialogHeader>
            <DashboardDialogTitle>Prescription confirmation</DashboardDialogTitle>
            <DashboardDialogDescription>
              This sale includes prescription-only medicines. Confirm who receives
              the medication (patient) and the prescriber — the payer at the till
              may be someone else.
            </DashboardDialogDescription>
          </DashboardDialogHeader>
          <DashboardDialogBody className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="rx-patient-name">Patient (receives medication)</Label>
              <Input
                id="rx-patient-name"
                placeholder="Person the prescription is for"
                value={rxForm.patientName}
                onChange={(e) => setRxForm({ ...rxForm, patientName: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rx-prescriber-name">Prescriber / doctor name</Label>
              <Input
                id="rx-prescriber-name"
                placeholder="e.g. Dr. Marie Uwase"
                value={rxForm.prescriberName}
                onChange={(e) => setRxForm({ ...rxForm, prescriberName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rx-notes">Notes (optional)</Label>
              <Input
                id="rx-notes"
                placeholder="Prescription number, clinic, etc."
                value={rxForm.notes}
                onChange={(e) => setRxForm({ ...rxForm, notes: e.target.value })}
              />
            </div>
          </DashboardDialogBody>
          <DashboardDialogActions
            cancelLabel="Cancel"
            confirmLabel="Confirm & continue"
            confirmDisabled={!rxForm.prescriberName.trim()}
            onCancel={() => {
              setRxDialogOpen(false)
              setCheckoutAfterRx(false)
            }}
            onConfirm={confirmPrescriptionAndCheckout}
          />
        </DashboardDialogContent>
      </Dialog>

    </DashboardPageShell>
  )
}
