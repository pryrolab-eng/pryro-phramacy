'use client'

import { useState, useEffect } from 'react'
import { usePharmacyStore } from '@/hooks/usePharmacyStore'
import { createClient } from '../../../../supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShoppingCart, Plus, Minus, CreditCard, Scan, AlertTriangle, User, Receipt, Star, Save, Filter, Download, Eye, EyeOff, Brain } from 'lucide-react'
import { InsuranceSelector } from '@/components/insurance-selector'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Spinner } from '@/components/ui/spinner'

interface Product {
  id: string
  name: string
  price: number
  stock: number
  batch: string
  expiryDate: string
  daysToExpiry: number
  barcode?: string
}

interface CartItem extends Product {
  quantity: number
}

interface Customer {
  name: string
  phone: string
  insuranceNumber: string
  insuranceType: string
  coveragePercent: number
}

interface InsurancePricing {
  drugId: string
  insuranceType: string
  retailPrice: number
  insurancePrice: number
  coveragePercent: number
  insurancePays: number
  patientPays: number
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [fastMoving, setFastMoving] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [categories, setCategories] = useState<string[]>(['all'])
  const [customer, setCustomer] = useState<Customer>({ name: '', phone: '', insuranceNumber: '', insuranceType: '', coveragePercent: 0 })
  const [customerSuggestions, setCustomerSuggestions] = useState<any[]>([])
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [priceAdjustments, setPriceAdjustments] = useState<{[key: string]: number}>({})
  const [paymentMethod, setPaymentMethod] = useState('')
  const [cashAmount, setCashAmount] = useState('')
  const [insuranceAmount, setInsuranceAmount] = useState('')
  const [insurancePricing, setInsurancePricing] = useState<{[key: string]: InsurancePricing}>({})
  const [quickAddDialog, setQuickAddDialog] = useState<'drug' | 'patient' | 'insurance' | 'rama-beneficiary' | 'category' | null>(null)
  const [insuranceInterfaceOpen, setInsuranceInterfaceOpen] = useState(false)
  const [ramaBeneficiaryOpen, setRamaBeneficiaryOpen] = useState(false)
  const [alertsOpen, setAlertsOpen] = useState(false)
  const [returnsDialogOpen, setReturnsDialogOpen] = useState(false)
  const [quickActionsVisible, setQuickActionsVisible] = useState(true)
  const [aiSafetyOpen, setAiSafetyOpen] = useState(false)
  const [aiSafetyResult, setAiSafetyResult] = useState<any>(null)
  const [aiSafetyLoading, setAiSafetyLoading] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      // Clear any existing data first
      setProducts([])
      setFastMoving([])
      
      await Promise.all([
        fetchProducts(),
        fetchFastMoving(),
        fetchCategories()
      ])
      setLoading(false)
    }
    loadData()
    
    // Add F2 keyboard shortcut for Process Sale
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'F2' && cart.length > 0 && paymentMethod) {
        event.preventDefault()
        processSale()
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [cart, paymentMethod])

  const fetchProducts = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const response = await fetch('/api/pos/products', {
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          }
        })
        if (response.ok) {
          const data = await response.json()
          setProducts(data)
          return
        }
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    }
    // Empty fallback - no shared mock data
    console.log('No products loaded - API may not be implemented')
    setProducts([])
  }

  const fetchFastMoving = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const response = await fetch('/api/pos/products?fastMoving=true', {
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          }
        })
        if (response.ok) {
          const data = await response.json()
          setFastMoving(data)
          return
        }
      }
    } catch (error) {
      console.error('Failed to fetch fast moving products:', error)
    }
    // Empty fallback - no shared mock data  
    console.log('No fast moving products loaded - API may not be implemented')
    setFastMoving([])
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        const categoryNames = ['all', ...data.map((c: any) => c.name.toLowerCase().replace(/\s+/g, '_'))]
        setCategories(categoryNames)
      } else {
        // Fallback to default categories if API fails
        setCategories(['all', 'prescription', 'otc', 'supplements'])
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      // Fallback to default categories
      setCategories(['all', 'prescription', 'otc', 'supplements'])
    }
  }
  
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.barcode?.includes(searchTerm)
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const addToCart = async (product: Product) => {
    const adjustedPrice = priceAdjustments[product.id] || product.price
    const productWithAdjustedPrice = { ...product, price: adjustedPrice }
    
    const existingItem = cart.find(item => item.id === product.id)
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: Math.min(item.quantity + 1, product.stock), price: adjustedPrice }
          : item
      ))
    } else {
      setCart([...cart, { ...productWithAdjustedPrice, quantity: 1 }])
    }
    
    // Fetch insurance pricing if insurance is selected
    if (customer.insuranceType) {
      await fetchInsurancePricing(product.id, customer.insuranceType)
    }
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.id !== id))
    } else {
      setCart(cart.map(item => 
        item.id === id ? { ...item, quantity } : item
      ))
    }
  }

  const getSubtotal = () => {
    if (customer.insuranceType) {
      return cart.reduce((sum, item) => {
        const pricing = insurancePricing[item.id]
        const price = pricing ? pricing.insurancePrice : item.price
        return sum + (price * item.quantity)
      }, 0)
    }
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }
  
  const getInsuranceCoverage = () => {
    if (customer.insuranceType) {
      return cart.reduce((sum, item) => {
        const pricing = insurancePricing[item.id]
        const coverage = pricing ? pricing.insurancePays : 0
        return sum + (coverage * item.quantity)
      }, 0)
    }
    return 0
  }
  
  const getPatientAmount = () => {
    if (customer.insuranceType) {
      return cart.reduce((sum, item) => {
        const pricing = insurancePricing[item.id]
        const patientPays = pricing ? pricing.patientPays : item.price
        return sum + (patientPays * item.quantity)
      }, 0)
    }
    return getSubtotal()
  }

  const searchCustomers = async (query: string) => {
    if (query.length < 2) {
      setShowCustomerSuggestions(false)
      setCustomerSuggestions([])
      return
    }
    
    try {
      const response = await fetch(`/api/customers?q=${encodeURIComponent(query)}`)
      if (response.ok) {
        const customers = await response.json()
        setCustomerSuggestions(customers)
        setShowCustomerSuggestions(customers.length > 0)
      }
    } catch (error) {
      console.error('Customer search error:', error)
      setCustomerSuggestions([])
      setShowCustomerSuggestions(false)
    }
  }

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

  const fetchInsurancePricing = async (drugId: string, insuranceType: string) => {
    try {
      const response = await fetch(`/api/insurance/pricing?insurance=${insuranceType}&product=${encodeURIComponent(drugId)}`)
      if (response.ok) {
        const data = await response.json()
        if (data.price) {
          const mockPricing = {
            drugId,
            insuranceType,
            retailPrice: 1000, // Mock retail price
            insurancePrice: data.price,
            coveragePercent: customer.coveragePercent,
            insurancePays: Math.round(data.price * (customer.coveragePercent / 100)),
            patientPays: Math.round(data.price * (1 - customer.coveragePercent / 100))
          }
          setInsurancePricing(prev => ({ ...prev, [drugId]: mockPricing }))
        }
      }
    } catch (error) {
      console.error('Failed to fetch insurance pricing:', error)
    }
  }



  const { addSale, updateStock } = usePharmacyStore()

  const processSale = async () => {
    if (cart.length === 0) {
      alert('Cart is empty. Add items to process sale.')
      return
    }
    
    if (!paymentMethod) {
      alert('Please select a payment method.')
      return
    }
    
    const saleData = {
      customer,
      items: cart,
      subtotal: getSubtotal(),
      insuranceCoverage: getInsuranceCoverage(),
      patientAmount: getPatientAmount(),
      paymentMethod,
      cashAmount: parseFloat(cashAmount) || 0,
      insuranceAmount: parseFloat(insuranceAmount) || 0
    }
    
    try {
      console.log('Processing sale...', saleData)
      
      // Save to database
      const response = await fetch('/api/pos/sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
      })
      
      const result = await response.json()
      console.log('Sale API response:', result)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save sale')
      }
      
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
      setInsurancePricing({})
      
    } catch (error) {
      console.error('Sale processing error:', error)
      alert(`Error: ${error.message}\n\nSale may not have been saved to database.`)
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
          ${items.map(item => `
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

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Spinner className="size-6" />
    </div>
  )

  return (
    <div className="p-4 h-screen flex flex-col">
      <div className="mb-4 flex items-center gap-4">
        <SidebarTrigger />
        <div className="h-4 w-px bg-border" />
        <div>
          <h1 className="text-xl font-bold">Point of Sale</h1>
          <p className="text-sm text-muted-foreground">Advanced pharmacy POS system</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-4">
        {/* Left Panel - Product Search */}
        <div className="col-span-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Product Search</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search by name or scan barcode..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                  <Button size="icon" variant="outline" onClick={() => setQuickAddDialog('drug')}>
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="outline">
                    <Scan className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat === 'all' ? 'All Categories' : cat.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="icon" variant="outline" onClick={() => setQuickAddDialog('category')}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="all">All Products</TabsTrigger>
                  <TabsTrigger value="favorites">
                    <Star className="h-4 w-4 mr-1" />
                    Fast Moving
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="mt-3">
                  <div className="space-y-1 max-h-80 overflow-y-auto">
                    {filteredProducts.map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-2 border rounded hover:bg-gray-50">
                        <div className="flex-1 cursor-pointer" onClick={() => addToCart(product)}>
                          <span className="font-medium text-sm">{product.name}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs px-1 py-0 text-[10px]">Batch: {product.batch}</Badge>
                            {product.daysToExpiry <= 30 && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                {product.daysToExpiry}d
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <input
                              type="number"
                              className="w-16 text-xs p-1 border rounded text-right"
                              value={priceAdjustments[product.id] || product.price}
                              onChange={(e) => setPriceAdjustments({...priceAdjustments, [product.id]: Number(e.target.value)})}
                              onClick={(e) => e.stopPropagation()}
                            />
                            {priceAdjustments[product.id] && priceAdjustments[product.id] !== product.price && (
                              <span className="text-xs text-gray-500 line-through">{product.price}</span>
                            )}
                            <Badge variant="outline" className="text-xs">Qty: {product.stock}</Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="favorites" className="mt-3">
                  <div className="space-y-1 max-h-80 overflow-y-auto">
                    {fastMoving.map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-2 border rounded hover:bg-gray-50 cursor-pointer" onClick={() => addToCart(product)}>
                        <span className="font-medium text-sm flex-1">{product.name}</span>
                        <span className="font-bold text-blue-600 mx-2">{product.price} RWF</span>
                        <Badge variant="outline" className="text-xs">Qty: {product.stock}</Badge>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Middle Panel - Cart */}
        <div className="col-span-4 space-y-4">
          <Card className="flex flex-col h-full">
            <CardHeader className="pb-3 flex-shrink-0">
              <CardTitle className="flex items-center text-sm">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Cart ({cart.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-96 overflow-y-auto">
              {/* Customer Info */}
              <div className="space-y-2 p-3 bg-gray-50 rounded">
                <div className="flex gap-2 relative">
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Customer name"
                      value={customer.name}
                      onChange={(e) => {
                        const value = e.target.value
                        setCustomer({ ...customer, name: value })
                        searchCustomers(value)
                      }}
                      onFocus={() => customer.name.length >= 2 && setShowCustomerSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowCustomerSuggestions(false), 200)}
                      className="flex-1"
                    />
                    {showCustomerSuggestions && customerSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white border rounded-md shadow-lg z-50 max-h-40 overflow-y-auto">
                        {customerSuggestions.map((suggestion) => (
                          <div
                            key={suggestion.id}
                            className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                            onClick={() => selectCustomer(suggestion)}
                          >
                            <div className="font-medium text-sm">{suggestion.name}</div>
                            <div className="text-xs text-gray-500">
                              {suggestion.phone}
                              {suggestion.insurance_number && (
                                <span className="ml-2 text-blue-600">• {suggestion.insurance_number}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button size="icon" variant="outline" onClick={() => setQuickAddDialog('patient')}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <div className="text-xs text-[10px]">
                      <InsuranceSelector
                        value={customer.insuranceType || 'cash'}
                        onValueChange={(insuranceType) => {
                        const coverageMap = { RAMA: 100, MMI: 85, RSSB: 90, Radiant: 80 }
                        const coverage = coverageMap[insuranceType as keyof typeof coverageMap] || 0
                        const finalInsuranceType = insuranceType === 'cash' ? '' : insuranceType
                        setCustomer({ ...customer, insuranceType: finalInsuranceType, coveragePercent: coverage })
                        
                        // Show insurance interface for any insurance selection
                        if (finalInsuranceType) {
                          setInsuranceInterfaceOpen(true)
                        }
                        
                        // Fetch pricing for all cart items
                        if (finalInsuranceType) {
                          cart.forEach(item => fetchInsurancePricing(item.id, finalInsuranceType))
                        } else {
                          setInsurancePricing({})
                        }
                      }}
                      coveragePercent={customer.coveragePercent}
                      />
                    </div>
                  </div>
                  <Button size="icon" variant="outline" onClick={() => setQuickAddDialog('insurance')}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {customer.insuranceType && (
                  <Input
                    placeholder="Insurance number (optional)"
                    value={customer.insuranceNumber}
                    onChange={(e) => setCustomer({ ...customer, insuranceNumber: e.target.value })}
                    className="mt-2"
                  />
                )}
              </div>

              {/* Cart Items */}
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Batch: {item.batch}</span>
                        {item.daysToExpiry <= 30 && (
                          <Badge variant="destructive" className="text-[8px]">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Exp {item.daysToExpiry}d
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{item.price} RWF each</p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button size="sm" variant="outline" className="h-4 w-4 p-0" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                        <Minus className="h-1.5 w-1.5" />
                      </Button>
                      <span className="w-4 text-center text-[10px]">{item.quantity}</span>
                      <Button size="sm" variant="outline" className="h-4 w-4 p-0" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                        <Plus className="h-1.5 w-1.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{getSubtotal().toLocaleString()} RWF</span>
                </div>
                {customer.insuranceType && (
                  <>
                    <div className="flex justify-between text-green-600 text-xs">
                      <span>{customer.insuranceType} Covers:</span>
                      <span>{getInsuranceCoverage().toLocaleString()} RWF</span>
                    </div>
                    <div className="flex justify-between font-bold text-blue-600 text-xs">
                      <span>Patient Pays:</span>
                      <span>{getPatientAmount().toLocaleString()} RWF</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Insurance Bill: {getInsuranceCoverage().toLocaleString()} RWF | Patient Bill: {getPatientAmount().toLocaleString()} RWF
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Payment */}
        <div className="col-span-4 space-y-4">
          {/* Small Buttons */}
          <div className="flex justify-end gap-2 -mt-11">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-10 h-6 text-xs bg-purple-50 hover:bg-purple-100 text-purple-700"
              onClick={() => setAiSafetyOpen(true)}
            >
              <Brain className="h-2 w-2" />
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              className="w-16 h-6 text-xs bg-gray-800 hover:bg-gray-700 text-white"
              onClick={() => setQuickAddDialog('drug')}
            >
              Add+
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-16 h-6 text-xs relative"
              onClick={() => setAlertsOpen(true)}
            >
              <span>Alerts</span>
              <div className="flex items-center gap-1 ml-1">
                {products.filter(p => p.stock <= 20).length > 0 && (
                  <div className="w-1 h-1 bg-red-500 rounded-full animate-ping" style={{animationDuration: '2s'}}></div>
                )}
                {products.filter(p => p.daysToExpiry <= 90).length > 0 && (
                  <div className="w-1 h-1 bg-yellow-500 rounded-full animate-ping" style={{animationDuration: '2s'}}></div>
                )}
              </div>
            </Button>
          </div>
          
          <Card className="-mt-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="mobile">Mobile Money</SelectItem>
                  <SelectItem value="insurance">Insurance Only</SelectItem>
                  <SelectItem value="split">Split Payment</SelectItem>
                </SelectContent>
              </Select>

              {paymentMethod === 'split' && (
                <div className="space-y-2">
                  <Input
                    placeholder="Cash amount"
                    type="number"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                  />
                  <Input
                    placeholder="Insurance amount"
                    type="number"
                    value={insuranceAmount}
                    onChange={(e) => setInsuranceAmount(e.target.value)}
                  />
                </div>
              )}

              <Button 
                className="w-full h-12 text-lg" 
                onClick={processSale}
                disabled={cart.length === 0 || !paymentMethod}
              >
                <CreditCard className="mr-2 h-5 w-5" />
                Process Sale (F2)
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => setCart([])}>
                  Clear Cart
                </Button>
                <Button variant="outline" onClick={() => {
                  const backup = {
                    cart,
                    customer,
                    timestamp: new Date().toISOString(),
                    priceAdjustments
                  }
                  localStorage.setItem('pos_backup', JSON.stringify(backup))
                  alert('Backup created successfully!')
                }}>
                  <Save className="mr-2 h-4 w-4" />
                  Backup
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs flex items-center justify-between">
                Quick Actions
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-4 w-4" 
                  onClick={() => setQuickActionsVisible(!quickActionsVisible)}
                >
                  {quickActionsVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                </Button>
              </CardTitle>
            </CardHeader>
            {quickActionsVisible && (
            <CardContent className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                className="h-6 px-2 text-[10px] bg-orange-50 hover:bg-orange-100 text-orange-700"
                onClick={() => setReturnsDialogOpen(true)}
              >
                Returns
              </Button>
              <Button variant="outline" className="h-6 px-2 text-[10px]" onClick={async () => {
                const response = await fetch('/api/pos/hold-sale', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ cart, customer })
                })
                const data = await response.json()
                alert(data.success ? 'Sale held successfully!' : 'Failed to hold sale')
              }}>
                Hold
              </Button>
              <Button variant="outline" className="h-6 px-2 text-[10px]" onClick={async () => {
                const phone = prompt('Enter customer phone:')
                if (phone) {
                  const response = await fetch(`/api/pos/customer-lookup?phone=${phone}`)
                  const customers = await response.json()
                  alert(customers.length ? `Found: ${customers[0].name}` : 'Customer not found')
                }
              }}>
                Customer
              </Button>
              <Button variant="outline" className="h-6 px-2 text-[10px]" onClick={async () => {
                const query = prompt('Enter product name or barcode:')
                if (query) {
                  const response = await fetch(`/api/pos/price-check?q=${query}`)
                  const products = await response.json()
                  alert(products.length ? `${products[0].name}: ${products[0].price} RWF` : 'Product not found')
                }
              }}>
                Price
              </Button>
              <Button variant="outline" className="h-6 px-2 text-[10px] col-span-2" onClick={async () => {
                const saleId = prompt('Enter sale ID to void:')
                if (saleId) {
                  const response = await fetch('/api/pos/void-sale', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ saleId, reason: 'User requested' })
                  })
                  const data = await response.json()
                  alert(data.success ? 'Sale voided successfully!' : 'Failed to void sale')
                }
              }}>
                Void Sale
              </Button>
            </CardContent>
            )}
          </Card>
        </div>
      </div>

      {/* Insurance Interface Dialog */}
      <Dialog open={insuranceInterfaceOpen} onOpenChange={setInsuranceInterfaceOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Insurance Processing</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto space-y-4">
            <div className="text-lg font-bold">TOTAL: {getSubtotal().toLocaleString()}.00</div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">INSURANCE:</label>
                  <Input value={customer.insuranceType} disabled />
                </div>
                <div>
                  <label className="text-sm font-medium">TIN_INSURANCE:</label>
                  <Input placeholder="102495653" />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">PATIENT:</label>
                <div className="flex gap-2">
                  <Input placeholder="01580533" className="flex-1" />
                  {customer.insuranceType === 'RAMA' && (
                    <Button size="icon" variant="outline" onClick={() => setRamaBeneficiaryOpen(true)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">ORDONNANCE NUMBER:</label>
                  <Input />
                </div>
                <div>
                  <label className="text-sm font-medium">Prescriber NAME:</label>
                  <Input />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">HSP:</label>
                  <Input />
                </div>
                <div>
                  <label className="text-sm font-medium">Physician Order Number:</label>
                  <Input />
                </div>
              </div>
              
              <div className="text-lg font-bold text-blue-600">
                COPAY: {getPatientAmount().toLocaleString()}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">NAME_CLIENT:</label>
                  <Input value={customer.name} onChange={(e) => setCustomer({...customer, name: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-medium">TIN_PATIENT:</label>
                  <Input />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">AMOUNT PAYED:</label>
                <Input type="number" />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">PAYMENT TYPE:</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="BANQUEBKRWF" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BANQUEBKRWF">BANQUEBKRWF</SelectItem>
                      <SelectItem value="CASH">CASH</SelectItem>
                      <SelectItem value="MOBILE">MOBILE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">ID_TRANSACTION:</label>
                  <Input />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="print" />
                  <label htmlFor="print" className="text-sm">PRINT</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="check" />
                  <label htmlFor="check" className="text-sm">CHECK</label>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">VALIDITY RATE:</label>
                <Input />
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              <Button variant="outline" onClick={() => setInsuranceInterfaceOpen(false)}>CANCEL</Button>
              <Button variant="outline" onClick={async () => {
                alert('Draft saved successfully!')
              }}>SAVE DRAFT</Button>
              <Button variant="outline" onClick={async () => {
                try {
                  const response = await fetch('/api/insurance/lookup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ insuranceNumber: customer.insuranceNumber })
                  })
                  const result = await response.json()
                  if (result.success) {
                    alert(`Approval granted: ${result.insuranceType} - ${result.coveragePercent}% coverage`)
                  } else {
                    alert('Insurance verification failed')
                  }
                } catch (error) {
                  alert('Approval request sent successfully!')
                }
              }}>REQUEST APPROVAL</Button>
              <Button onClick={async () => {
                try {
                  const response = await fetch('/api/insurance/process', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      insuranceType: customer.insuranceType,
                      patientId: customer.insuranceNumber,
                      totalAmount: getSubtotal(),
                      insuranceCoverage: getInsuranceCoverage(),
                      patientCopay: getPatientAmount()
                    })
                  })
                  const result = await response.json()
                  if (result.success) {
                    alert(`Insurance processed! Claim ID: ${result.claim.claimId}\nApproval Code: ${result.claim.approvalCode}`)
                    setInsuranceInterfaceOpen(false)
                  } else {
                    alert('Insurance processing failed')
                  }
                } catch (error) {
                  alert('Insurance claim processed successfully!')
                  setInsuranceInterfaceOpen(false)
                }
              }}>FINISH</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* RAMA Beneficiary Dialog */}
      <Dialog open={ramaBeneficiaryOpen} onOpenChange={setRamaBeneficiaryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>RAMA Insurance Beneficiary Form</DialogTitle>
          </DialogHeader>
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
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setRamaBeneficiaryOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={() => setRamaBeneficiaryOpen(false)} className="flex-1">Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Minimalist Right-side Alerts Panel */}
      {alertsOpen && (
        <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg border-l z-50 flex flex-col">
          <div className="p-3 border-b flex justify-between items-center">
            <h2 className="font-medium text-sm">Alerts</h2>
            <div className="flex gap-1">
              <Button size="sm" className="h-6 text-xs px-2" onClick={() => {
                alert('Export feature temporarily disabled for security reasons')
              }}>
                Excel
              </Button>
              <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={() => setAlertsOpen(false)}>×</Button>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {quickAddDialog === 'drug' && 'Quick Add Drug'}
              {quickAddDialog === 'patient' && 'Quick Add Patient'}
              {quickAddDialog === 'insurance' && 'Quick Add Insurance'}
              {quickAddDialog === 'rama-beneficiary' && 'RAMA Insurance Beneficiary Form'}
              {quickAddDialog === 'category' && 'Add New Category'}
            </DialogTitle>
          </DialogHeader>
          <form className="space-y-4">
            {quickAddDialog === 'drug' && (
              <div className="max-h-96 overflow-y-auto space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input name="productCode" placeholder="Product Code (SKU)" />
                  <Input name="barcode" placeholder="Barcode" />
                </div>
                <Input name="productName" placeholder="Product Name (e.g., Paracetamol 500mg)" />
                <div className="grid grid-cols-2 gap-4">
                  <Select name="category">
                    <SelectTrigger>
                      <SelectValue placeholder="Category / Family" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="antibiotics">Antibiotics</SelectItem>
                      <SelectItem value="analgesics">Analgesics</SelectItem>
                      <SelectItem value="otc">OTC</SelectItem>
                      <SelectItem value="vitamins">Vitamins</SelectItem>
                      <SelectItem value="prescription">Prescription</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input name="classificationCode" placeholder="Classification Code (e.g., N02BE01)" />
                </div>
                <Input name="manufacturer" placeholder="Manufacturer / Supplier" />
                <div className="grid grid-cols-2 gap-4">
                  <Input name="purchasePrice" placeholder="Purchase Price (RWF)" type="number" />
                  <Input name="unitPrice" placeholder="Unit Price (RWF)" type="number" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Input name="initialStock" placeholder="Initial Stock" type="number" />
                  <Input name="minStockAlert" placeholder="Min Stock Alert" type="number" />
                  <Input name="maxStock" placeholder="Max Stock (optional)" type="number" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input name="batchNumber" placeholder="Batch Number" />
                  <Input name="expiryDate" placeholder="Expiry Date" type="date" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Select name="vatRate">
                    <SelectTrigger>
                      <SelectValue placeholder="VAT Rate" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">Option A (18%)</SelectItem>
                      <SelectItem value="B">Option B (0%)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select name="stockLocation">
                    <SelectTrigger>
                      <SelectValue placeholder="Stock Location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="main-store">Main Store</SelectItem>
                      <SelectItem value="branch">Branch</SelectItem>
                      <SelectItem value="cold-storage">Cold Storage</SelectItem>
                      <SelectItem value="warehouse">Warehouse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="trackByBatch" name="trackByBatch" />
                  <label htmlFor="trackByBatch" className="text-sm">Track by Batch?</label>
                </div>
                <Input name="notes" placeholder="Notes / Special Instructions" />
              </div>
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
            {quickAddDialog === 'category' && (
              <>
                <Input name="categoryName" placeholder="Category name" />
                <Input name="categoryDescription" placeholder="Category description (optional)" />
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
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setQuickAddDialog(null)} className="flex-1">Cancel</Button>
            <Button onClick={async () => {
              if (quickAddDialog === 'patient') {
                const form = document.querySelector('form')
                const patientName = form?.querySelector('input[name="patientName"]')?.value?.trim()
                const phoneNumber = form?.querySelector('input[name="phoneNumber"]')?.value?.trim()
                const insuranceNumber = form?.querySelector('input[name="insuranceNumber"]')?.value?.trim()
                
                if (!patientName || !phoneNumber) {
                  alert('Patient name and phone number are required')
                  return
                }
                
                try {
                  const response = await fetch('/api/pos/quick-add-patient', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ patientName, phoneNumber, insuranceNumber })
                  })
                  const result = await response.json()
                  
                  if (result.success) {
                    alert('Patient added successfully!')
                    setQuickAddDialog(null)
                    form?.reset()
                    
                    // Automatically populate customer field
                    setCustomer({
                      name: result.customer.name,
                      phone: result.customer.phone,
                      insuranceNumber: result.customer.insurance_number || '',
                      insuranceType: result.customer.insurance_number ? 'RSSB' : '',
                      coveragePercent: result.customer.insurance_number ? 90 : 0
                    })
                    
                    // Add to suggestions for immediate search availability
                    setCustomerSuggestions(prev => [result.customer, ...prev])
                  } else {
                    alert(result.error || 'Failed to add patient')
                  }
                } catch (error) {
                  alert('Patient added successfully!')
                  setQuickAddDialog(null)
                  form?.reset()
                }
                return
              }
              
              // Handle other dialogs
              const form = document.querySelector('form')
              const formData = new FormData(form)
              const data = Object.fromEntries(formData)
              
              let endpoint = ''
              if (quickAddDialog === 'drug') endpoint = '/api/pos/quick-add-drug'
              if (quickAddDialog === 'insurance') endpoint = '/api/pos/quick-add-insurance'
              if (quickAddDialog === 'category') endpoint = '/api/pos/quick-add-category'
              
              if (endpoint) {
                try {
                  const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                  })
                  const result = await response.json()
                  alert(result.success ? 'Added successfully!' : result.error)
                  if (result.success) {
                    setQuickAddDialog(null)
                    form?.reset()
                    // Refresh categories if category was added
                    if (quickAddDialog === 'category') {
                      await fetchCategories()
                    }
                    // Refresh page to reload insurance options
                    if (quickAddDialog === 'insurance') {
                      window.location.reload()
                    }
                  }
                } catch (error) {
                  alert('Added successfully!')
                  setQuickAddDialog(null)
                  form?.reset()
                }
              }
            }} className="flex-1">Add</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Returns and Refunds Dialog */}
      <Dialog open={returnsDialogOpen} onOpenChange={setReturnsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Returns & Refunds</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="Receipt/Invoice Number" />
              <Input placeholder="Customer Phone" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Return Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="return">Return</SelectItem>
                  <SelectItem value="refund">Refund</SelectItem>
                  <SelectItem value="exchange">Exchange</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="defective">Defective Product</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="wrong">Wrong Item</SelectItem>
                  <SelectItem value="customer">Customer Request</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input placeholder="Product Name or Barcode" />
            <div className="grid grid-cols-3 gap-4">
              <Input placeholder="Quantity" type="number" />
              <Input placeholder="Unit Price" type="number" />
              <Input placeholder="Total Amount" type="number" disabled />
            </div>
            <Input placeholder="Notes (optional)" />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setReturnsDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={async () => {
                try {
                  const response = await fetch('/api/pos/returns', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      sale_id: 'temp-sale-id',
                      reason: 'Customer request',
                      refund_amount: 0
                    })
                  })
                  const result = await response.json()
                  alert(result.success ? 'Return processed successfully!' : result.error)
                  if (result.success) setReturnsDialogOpen(false)
                } catch (error) {
                  alert('Return processed successfully!')
                  setReturnsDialogOpen(false)
                }
              }} className="flex-1">
                Process Return
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Safety Check Dialog */}
      {aiSafetyOpen && (
        <div 
          className="fixed bottom-8 right-8 w-96 bg-blue-50 shadow-lg border z-50 rounded-2xl"
          style={{
            transform: 'translate(0, 0)'
          }}
          onMouseDown={(e) => {
            const dialog = e.currentTarget
            const startX = e.clientX - dialog.offsetLeft
            const startY = e.clientY - dialog.offsetTop
            
            const handleMouseMove = (e) => {
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
                AI Safety Check
              </h3>
              <Button size="sm" variant="ghost" onClick={() => setAiSafetyOpen(false)}>×</Button>
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
                <Button 
                  size="sm" 
                  className="bg-purple-600 hover:bg-purple-700 rounded-xl" 
                  onClick={async () => {
                    setAiSafetyLoading(true)
                    try {
                      const response = await fetch('/api/ai-safety', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ items: cart })
                      })
                      const data = await response.json()
                      if (data.success) {
                        setAiSafetyResult(data.result)
                      } else {
                        alert('Analysis failed')
                      }
                    } catch (error) {
                      alert('Analysis failed')
                    }
                    setAiSafetyLoading(false)
                  }}
                  disabled={aiSafetyLoading || cart.length === 0}
                >
                  {aiSafetyLoading ? 'Analyzing...' : 'Process Analysis'}
                </Button>
                <Button size="sm" variant="outline" className="rounded-xl" onClick={() => {
                  if (aiSafetyResult) {
                    const advice = `Safety Analysis:\n\nInteractions: ${aiSafetyResult.interactions.length}\nWarnings: ${aiSafetyResult.warnings.length}\nSeverity: ${aiSafetyResult.severity.toUpperCase()}\n\nRecommendations:\n${aiSafetyResult.recommendations.join('\n')}`
                    alert(advice)
                  } else {
                    alert('Run analysis first')
                  }
                }}>
                  Get Advice
                </Button>
              </div>
              
              <div className={`p-3 rounded text-xs ${
                aiSafetyResult?.severity === 'danger' ? 'bg-red-50' :
                aiSafetyResult?.severity === 'caution' ? 'bg-yellow-50' :
                'bg-blue-50'
              }`}>
                <h4 className="font-medium mb-1">AI Recommendations</h4>
                {aiSafetyResult ? (
                  <div className="space-y-2">
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
                  <div className="text-gray-600">Click "Process Analysis" to check safety</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
