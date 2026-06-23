'use client'

import { useState, useEffect, useMemo } from 'react'
import { usePharmacyStore } from '@/hooks/usePharmacyStore'
import { isHeadquartersBranch } from '@/lib/pharmacy/branch-hq'
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates'
import { CategorySelect } from '@/components/catalog/category-select'
import {
  useAddInventoryProductMutation,
  useAdjustInventoryMutation,
  useCreateInventoryCategoryMutation,
  useCreateInventorySupplierMutation,
  useDeleteInventoryProductMutation,
  useInventoryAnalytics,
  useInventoryCategories,
  useInventoryList,
  useInventorySuppliers,
  useInvalidateInventory,
  usePurchaseInventoryMutation,
  useTransferInventoryMutation,
  useUpdateInventoryProductMutation,
  type InventoryListRow,
} from '@/hooks/useInventory'
import {
  DashboardPageShell,
  DashboardPageHeader,
  DashboardToolbar,
  DashboardButton,
  DashboardMetricGrid,
  DashboardStatCard,
  DashboardTabsList,
  DashboardDataTable,
  DashboardSearchInput,
  DashboardSectionCard,
  DashboardChartCard,
  DashboardListRow,
  DashboardProgressTrack,
  DashboardPanelEmpty,
  DashboardPageLoading,
  Dialog,
  DialogTrigger,
  DashboardDialogContent,
  DashboardDialogHeader,
  DashboardDialogTitle,
  DashboardDialogDescription,
  DashboardDialogBody,
  DashboardDialogFooter,
  AlertDialog,
  DashboardAlertDialogContent,
  DashboardAlertDialogHeader,
  DashboardAlertDialogTitle,
  DashboardAlertDialogDescription,
  DashboardAlertDialogActions,
} from '@/components/dashboard'
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Package, Plus, AlertTriangle, Calendar, Upload, Download, QrCode, Scan, Search, Filter, TrendingUp, TrendingDown } from 'lucide-react'
import {
  inventoryColumns,
  type InventoryTableRow,
} from '@/components/inventory/inventory-columns'
import { Spinner } from '@/components/ui/spinner'
import { FeatureGate } from '@/components/subscription/feature-gate'
import { InventoryInlineInsuranceCoverage } from '@/components/inventory/inventory-inline-insurance-coverage'
import { usePharmacyEntitlements } from '@/hooks/usePharmacyEntitlements'
import {
  applyInsuranceCoverageDraft,
  emptyInsuranceCoverageDraft,
  type InsuranceCoverageDraft,
} from '@/lib/http/insurance-covered-medications'
import { useActivePharmacy } from '@/components/providers/active-pharmacy-provider'
import { useSaasBranches } from '@/hooks/useSaasSubscription'
import { shouldHideLockedFeature } from '@/lib/subscription/nav-entitlement-display'
import * as XLSX from 'xlsx'
import JsBarcode from 'jsbarcode'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts'

interface InventoryItem {
  id: string
  medicationId?: string
  productCode: string
  name: string
  category: string
  classificationCode: string
  barcode: string
  manufacturer: string
  purchasePrice: number
  price: number
  stock: number
  minStock: number
  maxStock?: number
  batchNumber: string
  expiryDate: string
  trackByBatch: boolean
  vatRate: string
  stockLocation: string
  notes: string
}

type ImportFailure = {
  rowNumber: number
  productName: string
  error: string
}

type ImportSummary = {
  attempted: number
  succeeded: number
  failures: ImportFailure[]
} | null

function toInventoryItem(row: InventoryListRow): InventoryItem {
  return {
    id: row.id,
    medicationId: row.medicationId,
    productCode: '',
    name: row.name,
    category: row.category,
    classificationCode: '',
    barcode: '',
    manufacturer: '',
    purchasePrice: 0,
    price: row.price,
    stock: row.stock,
    minStock: row.minStock,
    batchNumber: row.batchNumber,
    expiryDate: row.expiryDate,
    trackByBatch: false,
    vatRate: 'A',
    stockLocation: row.stockLocationId ?? 'main-store',
    notes: '',
  }
}

export default function InventoryPage() {
  const { can } = usePharmacyEntitlements()
  const { activeBranchId } = useActivePharmacy()
  const branchesQuery = useSaasBranches()
  const branches = branchesQuery.data ?? []
  const headquartersBranchId = useMemo(
    () =>
      branches.find((b) => isHeadquartersBranch(b))?.id ??
      branches[0]?.id ??
      "",
    [branches],
  )
  const showAnalyticsTab =
    can('inventory.analytics') ||
    !shouldHideLockedFeature('inventory.analytics', can)
  const canInsurance = can('pos.insurance')
  const { inventory, setInventory } = usePharmacyStore()
  const inventoryQuery = useInventoryList()
  const analyticsQuery = useInventoryAnalytics()
  const suppliersQuery = useInventorySuppliers()
  const categoriesQuery = useInventoryCategories()
  const invalidateInventory = useInvalidateInventory()

  const addProductMutation = useAddInventoryProductMutation()
  const addSupplierMutation = useCreateInventorySupplierMutation()
  const adjustMutation = useAdjustInventoryMutation()
  const purchaseMutation = usePurchaseInventoryMutation()
  const transferMutation = useTransferInventoryMutation()
  const deleteMutation = useDeleteInventoryProductMutation()
  const updateMutation = useUpdateInventoryProductMutation()
  const createCategoryMutation = useCreateInventoryCategoryMutation()

  const localInventory = useMemo(
    () => (inventoryQuery.data ?? []).map(toInventoryItem),
    [inventoryQuery.data],
  )
  const loading =
    inventoryQuery.isPending ||
    analyticsQuery.isPending ||
    suppliersQuery.isPending ||
    categoriesQuery.isPending
  const categories = (categoriesQuery.data ?? []) as Array<{ id: string; name: string }>
  const suppliers = (suppliersQuery.data ?? []).map((s) => ({
    id: s.id,
    name: s.name,
  }))
  const analyticsData = analyticsQuery.data ?? {
    stockByCategory: [],
    inventoryTrend: [],
  }
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [previewData, setPreviewData] = useState<any[]>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [importSummary, setImportSummary] = useState<ImportSummary>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [barcodeDialogOpen, setBarcodeDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null)
  const [barcodeType, setBarcodeType] = useState('name')
  const [searchTerm, setSearchTerm] = useState('')
  const [bulkMode, setBulkMode] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false)
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false)
  const [transferDialogOpen, setTransferDialogOpen] = useState(false)
  const [adjustmentForm, setAdjustmentForm] = useState({ productId: '', quantity: '', reason: '', type: 'increase' })
  const [purchaseForm, setPurchaseForm] = useState({ productId: '', quantity: '', costPrice: '', supplier: '' })
  const [transferForm, setTransferForm] = useState({
    productId: '',
    quantity: '',
    fromBranchId: '',
    toBranchId: '',
  })
  const [isAddingSupplier, setIsAddingSupplier] = useState(false)
  const [newSupplier, setNewSupplier] = useState({ name: '', contact: '', phone: '', email: '' })
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<string | null>(null)
  const [isEditingProduct, setIsEditingProduct] = useState(false)
  const [editProduct, setEditProduct] = useState<InventoryItem | null>(null)
  const [addInsuranceDraft, setAddInsuranceDraft] = useState<InsuranceCoverageDraft>(
    () => emptyInsuranceCoverageDraft(),
  )
  const [editInsuranceDraft, setEditInsuranceDraft] = useState<InsuranceCoverageDraft>(
    () => emptyInsuranceCoverageDraft(),
  )
  const [commandOpen, setCommandOpen] = useState(false)
  const [newProduct, setNewProduct] = useState({
    productCode: '',
    name: '',
    category: '',
    classificationCode: '',
    barcode: '',
    manufacturer: '',
    purchasePrice: '',
    price: '',
    stock: '',
    minStock: '',
    maxStock: '',
    batchNumber: '',
    expiryDate: '',
    trackByBatch: false,
    vatRate: 'A',
    stockLocation: 'main-store',
    notes: ''
  })

  useEffect(() => {
    if (localInventory.length > 0) {
      setInventory(localInventory)
    }
  }, [localInventory, setInventory])

  useRealtimeUpdates((update) => {
    if (update.type === 'inventory_update') {
      void invalidateInventory.invalidateAll()
    }
  })

  const handleAddProduct = async () => {
    try {
      console.log('Adding product:', newProduct)
      
      // Validate required fields
      if (!newProduct.name || !newProduct.category || !newProduct.stock || !newProduct.minStock) {
        toast({
          title: 'Missing fields',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        })
        return
      }

      const result = await addProductMutation.mutateAsync({
        name: newProduct.name,
        category: newProduct.category,
        batch_number: newProduct.batchNumber || 'BATCH001',
        quantity: parseInt(newProduct.stock) || 0,
        unit_cost: parseFloat(newProduct.purchasePrice) || 0,
        selling_price: parseFloat(newProduct.price) || 0,
        minimum_stock_level: parseInt(newProduct.minStock) || 0,
        expiry_date: newProduct.expiryDate || '2025-12-31',
        stockLocation: newProduct.stockLocation,
      })

      if (canInsurance && result.medicationId) {
        try {
          await applyInsuranceCoverageDraft(result.medicationId, addInsuranceDraft)
        } catch (coverageError) {
          console.error('Insurance coverage save failed:', coverageError)
          toast({
            title: 'Product saved',
            description:
              coverageError instanceof Error
                ? `Stock saved, but insurer coverage failed: ${coverageError.message}`
                : 'Stock saved, but insurer coverage could not be saved.',
            variant: 'destructive',
          })
        }
      }

      setIsAddingProduct(false)
      setAddInsuranceDraft(emptyInsuranceCoverageDraft())
      setNewProduct({ productCode: '', name: '', category: '', classificationCode: '', barcode: '', manufacturer: '', purchasePrice: '', price: '', stock: '', minStock: '', maxStock: '', batchNumber: '', expiryDate: '', trackByBatch: false, vatRate: 'A', stockLocation: 'main-store', notes: '' })
      toast({
        title: 'Success',
        description: 'Product saved to branch inventory',
      })
    } catch (error) {
      console.error('Error saving product:', error)
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to save product',
        variant: 'destructive',
      })
    }
  }

  const filteredInventory = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return localInventory.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term) ||
        item.batchNumber.toLowerCase().includes(term)
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [localInventory, searchTerm, selectedCategory])

  const filteredInventoryIds = useMemo(
    () => filteredInventory.map((item) => item.id),
    [filteredInventory],
  )

  const allFilteredSelected =
    filteredInventoryIds.length > 0 &&
    filteredInventoryIds.every((id) => selectedItems.includes(id))

  const someFilteredSelected = filteredInventoryIds.some((id) =>
    selectedItems.includes(id),
  )

  const toggleSelectAllFiltered = (checked: boolean) => {
    if (checked) {
      setSelectedItems((prev) =>
        Array.from(new Set([...prev, ...filteredInventoryIds])),
      )
      return
    }
    setSelectedItems((prev) =>
      prev.filter((id) => !filteredInventoryIds.includes(id)),
    )
  }

  const toggleSelectRow = (id: string, checked: boolean) => {
    setSelectedItems((prev) => {
      if (checked) return prev.includes(id) ? prev : [...prev, id]
      return prev.filter((itemId) => itemId !== id)
    })
  }

  const inventoryTableColumns = useMemo(
    () =>
      inventoryColumns({
        selectedIds: selectedItems,
        allFilteredSelected,
        someFilteredSelected,
        onToggleSelectAll: toggleSelectAllFiltered,
        onToggleRow: toggleSelectRow,
        onEdit: (item: InventoryTableRow) => {
          const full = localInventory.find((row) => row.id === item.id)
          if (!full) return
          setEditProduct(full)
          setEditInsuranceDraft(emptyInsuranceCoverageDraft())
          setIsEditingProduct(true)
        },
        onGenerateBarcode: (item: InventoryTableRow) => {
          const full = localInventory.find((row) => row.id === item.id)
          if (!full) return
          setBulkMode(false)
          setSelectedProducts([])
          setSelectedProduct(full)
          setBarcodeDialogOpen(true)
        },
        onDelete: (id) => {
          setProductToDelete(id)
          setDeleteDialogOpen(true)
        },
      }),
    [
      selectedItems,
      allFilteredSelected,
      someFilteredSelected,
      localInventory,
    ],
  )

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(localInventory.map(item => ({
      'Product Name': item.name,
      'Category': item.category,
      'Stock': item.stock,
      'Min Stock': item.minStock,
      'Price (RWF)': item.price,
      'Expiry Date': item.expiryDate,
      'Batch Number': item.batchNumber
    })))
    
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory')
    XLSX.writeFile(workbook, `inventory-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const handleExcelImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)
        
        validateAndPreview(jsonData)
      } catch (error) {
        alert('Error reading Excel file. Please check the format.')
      }
    }
    reader.readAsArrayBuffer(file)
    event.target.value = ''
  }

  const validateAndPreview = (data: any[]) => {
    const errors: string[] = []
    setImportSummary(null)
    const validatedData = data.map((row: any, index) => {
      const rowNum = index + 2 // Excel row number (header is row 1)
      
      if (!row['Product Name']) errors.push(`Row ${rowNum}: Product Name is required`)
      if (!row['Category']) errors.push(`Row ${rowNum}: Category is required`)
      if (!row['Stock'] || isNaN(parseInt(row['Stock']))) errors.push(`Row ${rowNum}: Valid Stock number required`)
      if (!row['Min Stock'] || isNaN(parseInt(row['Min Stock']))) errors.push(`Row ${rowNum}: Valid Min Stock number required`)
      if (!row['Price (RWF)'] || isNaN(parseFloat(row['Price (RWF)']))) errors.push(`Row ${rowNum}: Valid Price required`)
      if (!row['Expiry Date']) errors.push(`Row ${rowNum}: Expiry Date is required`)
      if (!row['Batch Number']) errors.push(`Row ${rowNum}: Batch Number is required`)
      
      return {
        'Product Name': row['Product Name'] || '',
        'Category': row['Category'] || '',
        'Stock': parseInt(row['Stock']) || 0,
        'Min Stock': parseInt(row['Min Stock']) || 0,
        'Price (RWF)': parseFloat(row['Price (RWF)']) || 0,
        'Expiry Date': row['Expiry Date'] || '',
        'Batch Number': row['Batch Number'] || ''
      }
    })
    
    setPreviewData(validatedData)
    setValidationErrors(errors)
  }

  const confirmImport = async () => {
    const importCount = previewData.length
    try {
      for (const row of previewData) {
        await addProductMutation.mutateAsync({
          name: row['Product Name'],
          category: row['Category'],
          batch_number: row['Batch Number'],
          quantity: row['Stock'],
          unit_cost: 0,
          selling_price: row['Price (RWF)'],
          minimum_stock_level: row['Min Stock'],
          expiry_date: row['Expiry Date'],
        })
      }

      setPreviewData([])
      setValidationErrors([])
      setIsImportDialogOpen(false)
      alert(`✅ Successfully imported ${importCount} products to database!`)
    } catch (error) {
      console.error('Import error:', error)
      alert('❌ Failed to import products')
    }
  }

  const confirmImportWithReport = async () => {
    const importCount = previewData.length
    const failures: ImportFailure[] = []
    let succeeded = 0

    setIsImporting(true)
    setImportSummary(null)

    for (let index = 0; index < previewData.length; index += 1) {
      const row = previewData[index]
      try {
        const result = await addProductMutation.mutateAsync({
          name: row['Product Name'],
          category: row['Category'],
          batch_number: row['Batch Number'],
          quantity: row['Stock'],
          unit_cost: 0,
          selling_price: row['Price (RWF)'],
          minimum_stock_level: row['Min Stock'],
          expiry_date: row['Expiry Date'],
        })
        if (!result.success) {
          throw new Error(result.error ?? 'Import failed')
        }
        succeeded += 1
      } catch (error) {
        failures.push({
          rowNumber: index + 2,
          productName: String(row['Product Name'] || 'Unnamed product'),
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    setIsImporting(false)
    setImportSummary({ attempted: importCount, succeeded, failures })

    if (failures.length === 0) {
      setPreviewData([])
      setValidationErrors([])
      setIsImportDialogOpen(false)
      toast({
        title: 'Import complete',
        description: `Imported ${succeeded} product${succeeded === 1 ? '' : 's'}.`,
      })
      return
    }

    toast({
      title: succeeded > 0 ? 'Import partially completed' : 'Import failed',
      description: `${succeeded} of ${importCount} products imported. Review failed rows in the dialog.`,
      variant: 'destructive',
    })
  }

  const downloadSample = () => {
    const sampleData = [
      {
        'Product Name': 'Paracetamol 500mg',
        'Category': 'Pain Relief',
        'Stock': 100,
        'Min Stock': 20,
        'Price (RWF)': 500,
        'Expiry Date': '2025-12-31',
        'Batch Number': 'PAR001'
      },
      {
        'Product Name': 'Amoxicillin 250mg',
        'Category': 'Antibiotics',
        'Stock': 50,
        'Min Stock': 15,
        'Price (RWF)': 1200,
        'Expiry Date': '2025-06-30',
        'Batch Number': 'AMX001'
      }
    ]
    
    const worksheet = XLSX.utils.json_to_sheet(sampleData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sample')
    XLSX.writeFile(workbook, 'inventory-sample.xlsx')
  }

  const generateBarcode = () => {
    if (!selectedProduct) return
    
    setTimeout(() => {
      const canvas = document.getElementById('barcode-canvas') as HTMLCanvasElement
      if (canvas) {
        let value = selectedProduct.name
        if (barcodeType === 'price') value = selectedProduct.price.toString()
        if (barcodeType === 'both') value = `${selectedProduct.name} - ${selectedProduct.price}RWF`
        JsBarcode(canvas, value, {
          format: 'CODE128',
          width: 2,
          height: 100,
          displayValue: true
        })
      }
    }, 100)
  }

  const printBarcode = () => {
    const canvas = document.getElementById('barcode-canvas') as HTMLCanvasElement
    if (canvas) {
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head><title>Barcode - ${selectedProduct?.name}</title></head>
            <body style="text-align: center; padding: 20px;">
              <h3>${selectedProduct?.name}</h3>
              <img src="${canvas.toDataURL()}" />
              <p>Price: ${selectedProduct?.price} RWF</p>
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
      }
    }
  }

  const handleAddSupplier = async () => {
    try {
      await addSupplierMutation.mutateAsync(newSupplier)
      toast({
        title: "Success",
        description: "Supplier added successfully",
      })
      setIsAddingSupplier(false)
      setNewSupplier({ name: '', contact: '', phone: '', email: '' })
    } catch (error) {
      console.error('Error adding supplier:', error)
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to add supplier",
        variant: "destructive",
      })
    }
  }

  const handleAdjustment = async () => {
    try {
      await adjustMutation.mutateAsync({
        productId: adjustmentForm.productId,
        quantity: parseInt(adjustmentForm.quantity),
        reason: adjustmentForm.reason,
        adjustmentType: adjustmentForm.type,
      })
      toast({
        title: "Success",
        description: "Stock adjusted successfully",
      })
      setAdjustmentDialogOpen(false)
      setAdjustmentForm({ productId: '', quantity: '', reason: '', type: 'increase' })
    } catch (error) {
      console.error('Adjustment error:', error)
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to adjust stock",
        variant: "destructive",
      })
    }
  }

  const handlePurchase = async () => {
    try {
      await purchaseMutation.mutateAsync({
        productId: purchaseForm.productId,
        quantity: parseInt(purchaseForm.quantity),
        costPrice: parseFloat(purchaseForm.costPrice),
        supplier: purchaseForm.supplier,
      })
      toast({
        title: "Success",
        description: "Stock purchased successfully",
      })
      setPurchaseDialogOpen(false)
      setPurchaseForm({ productId: '', quantity: '', costPrice: '', supplier: '' })
    } catch (error) {
      console.error('Purchase error:', error)
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to purchase stock",
        variant: "destructive",
      })
    }
  }

  const handleTransfer = async () => {
    try {
      const product = inventory.find(p => p.id === transferForm.productId)
      
      if (!product) {
        toast({
          title: "Error",
          description: "Product not found",
          variant: "destructive"
        })
        return
      }

      // Check if enough stock
      if (product.stock < parseInt(transferForm.quantity)) {
        toast({
          title: "Error",
          description: `Insufficient stock. Available: ${product.stock}`,
          variant: "destructive"
        })
        return
      }

      if (!transferForm.fromBranchId || !transferForm.toBranchId) {
        toast({
          title: "Error",
          description: "Select source and destination branches",
          variant: "destructive",
        })
        return
      }

      const result = await transferMutation.mutateAsync({
        productId: transferForm.productId,
        quantity: parseInt(transferForm.quantity, 10),
        fromBranchId: transferForm.fromBranchId,
        toBranchId: transferForm.toBranchId,
      })

      toast({
        title: "Success",
        description: `Transferred ${transferForm.quantity} units. Source stock: ${result.newStock ?? 'updated'}`,
      })
      void invalidateInventory.invalidateList()
      setTransferDialogOpen(false)
      setTransferForm({
        productId: '',
        quantity: '',
        fromBranchId: activeBranchId ?? '',
        toBranchId: '',
      })
    } catch (error) {
      console.error('Transfer error:', error)
      toast({
        title: "Error",
        description: "Failed to transfer stock",
        variant: "destructive"
      })
    }
  }

  const printBulkBarcodes = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      let htmlContent = `
        <html>
          <head><title>Bulk Barcodes</title></head>
          <body style="padding: 20px;">
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
      `
      
      selectedProducts.forEach(productId => {
        const product = inventory.find(p => p.id === productId)
        if (product) {
          const canvas = document.createElement('canvas')
          let value = product.name
          if (barcodeType === 'price') value = product.price.toString()
          if (barcodeType === 'both') value = `${product.name} - ${product.price}RWF`
          
          JsBarcode(canvas, value, {
            format: 'CODE128',
            width: 2,
            height: 100,
            displayValue: true
          })
          
          htmlContent += `
            <div style="text-align: center; border: 1px solid #ccc; padding: 10px;">
              <h4>${product.name}</h4>
              <img src="${canvas.toDataURL()}" />
              <p>Price: ${product.price} RWF</p>
            </div>
          `
        }
      })
      
      htmlContent += `
            </div>
          </body>
        </html>
      `
      
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const handleDeleteProduct = async () => {
    if (!productToDelete) return

    try {
      await deleteMutation.mutateAsync(productToDelete)
      toast({
        title: "Success",
        description: "Product deleted successfully",
      })
      setDeleteDialogOpen(false)
      setProductToDelete(null)
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete product",
        variant: "destructive",
      })
    }
  }

  const handleEditProduct = async () => {
    if (!editProduct) return
    try {
      await updateMutation.mutateAsync({
        id: editProduct.id,
        body: {
          quantity: parseInt(String(editProduct.stock), 10),
          selling_price: parseFloat(String(editProduct.price)),
          minimum_stock_level: parseInt(String(editProduct.minStock), 10),
        },
      })

      if (canInsurance && editProduct.medicationId) {
        try {
          await applyInsuranceCoverageDraft(editProduct.medicationId, editInsuranceDraft, {
            syncAll: true,
          })
        } catch (coverageError) {
          console.error('Insurance coverage save failed:', coverageError)
          toast({
            title: 'Stock updated',
            description:
              coverageError instanceof Error
                ? `Stock saved, but insurer coverage failed: ${coverageError.message}`
                : 'Stock saved, but insurer coverage could not be saved.',
            variant: 'destructive',
          })
          return
        }
      }

      toast({
        title: "Success",
        description: "Product updated successfully",
      })
      setIsEditingProduct(false)
      setEditProduct(null)
      setEditInsuranceDraft(emptyInsuranceCoverageDraft())
    } catch (error) {
      console.error('Edit error:', error)
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update product",
        variant: "destructive",
      })
    }
  }

  const lowStockCount = localInventory.filter((item) => item.stock <= item.minStock).length
  const expiringCount = localInventory.filter((item) => {
    const daysToExpiry = Math.ceil(
      (new Date(item.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    )
    return daysToExpiry <= 60
  }).length
  const inventoryValue = localInventory.reduce(
    (sum, item) => sum + item.stock * item.price,
    0,
  )

  if (loading) return <DashboardPageLoading label="Loading inventory…" />

  return (
    <DashboardPageShell>
      <DashboardPageHeader
        title="Inventory management"
        description="Manage stock, batches, and branch-level quantities."
        actions={
        <DashboardToolbar>
          <DashboardButton onClick={exportToExcel}>
            <Download className="h-4 w-4" />
            Export
          </DashboardButton>
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <DashboardButton>
                <Upload className="h-4 w-4" />
                Import
              </DashboardButton>
            </DialogTrigger>
            <DashboardDialogContent>
              <DashboardDialogHeader>
                <DashboardDialogTitle>Import Products from Excel</DashboardDialogTitle>
                <DashboardDialogDescription>Upload an Excel file to bulk import products</DashboardDialogDescription>
              </DashboardDialogHeader>
              <DashboardDialogBody className="space-y-4">
                {previewData.length === 0 ? (
                  <>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium mb-2">Instructions:</h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• Use the exact column names as shown in the sample</li>
                        <li>• Date format: YYYY-MM-DD (e.g., 2025-12-31)</li>
                        <li>• Price should be in RWF without currency symbol</li>
                        <li>• Stock and Min Stock should be whole numbers</li>
                      </ul>
                    </div>
                    <div className="flex gap-2">
                      <DashboardButton onClick={downloadSample} className="flex-1">
                        <Download className="mr-2 h-4 w-4" />
                        Download Sample
                      </DashboardButton>
                      <DashboardButton tone="primary" onClick={() => document.getElementById('excel-upload')?.click()} className="flex-1">
                        <Upload className="mr-2 h-4 w-4" />
                        Choose File
                      </DashboardButton>
                    </div>
                  </>
                ) : (
                  <>
                    {validationErrors.length > 0 && (
                      <div className="p-4 bg-red-50 rounded-lg">
                        <h4 className="font-medium text-red-800 mb-2">Validation Errors:</h4>
                        <ul className="text-sm text-red-600 space-y-1 max-h-32 overflow-y-auto">
                          {validationErrors.map((error, index) => (
                            <li key={index}>• {error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {importSummary && (
                      <div
                        className={`rounded-lg p-4 ${
                          importSummary.failures.length > 0
                            ? 'bg-amber-50'
                            : 'bg-green-50'
                        }`}
                      >
                        <h4
                          className={`mb-2 font-medium ${
                            importSummary.failures.length > 0
                              ? 'text-amber-800'
                              : 'text-green-800'
                          }`}
                        >
                          Import results: {importSummary.succeeded} of {importSummary.attempted} imported
                        </h4>
                        {importSummary.failures.length > 0 && (
                          <ul className="max-h-32 space-y-1 overflow-y-auto text-sm text-amber-700">
                            {importSummary.failures.map((failure) => (
                              <li key={`${failure.rowNumber}-${failure.productName}`}>
                                Row {failure.rowNumber}: {failure.productName} - {failure.error}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2">Preview ({previewData.length} items):</h4>
                      <div className="max-h-40 overflow-y-auto text-sm">
                        {previewData.slice(0, 3).map((item, index) => (
                          <div key={index} className="text-muted-foreground">
                            {item['Product Name']} - {item['Category']} - Stock: {item['Stock']}
                          </div>
                        ))}
                        {previewData.length > 3 && <div className="text-muted-foreground">...and {previewData.length - 3} more</div>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <DashboardButton onClick={() => { setPreviewData([]); setValidationErrors([]); setImportSummary(null) }} className="flex-1">
                        Cancel
                      </DashboardButton>
                      <DashboardButton tone="primary" onClick={confirmImportWithReport} disabled={validationErrors.length > 0 || isImporting} className="flex-1">
                        {isImporting ? 'Importing...' : `Import ${previewData.length} Products`}
                      </DashboardButton>
                    </div>
                  </>
                )}
              </DashboardDialogBody>
            </DashboardDialogContent>
          </Dialog>
          <input
            id="excel-upload"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleExcelImport}
            style={{ display: 'none' }}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <DashboardButton tone="ghost">
                <QrCode className="h-4 w-4" />
                Barcode
              </DashboardButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Barcode tools</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  setBulkMode(false)
                  setSelectedProducts([])
                  setBarcodeDialogOpen(true)
                }}
              >
                <QrCode className="mr-2 h-4 w-4" />
                Single barcode
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setBulkMode(true)
                  setSelectedProducts([])
                  setSelectedProduct(null)
                  setBarcodeDialogOpen(true)
                }}
              >
                <QrCode className="mr-2 h-4 w-4" />
                Bulk generate
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Dialog
            open={isAddingProduct}
            onOpenChange={(open) => {
              setIsAddingProduct(open)
              if (!open) setAddInsuranceDraft(emptyInsuranceCoverageDraft())
            }}
          >
            <DialogTrigger asChild>
              <DashboardButton tone="primary">
                <Plus className="h-4 w-4" />
                Add product
              </DashboardButton>
            </DialogTrigger>
          <DashboardDialogContent className="flex max-h-[min(92dvh,52rem)] flex-col overflow-hidden sm:max-w-2xl">
            <DashboardDialogHeader>
              <DashboardDialogTitle>Add New Product</DashboardDialogTitle>
              <DashboardDialogDescription>Add medication with custom stock alert thresholds</DashboardDialogDescription>
            </DashboardDialogHeader>
            <DashboardDialogBody className="grid min-h-0 flex-1 gap-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Product Code (SKU)</Label>
                  <Input 
                    placeholder="PAR500" 
                    value={newProduct.productCode}
                    onChange={(e) => setNewProduct({...newProduct, productCode: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Barcode</Label>
                  <Input 
                    placeholder="123456789" 
                    value={newProduct.barcode}
                    onChange={(e) => setNewProduct({...newProduct, barcode: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Product Name</Label>
                <Input 
                  placeholder="Paracetamol 500mg" 
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Category / Family</Label>
                  <CategorySelect
                    value={newProduct.category}
                    onValueChange={(value) =>
                      setNewProduct({ ...newProduct, category: value })
                    }
                    categories={categories}
                    onCreateCategory={(name) => createCategoryMutation.mutateAsync(name)}
                    placeholder="Select category"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Classification Code</Label>
                  <Input 
                    placeholder="N02BE01" 
                    value={newProduct.classificationCode}
                    onChange={(e) => setNewProduct({...newProduct, classificationCode: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Manufacturer / Supplier</Label>
                <Input 
                  placeholder="PharmaCorp Ltd" 
                  value={newProduct.manufacturer}
                  onChange={(e) => setNewProduct({...newProduct, manufacturer: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Purchase Price (RWF)</Label>
                  <Input 
                    type="number" 
                    placeholder="400" 
                    value={newProduct.purchasePrice}
                    onChange={(e) => setNewProduct({...newProduct, purchasePrice: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Unit Price (RWF)</Label>
                  <Input 
                    type="number" 
                    placeholder="500" 
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label>Initial Stock</Label>
                  <Input 
                    type="number" 
                    placeholder="100" 
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Minimum Stock Alert</Label>
                  <Input 
                    type="number" 
                    placeholder="20" 
                    value={newProduct.minStock}
                    onChange={(e) => setNewProduct({...newProduct, minStock: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Maximum Stock (optional)</Label>
                  <Input 
                    type="number" 
                    placeholder="500" 
                    value={newProduct.maxStock}
                    onChange={(e) => setNewProduct({...newProduct, maxStock: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Batch Number</Label>
                  <Input 
                    placeholder="BAT001" 
                    value={newProduct.batchNumber}
                    onChange={(e) => setNewProduct({...newProduct, batchNumber: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Expiry Date</Label>
                  <Input 
                    type="date" 
                    value={newProduct.expiryDate}
                    onChange={(e) => setNewProduct({...newProduct, expiryDate: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>VAT Rate</Label>
                  <Select value={newProduct.vatRate} onValueChange={(value) => setNewProduct({...newProduct, vatRate: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">Option A (18%)</SelectItem>
                      <SelectItem value="B">Option B (0%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Stock Location</Label>
                  <Select value={newProduct.stockLocation} onValueChange={(value) => setNewProduct({...newProduct, stockLocation: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="main-store">Main Store</SelectItem>
                      <SelectItem value="branch">Branch</SelectItem>
                      <SelectItem value="cold-storage">Cold Storage</SelectItem>
                      <SelectItem value="warehouse">Warehouse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="trackByBatch"
                  checked={newProduct.trackByBatch}
                  onChange={(e) => setNewProduct({...newProduct, trackByBatch: e.target.checked})}
                />
                <Label htmlFor="trackByBatch">Track by Batch?</Label>
              </div>
              <div className="grid gap-2">
                <Label>Notes / Special Instructions</Label>
                <Input 
                  placeholder="Store in cool, dry place" 
                  value={newProduct.notes}
                  onChange={(e) => setNewProduct({...newProduct, notes: e.target.value})}
                />
              </div>
              <FeatureGate featureKey="pos.insurance" hideWhenLocked>
                <InventoryInlineInsuranceCoverage
                  value={addInsuranceDraft}
                  onChange={setAddInsuranceDraft}
                />
              </FeatureGate>
            </DashboardDialogBody>
            <DashboardDialogFooter>
              <DashboardButton tone="primary" onClick={() => {
                console.log('Form validation:', {
                  name: newProduct.name,
                  category: newProduct.category,
                  stock: newProduct.stock,
                  minStock: newProduct.minStock,
                  valid: !!(newProduct.name && newProduct.category && newProduct.stock && newProduct.minStock)
                })
                handleAddProduct()
              }} disabled={!newProduct.name || !newProduct.category || !newProduct.stock || !newProduct.minStock}>
                Add Product
              </DashboardButton>
            </DashboardDialogFooter>
          </DashboardDialogContent>
        </Dialog>
        </DashboardToolbar>
        }
      />

      <DashboardMetricGrid columns={5}>
        <DashboardStatCard
          label="Total products"
          icon={Package}
          value={localInventory.length}
          hint="Active inventory items"
        />
        <DashboardStatCard
          label="Low stock"
          icon={AlertTriangle}
          value={lowStockCount}
          hint="Below minimum"
        />
        <DashboardStatCard
          label="Expiring soon"
          icon={Calendar}
          value={expiringCount}
          hint="Within 60 days"
        />
        <DashboardStatCard
          label="Total value"
          icon={TrendingUp}
          value={`${inventoryValue.toLocaleString()} RWF`}
          hint="Stock on hand"
        />
      </DashboardMetricGrid>

      <Tabs defaultValue="inventory" className="space-y-4">
        <DashboardTabsList>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          {showAnalyticsTab ? (
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          ) : null}
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </DashboardTabsList>
        
        <TabsContent value="inventory" className="space-y-4">
          <DashboardDataTable
            title="Inventory items"
            description="Manage your pharmacy stock levels"
            toolbar={
              <>
                <DashboardSearchInput
                  placeholder="Search products…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full min-w-0 sm:max-w-md sm:flex-1"
                />
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-8 w-full rounded-lg sm:w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            }
            columns={inventoryTableColumns}
            data={filteredInventory}
            getRowId={(row) => row.id}
            showIndexColumn={false}
            pageSize={10}
            pageSizeOptions={[10, 20, 50]}
            stickyHeader
            initialSorting={[{ id: "name", desc: false }]}
            emptyMessage="No products match your search or filters."
            isLoading={inventoryQuery.isPending && localInventory.length === 0}
          />
        </TabsContent>
        
        <TabsContent value="alerts" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <DashboardSectionCard
              title="Low stock alerts"
              description="Items below minimum threshold"
            >
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {localInventory.filter((item) => item.stock <= item.minStock).length === 0 ? (
                    <DashboardPanelEmpty
                      icon={Package}
                      title="No low stock items"
                      description="Everything is above your minimum thresholds."
                      className="min-h-[200px]"
                    />
                  ) : (
                    localInventory
                      .filter((item) => item.stock <= item.minStock)
                      .map((item) => (
                        <DashboardListRow key={item.id} variant="danger">
                          <div className="flex items-center gap-3">
                            <Package className="h-4 w-4 text-red-600" />
                            <div>
                              <p className="text-sm font-medium">{item.name}</p>
                              <p className="text-xs text-neutral-500">{item.category}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-red-700">
                              {item.stock} / {item.minStock}
                            </p>
                            <DashboardProgressTrack
                              value={(item.stock / Math.max(item.minStock, 1)) * 100}
                              className="mt-1 w-20"
                              barClassName="bg-red-600"
                            />
                          </div>
                        </DashboardListRow>
                      ))
                  )}
                </div>
              </ScrollArea>
            </DashboardSectionCard>

            <DashboardSectionCard
              title="Expiring items"
              description="Products expiring within 60 days"
            >
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {localInventory.filter((item) => {
                    const daysToExpiry = Math.ceil(
                      (new Date(item.expiryDate).getTime() - Date.now()) /
                        (1000 * 60 * 60 * 24),
                    )
                    return daysToExpiry <= 60 && daysToExpiry > 0
                  }).length === 0 ? (
                    <DashboardPanelEmpty
                      icon={Calendar}
                      title="Nothing expiring soon"
                      description="No batches due within 60 days."
                      className="min-h-[200px]"
                    />
                  ) : (
                    localInventory
                      .filter((item) => {
                        const daysToExpiry = Math.ceil(
                          (new Date(item.expiryDate).getTime() - Date.now()) /
                            (1000 * 60 * 60 * 24),
                        )
                        return daysToExpiry <= 60 && daysToExpiry > 0
                      })
                      .map((item) => {
                        const daysToExpiry = Math.ceil(
                          (new Date(item.expiryDate).getTime() - Date.now()) /
                            (1000 * 60 * 60 * 24),
                        )
                        return (
                          <DashboardListRow key={item.id} variant="warning">
                            <div className="flex items-center gap-3">
                              <Calendar className="h-4 w-4 text-amber-600" />
                              <div>
                                <p className="text-sm font-medium">{item.name}</p>
                                <p className="text-xs text-neutral-500">{item.category}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant={daysToExpiry <= 30 ? 'destructive' : 'secondary'}>
                                {daysToExpiry} days
                              </Badge>
                              <p className="mt-1 text-xs text-neutral-500">Stock: {item.stock}</p>
                            </div>
                          </DashboardListRow>
                        )
                      })
                  )}
                </div>
              </ScrollArea>
            </DashboardSectionCard>
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          <FeatureGate featureKey="inventory.analytics">
          <div className="grid gap-4 md:grid-cols-2">
            <DashboardChartCard
              title="Stock by category"
              description="Inventory distribution"
              config={{ stock: { label: "Stock", color: "#3b82f6" } }}
              chartClassName="h-64 w-full"
            >
              <BarChart data={analyticsData.stockByCategory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="stock" fill="#3b82f6" radius={4} />
              </BarChart>
            </DashboardChartCard>

            <DashboardChartCard
              title="Inventory value trend"
              description="Monthly inventory worth"
              config={{ value: { label: "Value", color: "#10b981" } }}
              chartClassName="h-64 w-full"
            >
              <LineChart data={analyticsData.inventoryTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} RWF`, 'Value']} />
                <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </DashboardChartCard>
          </div>
          </FeatureGate>
        </TabsContent>
        
        <TabsContent value="actions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <DashboardSectionCard
              title="Stock management"
              description="Adjust and manage inventory levels"
              contentClassName="space-y-2"
            >
                <DashboardButton tone="primary" className="w-full" onClick={() => setAdjustmentDialogOpen(true)}>
                  Stock adjustment
                </DashboardButton>
                <DashboardButton className="w-full" onClick={() => setPurchaseDialogOpen(true)}>
                  Purchase stock
                </DashboardButton>
                <DashboardButton
                  className="w-full"
                  onClick={() => {
                    const toBranch =
                      activeBranchId &&
                      activeBranchId !== headquartersBranchId
                        ? activeBranchId
                        : ""
                    setTransferForm((f) => ({
                      ...f,
                      fromBranchId: headquartersBranchId || f.fromBranchId,
                      toBranchId: toBranch || f.toBranchId,
                    }))
                    setTransferDialogOpen(true)
                  }}
                >
                  Stock transfer
                </DashboardButton>
            </DashboardSectionCard>

            <DashboardSectionCard
              title="Data management"
              description="Import and export inventory data"
              contentClassName="space-y-2"
            >
                <DashboardButton tone="primary" className="w-full" onClick={exportToExcel}>
                  <Download className="h-4 w-4" />
                  Export to Excel
                </DashboardButton>
                <DashboardButton className="w-full" onClick={() => setIsImportDialogOpen(true)}>
                  <Upload className="h-4 w-4" />
                  Import from Excel
                </DashboardButton>
                <DashboardButton className="w-full" onClick={downloadSample}>
                  Download sample
                </DashboardButton>
            </DashboardSectionCard>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DashboardAlertDialogContent>
          <DashboardAlertDialogHeader>
            <DashboardAlertDialogTitle>Are you sure?</DashboardAlertDialogTitle>
            <DashboardAlertDialogDescription>
              This action cannot be undone. This will permanently delete the product from your inventory.
            </DashboardAlertDialogDescription>
          </DashboardAlertDialogHeader>
          <DashboardAlertDialogActions
            confirmLabel="Delete"
            confirmTone="destructive"
            onCancel={() => setProductToDelete(null)}
            onConfirm={handleDeleteProduct}
          />
        </DashboardAlertDialogContent>
      </AlertDialog>

      <Dialog open={adjustmentDialogOpen} onOpenChange={setAdjustmentDialogOpen}>
        <DashboardDialogContent>
          <DashboardDialogHeader>
            <DashboardDialogTitle>Stock Adjustment</DashboardDialogTitle>
            <DashboardDialogDescription>Adjust stock quantities for inventory corrections</DashboardDialogDescription>
          </DashboardDialogHeader>
          <DashboardDialogBody className="space-y-4">
            <div>
              <Label>Select Product</Label>
              <Select value={adjustmentForm.productId} onValueChange={(value) => setAdjustmentForm({...adjustmentForm, productId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose product" />
                </SelectTrigger>
                <SelectContent>
                  {inventory.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} (Current: {item.stock})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Adjustment Type</Label>
              <Select value={adjustmentForm.type} onValueChange={(value) => setAdjustmentForm({...adjustmentForm, type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="increase">Increase Stock</SelectItem>
                  <SelectItem value="decrease">Decrease Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantity</Label>
              <Input 
                type="number" 
                value={adjustmentForm.quantity}
                onChange={(e) => setAdjustmentForm({...adjustmentForm, quantity: e.target.value})}
                placeholder="Enter quantity"
              />
            </div>
            <div>
              <Label>Reason</Label>
              <Input 
                value={adjustmentForm.reason}
                onChange={(e) => setAdjustmentForm({...adjustmentForm, reason: e.target.value})}
                placeholder="Reason for adjustment"
              />
            </div>
          </DashboardDialogBody>
          <DashboardDialogFooter>
            <DashboardButton onClick={() => setAdjustmentDialogOpen(false)}>Cancel</DashboardButton>
            <DashboardButton tone="primary" onClick={handleAdjustment} disabled={!adjustmentForm.productId || !adjustmentForm.quantity || !adjustmentForm.reason}>
              Adjust Stock
            </DashboardButton>
          </DashboardDialogFooter>
        </DashboardDialogContent>
      </Dialog>

      <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
        <DashboardDialogContent>
          <DashboardDialogHeader>
            <DashboardDialogTitle>Purchase Stock</DashboardDialogTitle>
            <DashboardDialogDescription>Add new stock through purchase</DashboardDialogDescription>
          </DashboardDialogHeader>
          <DashboardDialogBody className="space-y-4">
            <div>
              <Label>Select Product</Label>
              <Select value={purchaseForm.productId} onValueChange={(value) => setPurchaseForm({...purchaseForm, productId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose product" />
                </SelectTrigger>
                <SelectContent>
                  {inventory.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} (Current: {item.stock})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Purchase Quantity</Label>
              <Input 
                type="number" 
                value={purchaseForm.quantity}
                onChange={(e) => setPurchaseForm({...purchaseForm, quantity: e.target.value})}
                placeholder="Enter quantity to purchase"
              />
            </div>
            <div>
              <Label>Cost Price per Unit</Label>
              <Input 
                type="number" 
                value={purchaseForm.costPrice}
                onChange={(e) => setPurchaseForm({...purchaseForm, costPrice: e.target.value})}
                placeholder="Cost price in RWF"
              />
            </div>
            <div>
              <Label>Supplier</Label>
              <div className="flex gap-2">
                <Select value={purchaseForm.supplier} onValueChange={(value) => setPurchaseForm({...purchaseForm, supplier: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.name}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <DashboardButton size="icon" onClick={() => setIsAddingSupplier(true)}>
                  <Plus className="h-4 w-4" />
                </DashboardButton>
              </div>
            </div>
          </DashboardDialogBody>
          <DashboardDialogFooter>
            <DashboardButton onClick={() => setPurchaseDialogOpen(false)}>Cancel</DashboardButton>
            <DashboardButton tone="primary" onClick={handlePurchase} disabled={!purchaseForm.productId || !purchaseForm.quantity || !purchaseForm.costPrice}>
              Purchase Stock
            </DashboardButton>
          </DashboardDialogFooter>
        </DashboardDialogContent>
      </Dialog>

      <Dialog open={isAddingSupplier} onOpenChange={setIsAddingSupplier}>
        <DashboardDialogContent>
          <DashboardDialogHeader>
            <DashboardDialogTitle>Add New Supplier</DashboardDialogTitle>
            <DashboardDialogDescription>Create a new supplier for purchasing</DashboardDialogDescription>
          </DashboardDialogHeader>
          <DashboardDialogBody className="space-y-4">
            <div>
              <Label>Supplier Name</Label>
              <Input 
                value={newSupplier.name}
                onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})}
                placeholder="e.g. PharmaCorp Ltd"
              />
            </div>
            <div>
              <Label>Contact Person</Label>
              <Input 
                value={newSupplier.contact}
                onChange={(e) => setNewSupplier({...newSupplier, contact: e.target.value})}
                placeholder="Contact person name"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input 
                value={newSupplier.phone}
                onChange={(e) => setNewSupplier({...newSupplier, phone: e.target.value})}
                placeholder="+250 xxx xxx xxx"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input 
                type="email"
                value={newSupplier.email}
                onChange={(e) => setNewSupplier({...newSupplier, email: e.target.value})}
                placeholder="contact@supplier.com"
              />
            </div>
          </DashboardDialogBody>
          <DashboardDialogFooter>
            <DashboardButton onClick={() => setIsAddingSupplier(false)}>Cancel</DashboardButton>
            <DashboardButton tone="primary" onClick={handleAddSupplier} disabled={!newSupplier.name}>
              Add Supplier
            </DashboardButton>
          </DashboardDialogFooter>
        </DashboardDialogContent>
      </Dialog>

      <Dialog open={barcodeDialogOpen} onOpenChange={setBarcodeDialogOpen}>
        <DashboardDialogContent>
          <DashboardDialogHeader>
            <DashboardDialogTitle>
              {bulkMode ? "Bulk barcode labels" : "Generate barcode"}
            </DashboardDialogTitle>
            <DashboardDialogDescription>
              {bulkMode
                ? "Select products and print barcode labels in one batch."
                : selectedProduct
                  ? `Generate barcode for ${selectedProduct.name}`
                  : "Choose a product and print its barcode label."}
            </DashboardDialogDescription>
          </DashboardDialogHeader>
          <DashboardDialogBody className="space-y-4">
            {!bulkMode ? (
              <>
                <div className="space-y-2">
                  <Label>Select Medicine</Label>
                  <Select value={selectedProduct?.id || ''} onValueChange={(value) => {
                    const product = localInventory.find(item => item.id === value)
                    setSelectedProduct(product || null)
                    if (product) generateBarcode()
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose medicine" />
                    </SelectTrigger>
                    <SelectContent>
                      {inventory.map(item => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} - {item.price} RWF
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Barcode Content</Label>
                  <Select value={barcodeType} onValueChange={(value) => {
                    setBarcodeType(value)
                    generateBarcode()
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Product Name</SelectItem>
                      <SelectItem value="price">Price</SelectItem>
                      <SelectItem value="both">Name + Price</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {selectedProduct && (
                  <div className="text-center p-4 border rounded-lg">
                    <canvas id="barcode-canvas"></canvas>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Select Medicines ({selectedProducts.length} selected)</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-2">
                    {inventory.map(item => (
                      <div key={item.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(item.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProducts([...selectedProducts, item.id])
                            } else {
                              setSelectedProducts(selectedProducts.filter(id => id !== item.id))
                            }
                          }}
                        />
                        <span className="text-sm">{item.name} - {item.price} RWF</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Barcode Content</Label>
                  <Select value={barcodeType} onValueChange={setBarcodeType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Product Name</SelectItem>
                      <SelectItem value="price">Price</SelectItem>
                      <SelectItem value="both">Name + Price</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div className="flex gap-2">
              <DashboardButton onClick={() => { setBarcodeDialogOpen(false); setSelectedProducts([]) }} className="flex-1">
                Cancel
              </DashboardButton>
              <DashboardButton
                tone="primary"
                onClick={bulkMode ? printBulkBarcodes : printBarcode} 
                disabled={bulkMode ? selectedProducts.length === 0 : !selectedProduct} 
                className="flex-1"
              >
                {bulkMode ? `Print ${selectedProducts.length} Barcodes` : 'Print Barcode'}
              </DashboardButton>
            </div>
          </DashboardDialogBody>
        </DashboardDialogContent>
      </Dialog>

      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DashboardDialogContent>
          <DashboardDialogHeader>
            <DashboardDialogTitle>Stock Transfer</DashboardDialogTitle>
            <DashboardDialogDescription>Move stock between branches (same product batch)</DashboardDialogDescription>
          </DashboardDialogHeader>
          <DashboardDialogBody className="space-y-4">
            <div>
              <Label>Select Product</Label>
              <Select value={transferForm.productId} onValueChange={(value) => setTransferForm({...transferForm, productId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose product" />
                </SelectTrigger>
                <SelectContent>
                  {inventory.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} (Stock: {item.stock})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Transfer Quantity</Label>
              <Input 
                type="number" 
                value={transferForm.quantity}
                onChange={(e) => setTransferForm({...transferForm, quantity: e.target.value})}
                placeholder="Enter quantity to transfer"
              />
            </div>
            <div>
              <Label>From branch</Label>
              <Select
                value={transferForm.fromBranchId}
                onValueChange={(value) =>
                  setTransferForm({ ...transferForm, fromBranchId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Source branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>To branch</Label>
              <Select
                value={transferForm.toBranchId}
                onValueChange={(value) =>
                  setTransferForm({ ...transferForm, toBranchId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Destination branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches
                    .filter((b) => b.id !== transferForm.fromBranchId)
                    .map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </DashboardDialogBody>
          <DashboardDialogFooter>
            <DashboardButton onClick={() => setTransferDialogOpen(false)}>Cancel</DashboardButton>
            <DashboardButton
              tone="primary"
              onClick={handleTransfer}
              disabled={
                !transferForm.productId ||
                !transferForm.quantity ||
                !transferForm.fromBranchId ||
                !transferForm.toBranchId ||
                transferMutation.isPending
              }
            >
              Transfer Stock
            </DashboardButton>
          </DashboardDialogFooter>
        </DashboardDialogContent>
      </Dialog>

      <Dialog
        open={isEditingProduct}
        onOpenChange={(open) => {
          setIsEditingProduct(open)
          if (!open) {
            setEditProduct(null)
            setEditInsuranceDraft(emptyInsuranceCoverageDraft())
          }
        }}
      >
        <DashboardDialogContent className="flex max-h-[min(92dvh,52rem)] flex-col overflow-hidden sm:max-w-2xl">
          <DashboardDialogHeader>
            <DashboardDialogTitle>Edit Product</DashboardDialogTitle>
            <DashboardDialogDescription>Update stock levels and insurer coverage</DashboardDialogDescription>
          </DashboardDialogHeader>
          {editProduct && (
            <DashboardDialogBody className="min-h-0 flex-1 space-y-4 overflow-y-auto">
              <div>
                <Label>Product Name</Label>
                <Input value={editProduct.name} disabled />
              </div>
              <div>
                <Label>Stock Quantity</Label>
                <Input 
                  type="number" 
                  value={editProduct.stock}
                  onChange={(e) =>
                    setEditProduct({
                      ...editProduct,
                      stock: Number(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <Label>Selling Price (RWF)</Label>
                <Input 
                  type="number" 
                  value={editProduct.price}
                  onChange={(e) =>
                    setEditProduct({
                      ...editProduct,
                      price: Number(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <Label>Minimum Stock Level</Label>
                <Input 
                  type="number" 
                  value={editProduct.minStock}
                  onChange={(e) =>
                    setEditProduct({
                      ...editProduct,
                      minStock: Number(e.target.value) || 0,
                    })
                  }
                />
              </div>
              {editProduct.medicationId ? (
                <FeatureGate featureKey="pos.insurance" hideWhenLocked>
                  <InventoryInlineInsuranceCoverage
                    medicationId={editProduct.medicationId}
                    value={editInsuranceDraft}
                    onChange={setEditInsuranceDraft}
                  />
                </FeatureGate>
              ) : null}
            </DashboardDialogBody>
          )}
          <DashboardDialogFooter>
            <DashboardButton
              onClick={() => {
                setIsEditingProduct(false)
                setEditProduct(null)
                setEditInsuranceDraft(emptyInsuranceCoverageDraft())
              }}
            >
              Cancel
            </DashboardButton>
            <DashboardButton tone="primary" onClick={handleEditProduct}>Save Changes</DashboardButton>
          </DashboardDialogFooter>
        </DashboardDialogContent>
      </Dialog>
    </DashboardPageShell>
  )
}
