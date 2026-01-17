'use client'

import { useState, useEffect } from 'react'
import { usePharmacyStore } from '@/hooks/usePharmacyStore'
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates'
import { createClient } from '../../../../supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Package, Plus, AlertTriangle, Calendar, Upload, Download, QrCode, Scan, Search, Filter, MoreHorizontal, Edit, Trash2, Eye, TrendingUp, TrendingDown } from 'lucide-react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Spinner } from '@/components/ui/spinner'
import * as XLSX from 'xlsx'
import JsBarcode from 'jsbarcode'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts'

interface InventoryItem {
  id: string
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

export default function InventoryPage() {
  const { inventory, setInventory } = usePharmacyStore()
  const [localInventory, setLocalInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [previewData, setPreviewData] = useState<any[]>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [barcodeDialogOpen, setBarcodeDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null)
  const [barcodeType, setBarcodeType] = useState('name')
  const [quickAddCategoryOpen, setQuickAddCategoryOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [categories, setCategories] = useState(['Pain Relief', 'Antibiotics', 'Vitamins', 'Prescription'])
  const [searchTerm, setSearchTerm] = useState('')
  const [bulkMode, setBulkMode] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false)
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false)
  const [transferDialogOpen, setTransferDialogOpen] = useState(false)
  const [adjustmentForm, setAdjustmentForm] = useState({ productId: '', quantity: '', reason: '', type: 'increase' })
  const [purchaseForm, setPurchaseForm] = useState({ productId: '', quantity: '', costPrice: '', supplier: '' })
  const [transferForm, setTransferForm] = useState({ productId: '', quantity: '', fromLocation: 'main-store', toLocation: '' })
  const [suppliers, setSuppliers] = useState([])
  const [isAddingSupplier, setIsAddingSupplier] = useState(false)
  const [newSupplier, setNewSupplier] = useState({ name: '', contact: '', phone: '', email: '' })
  const [analyticsData, setAnalyticsData] = useState({ stockByCategory: [], inventoryTrend: [] })
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<string | null>(null)
  const [isEditingProduct, setIsEditingProduct] = useState(false)
  const [editProduct, setEditProduct] = useState<any>(null)
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

  // Real-time updates
  useRealtimeUpdates((update) => {
    if (update.type === 'inventory_update') {
      fetchInventory()
    }
  })

  useEffect(() => {
    fetchInventory()
    fetchSuppliers()
    fetchAnalytics()
  }, [])
  
  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/inventory/analytics')
      if (response.ok) {
        const data = await response.json()
        setAnalyticsData(data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
  }

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/inventory/suppliers')
      if (response.ok) {
        const data = await response.json()
        setSuppliers(data)
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    }
  }

  const handleAddSupplier = async () => {
    try {
      const response = await fetch('/api/inventory/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSupplier)
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        toast({
          title: "Success",
          description: "Supplier added successfully"
        })
        await fetchSuppliers()
        setIsAddingSupplier(false)
        setNewSupplier({ name: '', contact: '', phone: '', email: '' })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to add supplier",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error adding supplier:', error)
      toast({
        title: "Error",
        description: "Failed to add supplier",
        variant: "destructive"
      })
    }
  }

  const fetchInventory = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const response = await fetch('/api/inventory', {
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          }
        })
        if (response.ok) {
          const data = await response.json()
          setLocalInventory(data)
          setInventory(data)
        }
      }
    } catch (error) {
      console.error('Error fetching inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddProduct = async () => {
    try {
      console.log('Adding product:', newProduct)
      
      // Validate required fields
      if (!newProduct.name || !newProduct.category || !newProduct.stock || !newProduct.minStock) {
        alert('❌ Please fill in all required fields')
        return
      }
      
      // Save to database via API
      const response = await fetch('/api/inventory/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProduct.name,
          category: newProduct.category,
          batch_number: newProduct.batchNumber || 'BATCH001',
          quantity: parseInt(newProduct.stock) || 0,
          unit_cost: parseFloat(newProduct.purchasePrice) || 0,
          selling_price: parseFloat(newProduct.price) || 0,
          minimum_stock_level: parseInt(newProduct.minStock) || 0,
          expiry_date: newProduct.expiryDate || '2025-12-31'
        })
      })
      
      const result = await response.json()
      console.log('API Response:', response.status, result)
      
      if (response.ok && result.success) {
        // Refresh inventory from database
        await fetchInventory()
        setIsAddingProduct(false)
        setNewProduct({ productCode: '', name: '', category: '', classificationCode: '', barcode: '', manufacturer: '', purchasePrice: '', price: '', stock: '', minStock: '', maxStock: '', batchNumber: '', expiryDate: '', trackByBatch: false, vatRate: 'A', stockLocation: 'main-store', notes: '' })
        alert('✅ Product saved to database successfully!')
      } else {
        alert(`❌ Failed to save product: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error saving product:', error)
      alert('❌ Error saving product to database: ' + error.message)
    }
  }

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock <= minStock) return { label: 'Low Stock', variant: 'destructive' as const }
    if (stock <= minStock * 2) return { label: 'Medium', variant: 'secondary' as const }
    return { label: 'In Stock', variant: 'default' as const }
  }

  const getExpiryStatus = (expiryDate: string) => {
    const today = new Date()
    const expiry = new Date(expiryDate)
    const daysToExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysToExpiry <= 30) return { label: `${daysToExpiry}d`, variant: 'destructive' as const }
    if (daysToExpiry <= 60) return { label: `${daysToExpiry}d`, variant: 'secondary' as const }
    return { label: `${daysToExpiry}d`, variant: 'outline' as const }
  }

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(inventory.map(item => ({
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
    try {
      // Save each product to database
      for (const row of previewData) {
        await fetch('/api/inventory/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: row['Product Name'],
            category: row['Category'],
            batch_number: row['Batch Number'],
            quantity: row['Stock'],
            unit_cost: 0,
            selling_price: row['Price (RWF)'],
            minimum_stock_level: row['Min Stock'],
            expiry_date: row['Expiry Date']
          })
        })
      }
      
      // Refresh inventory from database
      await fetchInventory()
      setPreviewData([])
      setValidationErrors([])
      setIsImportDialogOpen(false)
      alert(`✅ Successfully imported ${previewData.length} products to database!`)
    } catch (error) {
      console.error('Import error:', error)
      alert('❌ Failed to import products')
    }
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

  const handleAdjustment = async () => {
    try {
      const response = await fetch('/api/inventory/adjustment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          productId: adjustmentForm.productId, 
          quantity: parseInt(adjustmentForm.quantity), 
          reason: adjustmentForm.reason, 
          adjustmentType: adjustmentForm.type 
        })
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        toast({
          title: "Success",
          description: "Stock adjusted successfully"
        })
        setAdjustmentDialogOpen(false)
        setAdjustmentForm({ productId: '', quantity: '', reason: '', type: 'increase' })
        await fetchInventory()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to adjust stock",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Adjustment error:', error)
      toast({
        title: "Error",
        description: "Failed to adjust stock",
        variant: "destructive"
      })
    }
  }

  const handlePurchase = async () => {
    try {
      const response = await fetch('/api/inventory/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          productId: purchaseForm.productId, 
          quantity: parseInt(purchaseForm.quantity), 
          costPrice: parseFloat(purchaseForm.costPrice), 
          supplier: purchaseForm.supplier 
        })
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        toast({
          title: "Success",
          description: "Stock purchased successfully"
        })
        setPurchaseDialogOpen(false)
        setPurchaseForm({ productId: '', quantity: '', costPrice: '', supplier: '' })
        await fetchInventory()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to purchase stock",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Purchase error:', error)
      toast({
        title: "Error",
        description: "Failed to purchase stock",
        variant: "destructive"
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

      const response = await fetch('/api/inventory/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          productId: transferForm.productId,
          product: product.name,
          quantity: parseInt(transferForm.quantity), 
          from: transferForm.fromLocation, 
          to: transferForm.toLocation 
        })
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        toast({
          title: "Success",
          description: `Transferred ${transferForm.quantity} units. New stock: ${result.newStock}`
        })
        setTransferDialogOpen(false)
        setTransferForm({ productId: '', quantity: '', fromLocation: 'main-store', toLocation: '' })
        await fetchInventory()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to transfer stock",
          variant: "destructive"
        })
      }
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
      const response = await fetch(`/api/inventory/${productToDelete}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Product deleted successfully"
        })
        await fetchInventory()
        setDeleteDialogOpen(false)
        setProductToDelete(null)
      } else {
        toast({
          title: "Error",
          description: "Failed to delete product",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive"
      })
    }
  }

  const handleEditProduct = async () => {
    try {
      const response = await fetch(`/api/inventory/${editProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: parseInt(editProduct.stock),
          selling_price: parseFloat(editProduct.price),
          minimum_stock_level: parseInt(editProduct.minStock)
        })
      })
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Product updated successfully"
        })
        await fetchInventory()
        setIsEditingProduct(false)
        setEditProduct(null)
      } else {
        toast({
          title: "Error",
          description: "Failed to update product",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Edit error:', error)
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive"
      })
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Spinner className="size-6" />
    </div>
  )

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">Inventory Management</h1>
            <p className="text-xs text-muted-foreground">
              Manage your pharmacy stock with automated alerts and analytics
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportToExcel}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Products from Excel</DialogTitle>
                <DialogDescription>Upload an Excel file to bulk import products</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
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
                      <Button variant="outline" onClick={downloadSample} className="flex-1">
                        <Download className="mr-2 h-4 w-4" />
                        Download Sample
                      </Button>
                      <Button onClick={() => document.getElementById('excel-upload')?.click()} className="flex-1">
                        <Upload className="mr-2 h-4 w-4" />
                        Choose File
                      </Button>
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
                      <Button variant="outline" onClick={() => { setPreviewData([]); setValidationErrors([]) }} className="flex-1">
                        Cancel
                      </Button>
                      <Button onClick={confirmImport} disabled={validationErrors.length > 0} className="flex-1">
                        Import {previewData.length} Products
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
          <input
            id="excel-upload"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleExcelImport}
            style={{ display: 'none' }}
          />
          <Dialog open={isAddingProduct} onOpenChange={setIsAddingProduct}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>Add medication with custom stock alert thresholds</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-96 overflow-y-auto">
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
                  <div className="flex gap-2">
                    <Select value={newProduct.category} onValueChange={(value) => setNewProduct({...newProduct, category: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="antibiotics">Antibiotics</SelectItem>
                        <SelectItem value="analgesics">Analgesics</SelectItem>
                        <SelectItem value="otc">OTC</SelectItem>
                        <SelectItem value="vitamins">Vitamins</SelectItem>
                        <SelectItem value="prescription">Prescription</SelectItem>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="icon" variant="outline" onClick={() => setQuickAddCategoryOpen(true)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
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
            </div>
            <DialogFooter>
              <Button onClick={() => {
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
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Dialog open={quickAddCategoryOpen} onOpenChange={setQuickAddCategoryOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
              <DialogDescription>Create a new product category</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Category name (e.g., Supplements)"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setQuickAddCategoryOpen(false); setNewCategoryName('') }}>
                Cancel
              </Button>
              <Button onClick={() => {
                if (newCategoryName.trim()) {
                  setCategories([...categories, newCategoryName.trim()])
                  setNewProduct({...newProduct, category: newCategoryName.trim()})
                  setQuickAddCategoryOpen(false)
                  setNewCategoryName('')
                }
              }} disabled={!newCategoryName.trim()}>
                Add Category
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>
      
      {/* Add missing state variable */}
      {selectedCategory === undefined && setSelectedCategory('all')}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Package className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{localInventory.length}</div>
            <p className="text-xs text-muted-foreground">Active inventory items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{localInventory.filter(item => item.stock <= item.minStock).length}</div>
            <p className="text-xs text-muted-foreground">Items need reorder</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {localInventory.filter(item => {
                const daysToExpiry = Math.ceil((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                return daysToExpiry <= 60
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">Within 60 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(localInventory.reduce((sum, item) => sum + (item.stock * item.price), 0)).toLocaleString()} RWF</div>
            <p className="text-xs text-muted-foreground">Inventory worth</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <QrCode className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button onClick={() => { setBulkMode(false); setBarcodeDialogOpen(true) }} className="w-full" size="sm">
              Generate Barcode
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Inventory Items</CardTitle>
                  <CardDescription>Manage your pharmacy stock levels</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="Pain Relief">Pain Relief</SelectItem>
                      <SelectItem value="Antibiotics">Antibiotics</SelectItem>
                      <SelectItem value="Vitamins">Vitamins</SelectItem>
                      <SelectItem value="Prescription">Prescription</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox />
                      </TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Expiry</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {localInventory
                      .filter(item => {
                        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            item.batchNumber.toLowerCase().includes(searchTerm.toLowerCase())
                        const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
                        return matchesSearch && matchesCategory
                      })
                      .map((item) => {
                        const stockStatus = getStockStatus(item.stock, item.minStock)
                        const expiryStatus = getExpiryStatus(item.expiryDate)
                        const stockPercentage = (item.stock / (item.maxStock || item.minStock * 3)) * 100
                        
                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <Checkbox />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                  <Package className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                  <div className="font-medium">{item.name}</div>
                                  <div className="text-sm text-muted-foreground">Batch: {item.batchNumber}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.category}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{item.stock}</span>
                                  <span className="text-sm text-muted-foreground">/ {item.minStock} min</span>
                                </div>
                                <Progress value={Math.min(stockPercentage, 100)} className="h-1" />
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{item.price.toLocaleString()} RWF</TableCell>
                            <TableCell>
                              <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={expiryStatus.variant}>{expiryStatus.label}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => {
                                    setEditProduct(item)
                                    setIsEditingProduct(true)
                                  }}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedProduct(item)
                                    setBarcodeDialogOpen(true)
                                  }}>
                                    <QrCode className="mr-2 h-4 w-4" />
                                    Generate Barcode
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-red-600" onClick={() => {
                                    setProductToDelete(item.id)
                                    setDeleteDialogOpen(true)
                                  }}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination */}
              <div className="flex items-center justify-between px-2 py-4">
                <div className="text-sm text-muted-foreground">
                  Showing 1 to 10 of {localInventory.length} products
                </div>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink isActive>1</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink>2</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="alerts" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Low Stock Alerts
                </CardTitle>
                <CardDescription>Items below minimum threshold</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {localInventory.filter(item => item.stock <= item.minStock).map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-red-200 bg-red-50">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                            <Package className="h-4 w-4 text-red-600" />
                          </div>
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-muted-foreground">{item.category}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-red-700">{item.stock} / {item.minStock}</div>
                          <Progress value={(item.stock / item.minStock) * 100} className="w-16 h-2 mt-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-amber-500" />
                  Expiring Items
                </CardTitle>
                <CardDescription>Products expiring within 60 days</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {localInventory.filter(item => {
                      const daysToExpiry = Math.ceil((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                      return daysToExpiry <= 60 && daysToExpiry > 0
                    }).map((item) => {
                      const daysToExpiry = Math.ceil((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                      return (
                        <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-amber-200 bg-amber-50">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                              <Calendar className="h-4 w-4 text-amber-600" />
                            </div>
                            <div>
                              <div className="font-medium">{item.name}</div>
                              <div className="text-sm text-muted-foreground">{item.category}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={daysToExpiry <= 30 ? 'destructive' : 'secondary'}>
                              {daysToExpiry} days
                            </Badge>
                            <div className="text-sm text-muted-foreground mt-1">Stock: {item.stock}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Stock by Category</CardTitle>
                <CardDescription>Inventory distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.stockByCategory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="stock" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Inventory Value Trend</CardTitle>
                <CardDescription>Monthly inventory worth</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analyticsData.inventoryTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value.toLocaleString()} RWF`, 'Value']} />
                      <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="actions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Stock Management</CardTitle>
                <CardDescription>Adjust and manage inventory levels</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" onClick={() => setAdjustmentDialogOpen(true)}>
                  Stock Adjustment
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setPurchaseDialogOpen(true)}>
                  Purchase Stock
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setTransferDialogOpen(true)}>
                  Stock Transfer
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Data Management</CardTitle>
                <CardDescription>Import and export inventory data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" onClick={exportToExcel}>
                  <Download className="mr-2 h-4 w-4" />
                  Export to Excel
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setIsImportDialogOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Import from Excel
                </Button>
                <Button variant="outline" className="w-full" onClick={downloadSample}>
                  Download Sample
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Barcode Tools</CardTitle>
                <CardDescription>Generate and print barcodes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" onClick={() => { setBulkMode(false); setBarcodeDialogOpen(true) }}>
                  <QrCode className="mr-2 h-4 w-4" />
                  Single Barcode
                </Button>
                <Button variant="outline" className="w-full" onClick={() => { setBulkMode(true); setBarcodeDialogOpen(true) }}>
                  Bulk Generate
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product from your inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProductToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDeleteProduct}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={adjustmentDialogOpen} onOpenChange={setAdjustmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stock Adjustment</DialogTitle>
            <DialogDescription>Adjust stock quantities for inventory corrections</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustmentDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAdjustment} disabled={!adjustmentForm.productId || !adjustmentForm.quantity || !adjustmentForm.reason}>
              Adjust Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Purchase Stock</DialogTitle>
            <DialogDescription>Add new stock through purchase</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
                <Button size="icon" variant="outline" onClick={() => setIsAddingSupplier(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPurchaseDialogOpen(false)}>Cancel</Button>
            <Button onClick={handlePurchase} disabled={!purchaseForm.productId || !purchaseForm.quantity || !purchaseForm.costPrice}>
              Purchase Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddingSupplier} onOpenChange={setIsAddingSupplier}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Supplier</DialogTitle>
            <DialogDescription>Create a new supplier for purchasing</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingSupplier(false)}>Cancel</Button>
            <Button onClick={handleAddSupplier} disabled={!newSupplier.name}>
              Add Supplier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={barcodeDialogOpen} onOpenChange={setBarcodeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Barcode</DialogTitle>
            <DialogDescription>Generate barcode for {selectedProduct?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {!bulkMode ? (
              <>
                <div className="space-y-2">
                  <Label>Select Medicine</Label>
                  <Select value={selectedProduct?.id || ''} onValueChange={(value) => {
                    const product = inventory.find(item => item.id === value)
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
              <Button variant="outline" onClick={() => { setBarcodeDialogOpen(false); setSelectedProducts([]) }} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={bulkMode ? printBulkBarcodes : printBarcode} 
                disabled={bulkMode ? selectedProducts.length === 0 : !selectedProduct} 
                className="flex-1"
              >
                {bulkMode ? `Print ${selectedProducts.length} Barcodes` : 'Print Barcode'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stock Transfer</DialogTitle>
            <DialogDescription>Transfer inventory between locations</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
              <Label>From Location</Label>
              <Select value={transferForm.fromLocation} onValueChange={(value) => setTransferForm({...transferForm, fromLocation: value})}>
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
            <div>
              <Label>To Location</Label>
              <Select value={transferForm.toLocation} onValueChange={(value) => setTransferForm({...transferForm, toLocation: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination" />
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleTransfer} disabled={!transferForm.productId || !transferForm.quantity || !transferForm.toLocation}>
              Transfer Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditingProduct} onOpenChange={setIsEditingProduct}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update product details</DialogDescription>
          </DialogHeader>
          {editProduct && (
            <div className="space-y-4">
              <div>
                <Label>Product Name</Label>
                <Input value={editProduct.name} disabled />
              </div>
              <div>
                <Label>Stock Quantity</Label>
                <Input 
                  type="number" 
                  value={editProduct.stock}
                  onChange={(e) => setEditProduct({...editProduct, stock: e.target.value})}
                />
              </div>
              <div>
                <Label>Selling Price (RWF)</Label>
                <Input 
                  type="number" 
                  value={editProduct.price}
                  onChange={(e) => setEditProduct({...editProduct, price: e.target.value})}
                />
              </div>
              <div>
                <Label>Minimum Stock Level</Label>
                <Input 
                  type="number" 
                  value={editProduct.minStock}
                  onChange={(e) => setEditProduct({...editProduct, minStock: e.target.value})}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingProduct(false)}>Cancel</Button>
            <Button onClick={handleEditProduct}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}