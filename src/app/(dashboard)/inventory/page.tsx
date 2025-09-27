'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Package, Plus, AlertTriangle, Calendar, Upload, Download, QrCode, Scan } from 'lucide-react'
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
  const [inventory, setInventory] = useState<InventoryItem[]>([])
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
  const [adjustmentForm, setAdjustmentForm] = useState({ productId: '', quantity: '', reason: '', type: 'increase' })
  const [purchaseForm, setPurchaseForm] = useState({ productId: '', quantity: '', costPrice: '', supplier: '' })
  const [suppliers, setSuppliers] = useState([])
  const [isAddingSupplier, setIsAddingSupplier] = useState(false)
  const [newSupplier, setNewSupplier] = useState({ name: '', contact: '', phone: '', email: '' })
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
    fetchInventory()
    fetchSuppliers()
  }, [])

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
      
      if (response.ok) {
        await fetchSuppliers()
        setIsAddingSupplier(false)
        setNewSupplier({ name: '', contact: '', phone: '', email: '' })
        alert('Supplier added successfully!')
      }
    } catch (error) {
      console.error('Error adding supplier:', error)
    }
  }

  const fetchInventory = async () => {
    try {
      const response = await fetch('/api/inventory')
      if (response.ok) {
        const data = await response.json()
        setInventory(data)
      }
    } catch (error) {
      console.error('Error fetching inventory:', error)
      setInventory([
        { id: '1', productCode: 'PAR500', name: 'Paracetamol 500mg', category: 'Pain Relief', classificationCode: 'N02BE01', barcode: '1234567890123', manufacturer: 'PharmaCorp', purchasePrice: 80, price: 100, stock: 100, minStock: 20, maxStock: 500, batchNumber: 'PAR001', expiryDate: '2025-12-31', trackByBatch: true, vatRate: 'A', stockLocation: 'main-store', notes: '' },
        { id: '2', productCode: 'AMX250', name: 'Amoxicillin 250mg', category: 'Antibiotics', classificationCode: 'J01CA04', barcode: '1234567890124', manufacturer: 'MediLab', purchasePrice: 320, price: 400, stock: 5, minStock: 10, maxStock: 200, batchNumber: 'AMX001', expiryDate: '2025-06-30', trackByBatch: true, vatRate: 'A', stockLocation: 'main-store', notes: 'Prescription required' }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleAddProduct = async () => {
    const product: InventoryItem = {
      id: Date.now().toString(),
      productCode: newProduct.productCode,
      name: newProduct.name,
      category: newProduct.category,
      classificationCode: newProduct.classificationCode,
      barcode: newProduct.barcode,
      manufacturer: newProduct.manufacturer,
      purchasePrice: parseFloat(newProduct.purchasePrice),
      price: parseFloat(newProduct.price),
      stock: parseInt(newProduct.stock),
      minStock: parseInt(newProduct.minStock),
      maxStock: newProduct.maxStock ? parseInt(newProduct.maxStock) : undefined,
      batchNumber: newProduct.batchNumber,
      expiryDate: newProduct.expiryDate,
      trackByBatch: newProduct.trackByBatch,
      vatRate: newProduct.vatRate,
      stockLocation: newProduct.stockLocation,
      notes: newProduct.notes
    }
    
    setInventory([...inventory, product])
    setIsAddingProduct(false)
    setNewProduct({ productCode: '', name: '', category: '', classificationCode: '', barcode: '', manufacturer: '', purchasePrice: '', price: '', stock: '', minStock: '', maxStock: '', batchNumber: '', expiryDate: '', trackByBatch: false, vatRate: 'A', stockLocation: 'main-store', notes: '' })
    alert('Product added successfully with stock alert threshold!')
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

  const confirmImport = () => {
    const importedItems: InventoryItem[] = previewData.map((row: any, index) => ({
      id: `imported-${Date.now()}-${index}`,
      name: row['Product Name'],
      category: row['Category'],
      stock: row['Stock'],
      minStock: row['Min Stock'],
      price: row['Price (RWF)'],
      expiryDate: row['Expiry Date'],
      batchNumber: row['Batch Number']
    }))
    
    setInventory([...inventory, ...importedItems])
    setPreviewData([])
    setValidationErrors([])
    setIsImportDialogOpen(false)
    alert(`Successfully imported ${importedItems.length} products!`)
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
    await fetch('/api/inventory/adjustment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        productId: adjustmentForm.productId, 
        quantity: parseInt(adjustmentForm.quantity), 
        reason: adjustmentForm.reason, 
        adjustmentType: adjustmentForm.type 
      })
    })
    setAdjustmentDialogOpen(false)
    setAdjustmentForm({ productId: '', quantity: '', reason: '', type: 'increase' })
    fetchInventory()
  }

  const handlePurchase = async () => {
    await fetch('/api/inventory/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        productId: purchaseForm.productId, 
        quantity: parseInt(purchaseForm.quantity), 
        costPrice: parseFloat(purchaseForm.costPrice), 
        supplier: purchaseForm.supplier 
      })
    })
    setPurchaseDialogOpen(false)
    setPurchaseForm({ productId: '', quantity: '', costPrice: '', supplier: '' })
    fetchInventory()
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

  if (loading) return <div className="p-6">Loading...</div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">Manage your pharmacy stock with automated alerts</p>
        </div>
        <div>
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Import Excel
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
              <Button>
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
                    placeholder="e.g. PAR500" 
                    value={newProduct.productCode}
                    onChange={(e) => setNewProduct({...newProduct, productCode: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Barcode</Label>
                  <Input 
                    placeholder="1234567890123" 
                    value={newProduct.barcode}
                    onChange={(e) => setNewProduct({...newProduct, barcode: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Product Name</Label>
                <Input 
                  placeholder="e.g. Paracetamol 500mg" 
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
                    placeholder="e.g. N02BE01" 
                    value={newProduct.classificationCode}
                    onChange={(e) => setNewProduct({...newProduct, classificationCode: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Manufacturer / Supplier</Label>
                <Input 
                  placeholder="e.g. PharmaCorp Ltd" 
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
                  placeholder="e.g. Store in cool, dry place" 
                  value={newProduct.notes}
                  onChange={(e) => setNewProduct({...newProduct, notes: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddProduct} disabled={!newProduct.productCode || !newProduct.name || !newProduct.category || !newProduct.stock || !newProduct.minStock}>
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

      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventory.length}</div>
            <div className="h-8 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[{v:inventory.length-5},{v:inventory.length-3},{v:inventory.length-1},{v:inventory.length},{v:inventory.length+2},{v:inventory.length}]}>
                  <Area type="monotone" dataKey="v" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.08} strokeWidth={1} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventory.filter(item => item.stock <= item.minStock).length}</div>
            <div className="h-8 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[{v:8},{v:6},{v:4},{v:3},{v:2},{v:inventory.filter(item => item.stock <= item.minStock).length}]}>
                  <Area type="monotone" dataKey="v" stroke="#ef4444" fill="#ef4444" fillOpacity={0.08} strokeWidth={1} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Calendar className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inventory.filter(item => {
                const daysToExpiry = Math.ceil((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                return daysToExpiry <= 60
              }).length}
            </div>
            <div className="h-8 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[{v:12},{v:10},{v:8},{v:6},{v:4},{v:inventory.filter(item => {
                  const daysToExpiry = Math.ceil((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                  return daysToExpiry <= 60
                }).length}]}>
                  <Area type="monotone" dataKey="v" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.08} strokeWidth={1} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(inventory.reduce((sum, item) => sum + (item.stock * item.price), 0)).toLocaleString()} RWF</div>
            <div className="h-8 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[{v:2800000},{v:3100000},{v:3350000},{v:3200000},{v:3400000},{v:inventory.reduce((sum, item) => sum + (item.stock * item.price), 0)}]}>
                  <Area type="monotone" dataKey="v" stroke="#10b981" fill="#10b981" fillOpacity={0.08} strokeWidth={1} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Barcode Generator</CardTitle>
            <QrCode className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Button onClick={() => { setBulkMode(false); setBarcodeDialogOpen(true) }} className="w-full" size="sm">
              Single Barcode
            </Button>
            <Button onClick={() => { setBulkMode(true); setBarcodeDialogOpen(true) }} variant="outline" className="w-full" size="sm">
              Bulk Generate
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Inventory Items</CardTitle>
              <CardDescription>Stock levels with automated alerts</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="bg-blue-50 hover:bg-blue-100 text-blue-700"
                onClick={() => alert('Stock Transfer - Transfer inventory between branches, track movements, and maintain stock levels across locations')}
              >
                <Package className="mr-2 h-4 w-4" />
                Stock Transfer
              </Button>
              <Button variant="outline" size="sm" onClick={() => setAdjustmentDialogOpen(true)}>
                Stock Adjustment
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPurchaseDialogOpen(true)}>
                Purchase Stock
              </Button>
              <Button size="sm" onClick={exportToExcel}>
                <Download className="mr-2 h-4 w-4" />
                Export Excel
              </Button>
              <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Upload className="mr-2 h-4 w-4" />
                    Import Excel
                  </Button>
                </DialogTrigger>
              </Dialog>
              <Dialog open={isAddingProduct} onOpenChange={setIsAddingProduct}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search by name, category, batch, or barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button size="icon" variant="outline">
                <Scan className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-4">
            {inventory.filter(item => 
              item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
              item.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
              item.id.toLowerCase().includes(searchTerm.toLowerCase())
            ).map((item) => {
              const stockStatus = getStockStatus(item.stock, item.minStock)
              const expiryStatus = getExpiryStatus(item.expiryDate)
              return (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Package className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.category} • Batch: {item.batchNumber}</p>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="flex space-x-2">
                      <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
                      <Badge variant={expiryStatus.variant}>Exp: {expiryStatus.label}</Badge>
                    </div>
                    <p className="text-sm">Stock: {item.stock} (Min: {item.minStock})</p>
                    <p className="text-sm text-muted-foreground">{item.price.toLocaleString()} RWF</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sales by Insurance Provider</CardTitle>
            <CardDescription>Total sales value by insurance company</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[
                  { insurance: 'RSSB', sales: 2500000 },
                  { insurance: 'MMI', sales: 1800000 },
                  { insurance: 'Radiant', sales: 1200000 },
                  { insurance: 'SANLAM', sales: 950000 },
                  { insurance: 'RAMA', sales: 3200000 },
                  { insurance: 'Cash', sales: 1600000 }
                ]} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <XAxis dataKey="insurance" axisLine={false} tickLine={false} className="text-xs" />
                  <YAxis axisLine={false} tickLine={false} className="text-xs" />
                  <Tooltip formatter={(value) => [`${value.toLocaleString()} RWF`, 'Sales Value']} />
                  <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stock by Category</CardTitle>
            <CardDescription>Current inventory distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { category: 'Pain Relief', stock: 320, value: 1200000 },
                  { category: 'Antibiotics', stock: 180, value: 850000 },
                  { category: 'Vitamins', stock: 240, value: 650000 },
                  { category: 'Prescription', stock: 150, value: 2100000 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [name === 'stock' ? `${value} items` : `${value.toLocaleString()} RWF`, name === 'stock' ? 'Stock Quantity' : 'Total Value']} />
                  <Bar dataKey="stock" fill="#10b981" name="stock" maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

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
    </div>
  )
}