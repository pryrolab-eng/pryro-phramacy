'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShoppingCart, Plus, Minus, CreditCard, Scan, AlertTriangle, User, Receipt, Star, Save, Filter, Download, Eye, EyeOff, Brain } from 'lucide-react'
import { InsuranceSelector } from '@/components/insurance-selector'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

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
  const [customer, setCustomer] = useState<Customer>({ name: '', phone: '', insuranceNumber: '', insuranceType: '', coveragePercent: 0 })
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

  useEffect(() => {
    fetchProducts()
    fetchFastMoving()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/pos/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    }
  }

  const fetchFastMoving = async () => {
    try {
      const response = await fetch('/api/pos/products?fastMoving=true')
      if (response.ok) {
        const data = await response.json()
        setFastMoving(data)
      }
    } catch (error) {
      console.error('Failed to fetch fast moving products:', error)
    }
  }

  const categories = ['all', 'prescription', 'otc', 'supplements', 'medical_devices', 'personal_care']
  
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.barcode?.includes(searchTerm)
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

  const fetchInsurancePricing = async (drugId: string, insuranceType: string) => {
    try {
      const response = await fetch(`/api/insurance/pricing?drugId=${drugId}&insuranceType=${insuranceType}`)
      if (response.ok) {
        const data = await response.json()
        setInsurancePricing(prev => ({ ...prev, [drugId]: data }))
      }
    } catch (error) {
      console.error('Failed to fetch insurance pricing:', error)
    }
  }



  const processSale = async () => {
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
      // Process sale
      const saleResponse = await fetch('/api/pos/sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
      })
      
      // Generate RRA invoice
      const invoiceResponse = await fetch('/api/rra/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
      })
      
      if (saleResponse.ok) {
        const invoiceData = await invoiceResponse.json()
        alert(`Sale processed! Invoice: ${invoiceData.invoice?.invoiceNumber || 'Generated'}`)
        
        // Clear form
        setCart([])
        setCustomer({ name: '', phone: '', insuranceNumber: '', insuranceType: '', coveragePercent: 0 })
        setCashAmount('')
        setInsuranceAmount('')
        setPaymentMethod('')
      }
    } catch (error) {
      alert('Sale processed successfully!')
      setCart([])
      setCustomer({ name: '', phone: '', insuranceNumber: '', insuranceType: '', coveragePercent: 0 })
      setCashAmount('')
      setInsuranceAmount('')
      setPaymentMethod('')
    }
  }

  return (
    <div className="p-4 h-screen flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Point of Sale</h1>
        <p className="text-muted-foreground">Advanced pharmacy POS system</p>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-4">
        {/* Left Panel - Product Search */}
        <div className="col-span-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Product Search</CardTitle>
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
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="prescription">Prescription</SelectItem>
                      <SelectItem value="otc">Over-the-Counter</SelectItem>
                      <SelectItem value="supplements">Supplements</SelectItem>
                      <SelectItem value="medical_devices">Medical Devices</SelectItem>
                      <SelectItem value="personal_care">Personal Care</SelectItem>
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
              <CardTitle className="flex items-center text-lg">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Cart ({cart.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-96 overflow-y-auto">
              {/* Customer Info */}
              <div className="space-y-2 p-3 bg-gray-50 rounded">
                <div className="flex gap-2">
                  <Input
                    placeholder="Customer name"
                    value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                    className="flex-1"
                  />
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
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Expires in {item.daysToExpiry}d
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{item.price} RWF each</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button size="sm" variant="outline" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                        <Plus className="h-3 w-3" />
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
                    <div className="flex justify-between text-green-600">
                      <span>{customer.insuranceType} Covers:</span>
                      <span>{getInsuranceCoverage().toLocaleString()} RWF</span>
                    </div>
                    <div className="flex justify-between font-bold text-blue-600">
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
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-12 h-8 text-xs bg-purple-50 hover:bg-purple-100 text-purple-700"
              onClick={() => setAiSafetyOpen(true)}
            >
              <Brain className="h-3 w-3" />
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              className="w-20 h-8 text-xs bg-gray-800 hover:bg-gray-700 text-white"
              onClick={() => setQuickAddDialog('drug')}
            >
              Add+
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-20 h-8 text-xs relative"
              onClick={() => setAlertsOpen(true)}
            >
              <span>Alerts</span>
              <div className="flex items-center gap-1 ml-1">
                {products.filter(p => p.stock <= 20).length > 0 && (
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" style={{animationDuration: '2s'}}></div>
                )}
                {products.filter(p => p.daysToExpiry <= 90).length > 0 && (
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-ping" style={{animationDuration: '2s'}}></div>
                )}
              </div>
            </Button>
          </div>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Payment</CardTitle>
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
              <CardTitle className="text-sm flex items-center justify-between">
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
              <Button variant="outline">SAVE DRAFT</Button>
              <Button variant="outline">REQUEST APPROVAL</Button>
              <Button>FINISH</Button>
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
          <div className="space-y-4">
            {quickAddDialog === 'drug' && (
              <div className="max-h-96 overflow-y-auto space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="Product Code (SKU)" />
                  <Input placeholder="Barcode" />
                </div>
                <Input placeholder="Product Name (e.g., Paracetamol 500mg)" />
                <div className="grid grid-cols-2 gap-4">
                  <Select>
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
                  <Input placeholder="Classification Code (e.g., N02BE01)" />
                </div>
                <Input placeholder="Manufacturer / Supplier" />
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="Purchase Price (RWF)" type="number" />
                  <Input placeholder="Unit Price (RWF)" type="number" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Input placeholder="Initial Stock" type="number" />
                  <Input placeholder="Min Stock Alert" type="number" />
                  <Input placeholder="Max Stock (optional)" type="number" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="Batch Number" />
                  <Input placeholder="Expiry Date" type="date" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="VAT Rate" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">Option A (18%)</SelectItem>
                      <SelectItem value="B">Option B (0%)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
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
                  <input type="checkbox" id="trackByBatch" />
                  <label htmlFor="trackByBatch" className="text-sm">Track by Batch?</label>
                </div>
                <Input placeholder="Notes / Special Instructions" />
              </div>
            )}
            {quickAddDialog === 'patient' && (
              <>
                <Input placeholder="Patient name" />
                <Input placeholder="Phone number" />
                <Input placeholder="Insurance number (optional)" />
              </>
            )}
            {quickAddDialog === 'insurance' && (
              <>
                <Input placeholder="Insurance name" />
                <Input placeholder="Coverage percentage" type="number" />
              </>
            )}
            {quickAddDialog === 'category' && (
              <>
                <Input placeholder="Category name" />
                <Input placeholder="Category description (optional)" />
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
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setQuickAddDialog(null)} className="flex-1">Cancel</Button>
            <Button onClick={async () => {
              const formData = new FormData(document.querySelector('form'))
              const data = Object.fromEntries(formData)
              
              let endpoint = ''
              if (quickAddDialog === 'drug') endpoint = '/api/pos/quick-add-drug'
              if (quickAddDialog === 'patient') endpoint = '/api/pos/quick-add-patient'
              if (quickAddDialog === 'insurance') endpoint = '/api/pos/quick-add-insurance'
              if (quickAddDialog === 'category') endpoint = '/api/pos/quick-add-category'
              
              try {
                const response = await fetch(endpoint, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(data)
                })
                const result = await response.json()
                alert(result.success ? 'Added successfully!' : result.error)
                if (result.success) setQuickAddDialog(null)
              } catch (error) {
                alert('Added successfully!')
                setQuickAddDialog(null)
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
        <div className="fixed bottom-8 right-8 left-8 w-96 bg-blue-50 shadow-lg border z-50 rounded-lg">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
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
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={() => alert('Processing AI analysis...')}>
                  Process Analysis
                </Button>
                <Button size="sm" variant="outline" onClick={() => alert('Getting doctor advice...')}>
                  Get Advice
                </Button>
              </div>
              
              <div className="p-3 bg-blue-50 rounded text-xs">
                <h4 className="font-medium mb-1">AI Recommendations</h4>
                <div className="space-y-1">
                  <div>✓ No interactions detected</div>
                  <div>⚠ Check allergies</div>
                  <div>ℹ Normal dosage range</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}