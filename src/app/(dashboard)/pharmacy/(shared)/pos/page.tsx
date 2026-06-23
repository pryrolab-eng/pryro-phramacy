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
import { useActivePharmacy } from '@/components/providers/active-pharmacy-provider'
import { PosReturnsDialog } from '@/components/pos/pos-returns-dialog'
import { PosWorkspace } from '@/components/pos/pos-workspace'
import { PosAddProductForm } from '@/components/pos/pos-add-product-form'
import { PosInsuranceProcessingDialog } from '@/components/pos/pos-insurance-processing-dialog'
import { PHARMACY_ROUTES } from '@/lib/routes/pharmacy-paths'
import type { AiSafetyResult } from '@/lib/http/pos'

type Product = PosProduct
type CartItem = PosCartItem
type Customer = PosCustomer
type PosUtilityDialog = 'customer-lookup' | 'price-check' | 'void-sale' | null

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
  const hasOpenShift = Boolean(shiftQuery.data)
  const shiftCheckReady =
    !shiftQuery.isLoading && !isContextHydrating && Boolean(activeBranchId)
  const isPharmacyOwner = context.role === 'pharmacy_owner'
  const productsQuery = usePosProducts({ branchId: activeBranchId })
  const fastMovingQuery = usePosFastMoving({ branchId: activeBranchId })
  const categoriesQuery = usePosCategories()
  const products = productsQuery.data ?? []
  const fastMoving = fastMovingQuery.data ?? []
  const categories = (categoriesQuery.data ?? []) as Array<{ id: string; name: string }>

  const [cart, setCart] = useState<CartItem[]>([])
  const [customer, setCustomer] = useState<Customer>({ name: '', phone: '', insuranceNumber: '', insuranceType: '', coveragePercent: 0 })
  const [customerSearchQuery, setCustomerSearchQuery] = useState('')
  const customerSearchResult = useCustomerSearch(customerSearchQuery)
  const customerSuggestions = customerSearchResult.data ?? []
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false)
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
  const searchInputRef = useRef<HTMLInputElement>(null)
  const loading =
    isContextHydrating ||
    productsQuery.isLoading ||
    fastMovingQuery.isLoading ||
    categoriesQuery.isLoading

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
        alert(result.error)
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
      alert(error)
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

  const searchCustomers = (query: string) => {
    setCustomerSearchQuery(query)
    if (query.length < 2) {
      setShowCustomerSuggestions(false)
      return
    }
    setShowCustomerSuggestions(true)
  }

  useEffect(() => {
    if (customerSearchQuery.length < 2) {
      setShowCustomerSuggestions(false)
      return
    }
    if (!customerSearchResult.isFetching) {
      setShowCustomerSuggestions((customerSuggestions.length ?? 0) > 0)
    }
  }, [customerSearchQuery, customerSearchResult.isFetching, customerSuggestions.length])

  const selectCustomer = (selectedCustomer: any) => {
    setCustomer({
      name: selectedCustomer.name,
      phone: selectedCustomer.phone,
      insuranceNumber: selectedCustomer.insurance_number || '',
      insuranceType: selectedCustomer.insurance_number ? 'RSSB' : '',
      coveragePercent: selectedCustomer.insurance_number ? 90 : 0
    })
    setShowCustomerSuggestions(false)
  }

  useEffect(() => {
    const customerId = searchParams.get('customerId')
    if (!customerId || preloadedCustomerIdRef.current === customerId) return
    preloadedCustomerIdRef.current = customerId

    void getCustomer(customerId)
      .then(({ customer: c }) => {
        const insuranceNumber = c.insurance_number ?? c.insurance ?? ''
        setCustomer({
          name: c.name,
          phone: c.phone,
          insuranceNumber,
          insuranceType: insuranceNumber ? 'RSSB' : '',
          coveragePercent: insuranceNumber ? 90 : 0,
        })
        setCustomerSearchQuery(c.phone)
        setShowCustomerSuggestions(false)
      })
      .catch(() => {
        preloadedCustomerIdRef.current = null
      })
  }, [searchParams])

  const { addSale, updateStock } = usePharmacyStore()

  // ── Subscription / transaction gate ──────────────────────
  const [txBlocked, setTxBlocked] = useState<{ reason: string; message: string } | null>(null)

  const completeSale = async (opts?: {
    prescriptionConfirmation?: PrescriptionConfirmation
    nearExpiryAcknowledged?: boolean
    paymentTransactionId?: string
  }) => {
    if (cart.length === 0) {
      alert('Cart is empty. Add items to process sale.')
      return
    }

    if (!paymentMethod) {
      alert('Please select a payment method.')
      return
    }

    if (!activeBranchId) {
      alert('Select a branch before processing a sale.')
      return
    }

    if (shiftCheckReady && !hasOpenShift) {
      toast.error('Open your cashier shift before completing a sale.')
      return
    }

    if (cartRequiresPrescription(cart) && !opts?.prescriptionConfirmation?.confirmed) {
      setCheckoutAfterRx(true)
      setRxDialogOpen(true)
      return
    }

    if (cartHasNearExpiry(cart) && !opts?.nearExpiryAcknowledged) {
      const ok = window.confirm(
        'One or more items are near expiry (within 30 days). Continue with this sale?',
      )
      if (!ok) return
    }

    const gate = await checkPosTransactionAllowed(activeBranchId)
    if (!gate.allowed) {
      setTxBlocked({
        reason: gate.reason ?? 'limit_reached',
        message: gate.message ?? 'Transaction limit reached for this branch.',
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
      
      // Print invoice
      printInvoice({
        receiptNumber,
        customer,
        items: cart,
        subtotal: getSubtotal(),
        insuranceCoverage: getInsuranceCoverage(),
        patientAmount: getPatientAmount(),
        paymentMethod
      })
      
      // Show success message
      const message = `Sale Processed Successfully!\n\nReceipt: ${receiptNumber}\nCustomer: ${customer.name || 'Walk-in Customer'}\nItems: ${cart.length}\nTotal: ${getSubtotal().toLocaleString()} RWF\nPayment: ${paymentMethod.toUpperCase()}${customer.insuranceType ? `\nInsurance: ${customer.insuranceType}` : ''}\n\nInvoice has been printed!`
      
      alert(message)
      
      // Clear form
      setCart([])
      setCustomer({ name: '', phone: '', insuranceNumber: '', insuranceType: '', coveragePercent: 0 })
      setCashAmount('')
      setInsuranceAmount('')
      setPaymentMethod('')
      setPriceAdjustments({})
      setPrescriptionConfirmed(false)
      setNearExpiryAcknowledged(false)
      setRxForm({ patientName: '', prescriberName: '', notes: '' })
      
    } catch (error) {
      console.error('Sale processing error:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}\n\nSale may not have been saved to database.`)
    }
  }

  const processSale = () => {
    void completeSale()
  }

  const confirmPrescriptionAndCheckout = () => {
    setPrescriptionConfirmed(true)
    setRxDialogOpen(false)
    const confirmation: PrescriptionConfirmation = {
      confirmed: true,
      patientName: rxForm.patientName || customer.name,
      prescriberName: rxForm.prescriberName,
      notes: rxForm.notes,
    }
    if (checkoutAfterRx) {
      setCheckoutAfterRx(false)
      void completeSale({
        prescriptionConfirmation: confirmation,
        nearExpiryAcknowledged,
      })
    }
  }

  const printInvoice = (invoiceData: any) => {
    const { receiptNumber, customer, items, subtotal, insuranceCoverage, patientAmount, paymentMethod } = invoiceData
    
    const invoiceContent = `
      <div style="font-family: monospace; max-width: 300px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px;">
          <h2 style="margin: 0;">PRYROX PHARMACY</h2>
          <p style="margin: 5px 0;">Advanced Pharmacy POS System</p>
          <p style="margin: 5px 0;">Tel: +250 788 123 456</p>
        </div>
        
        <div style="margin-bottom: 15px;">
          <p><strong>Receipt #:</strong> ${receiptNumber}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleTimeString()}</p>
          <p><strong>Cashier:</strong> muzungu</p>
        </div>
        
        <div style="margin-bottom: 15px;">
          <p><strong>Customer:</strong> ${customer.name || 'Walk-in Customer'}</p>
          ${customer.phone ? `<p><strong>Phone:</strong> ${customer.phone}</p>` : ''}
          ${customer.insuranceType ? `<p><strong>Insurance:</strong> ${customer.insuranceType}</p>` : ''}
          ${customer.insuranceNumber ? `<p><strong>Insurance #:</strong> ${customer.insuranceNumber}</p>` : ''}
        </div>
        
        <div style="border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 10px 0; margin-bottom: 15px;">
          <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 5px;">
            <span>ITEM</span>
            <span>QTY</span>
            <span>PRICE</span>
            <span>TOTAL</span>
          </div>
          ${items.map((item: { name: string; quantity: number; price: number }) => `
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 12px;">
              <span style="flex: 2;">${item.name}</span>
              <span style="width: 30px; text-align: center;">${item.quantity}</span>
              <span style="width: 50px; text-align: right;">${item.price}</span>
              <span style="width: 60px; text-align: right;">${(item.price * item.quantity).toLocaleString()}</span>
            </div>
          `).join('')}
        </div>
        
        <div style="margin-bottom: 15px;">
          <div style="display: flex; justify-content: space-between;">
            <span>Subtotal:</span>
            <span><strong>${subtotal.toLocaleString()} RWF</strong></span>
          </div>
          ${insuranceCoverage > 0 ? `
            <div style="display: flex; justify-content: space-between; color: green;">
              <span>Insurance Covers:</span>
              <span><strong>${insuranceCoverage.toLocaleString()} RWF</strong></span>
            </div>
            <div style="display: flex; justify-content: space-between; color: blue;">
              <span>Patient Pays:</span>
              <span><strong>${patientAmount.toLocaleString()} RWF</strong></span>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; border-top: 2px solid #000; padding-top: 5px; font-size: 18px;">
            <span><strong>TOTAL:</strong></span>
            <span><strong>${patientAmount.toLocaleString()} RWF</strong></span>
          </div>
        </div>
        
        <div style="margin-bottom: 15px;">
          <p><strong>Payment Method:</strong> ${paymentMethod.toUpperCase()}</p>
          <p><strong>Status:</strong> PAID</p>
        </div>
        
        <div style="text-align: center; border-top: 1px solid #000; padding-top: 10px; font-size: 12px;">
          <p>Thank you for your business!</p>
          <p>Keep this receipt for your records</p>
          <p style="margin-top: 10px;">Powered by Pryrox POS</p>
        </div>
      </div>
    `
    
    // Create print window
    const printWindow = window.open('', '_blank', 'width=400,height=600')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice - ${receiptNumber}</title>
            <style>
              body { margin: 0; padding: 0; }
              @media print {
                body { margin: 0; }
              }
            </style>
          </head>
          <body>
            ${invoiceContent}
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
      printWindow.close()
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
          setCustomer({ ...customer, name })
          searchCustomers(name)
        }}
        customerSuggestions={customerSuggestions}
        showCustomerSuggestions={showCustomerSuggestions}
        onSelectCustomer={selectCustomer}
        onCustomerFocus={() =>
          customer.name.length >= 2 && setShowCustomerSuggestions(true)
        }
        onCustomerBlur={() =>
          setTimeout(() => setShowCustomerSuggestions(false), 200)
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
            setInsuranceInterfaceOpen(true)
          }
        }}
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
          alert(data.success ? 'Sale held successfully!' : 'Failed to hold sale')
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
          alert('Cart backup saved locally.')
        }}
        saleDisabled={
          cart.length === 0 ||
          !paymentMethod ||
          (shiftCheckReady && !hasOpenShift)
        }
        hasOpenShift={hasOpenShift}
        shiftCheckReady={shiftCheckReady}
        showTeamShifts={isPharmacyOwner}
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
                alert('Export feature temporarily disabled for security reasons')
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
                onCreateCategory={(name) => createCategoryMutation.mutateAsync(name)}
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

      {/* Transaction Blocked Overlay */}
      {txBlocked && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 space-y-4">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-red-700">
                  {txBlocked.reason === 'no_subscription' ? 'No Active Subscription' : 'Transaction Limit Reached'}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">{txBlocked.message}</p>
              </div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-sm text-red-700">
              {txBlocked.reason === 'no_subscription'
                ? 'This branch has no active subscription. Please contact your pharmacy owner to subscribe.'
                : 'This branch has reached its monthly transaction limit. Sales are blocked until the billing cycle resets or the plan is upgraded.'}
            </div>
            <div className="flex gap-2">
              <DashboardButton className="flex-1" onClick={() => setTxBlocked(null)}>
                Dismiss
              </DashboardButton>
              <DashboardButton
                tone="destructive"
                className="flex-1"
                onClick={() => { window.location.href = PHARMACY_ROUTES.billing }}
              >
                View plans
              </DashboardButton>
            </div>
          </div>
        </div>
      )}

      {/* Rule-based Safety Check Dialog */}
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
                Rule-based safety check
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
                        alert('Analysis failed')
                      }
                    } catch {
                      alert('Analysis failed')
                    }
                    setAiSafetyLoading(false)
                  }}
                  disabled={aiSafetyLoading || cart.length === 0}
                >
                  {aiSafetyLoading ? 'Checking...' : 'Run rules'}
                </DashboardButton>
                <DashboardButton size="sm" className="rounded-xl" onClick={() => {
                  if (aiSafetyResult) {
                    const advice = `Rule-based Safety Check:\n\nInteractions: ${aiSafetyResult.interactions.length}\nWarnings: ${aiSafetyResult.warnings.length}\nSeverity: ${aiSafetyResult.severity.toUpperCase()}\n\nRecommendations:\n${aiSafetyResult.recommendations.join('\n')}`
                    alert(advice)
                  } else {
                    alert('Run analysis first')
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
                <h4 className="font-medium mb-1">Rule-based recommendations</h4>
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
                  <div className="text-gray-600">Run rules to check safety</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
              This sale includes prescription-only medicines. Confirm details before completing.
            </DashboardDialogDescription>
          </DashboardDialogHeader>
          <DashboardDialogBody className="space-y-3">
            <Input
              placeholder="Patient name"
              value={rxForm.patientName}
              onChange={(e) => setRxForm({ ...rxForm, patientName: e.target.value })}
            />
            <Input
              placeholder="Prescriber / doctor name"
              value={rxForm.prescriberName}
              onChange={(e) => setRxForm({ ...rxForm, prescriberName: e.target.value })}
            />
            <Input
              placeholder="Notes (optional)"
              value={rxForm.notes}
              onChange={(e) => setRxForm({ ...rxForm, notes: e.target.value })}
            />
          </DashboardDialogBody>
          <DashboardDialogActions
            cancelLabel="Cancel"
            confirmLabel="Confirm & continue"
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
