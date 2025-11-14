"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Banknote, 
  Smartphone,
  Receipt,
  Calculator,
  Scan,
  X
} from "lucide-react"

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
  stock: number
  prescription: boolean
  batch: string
}

interface Medication {
  id: number
  name: string
  price: number
  stock: number
  minStock: number
  prescription: boolean
  batch: string
  category: string
}

export default function EnhancedPOS() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("")
  const [amountReceived, setAmountReceived] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")

  // Sample medications from your SQL data
  const medications: Medication[] = [
    { id: 1, name: "Paracetamol 500mg", price: 120, stock: 150, minStock: 25, prescription: false, batch: "PAR001", category: "Pain Relief" },
    { id: 2, name: "Amoxicillin 250mg", price: 450, stock: 8, minStock: 15, prescription: true, batch: "AMX001", category: "Antibiotics" },
    { id: 3, name: "Ibuprofen 400mg", price: 220, stock: 75, minStock: 20, prescription: false, batch: "IBU001", category: "Pain Relief" },
    { id: 4, name: "Vitamin C 1000mg", price: 75, stock: 200, minStock: 30, prescription: false, batch: "VIT001", category: "Vitamins" },
    { id: 5, name: "Aspirin 100mg", price: 95, stock: 12, minStock: 25, prescription: false, batch: "ASP001", category: "Pain Relief" },
  ]

  const addToCart = (medication: Medication) => {
    const existingItem = cartItems.find(item => item.id === medication.id)
    
    if (existingItem) {
      if (existingItem.quantity >= medication.stock) {
        toast({
          title: "Insufficient Stock",
          description: `Only ${medication.stock} units available`,
          variant: "destructive"
        })
        return
      }
      setCartItems(cartItems.map(item =>
        item.id === medication.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCartItems([...cartItems, {
        id: medication.id,
        name: medication.name,
        price: medication.price,
        quantity: 1,
        stock: medication.stock,
        prescription: medication.prescription,
        batch: medication.batch
      }])
    }
    setSearchOpen(false)
  }

  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(id)
      return
    }
    
    const item = cartItems.find(item => item.id === id)
    if (item && newQuantity > item.stock) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${item.stock} units available`,
        variant: "destructive"
      })
      return
    }

    setCartItems(cartItems.map(item =>
      item.id === id ? { ...item, quantity: newQuantity } : item
    ))
  }

  const removeFromCart = (id: number) => {
    setCartItems(cartItems.filter(item => item.id !== id))
  }

  const clearCart = () => {
    setCartItems([])
  }

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const tax = subtotal * 0.18 // 18% VAT
  const total = subtotal + tax

  const processSale = async () => {
    if (!paymentMethod) {
      toast({
        title: "Payment Method Required",
        description: "Please select a payment method",
        variant: "destructive"
      })
      return
    }

    if (paymentMethod === "cash" && (!amountReceived || parseFloat(amountReceived) < total)) {
      toast({
        title: "Insufficient Payment",
        description: "Amount received is less than total",
        variant: "destructive"
      })
      return
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Sale Completed",
        description: `Transaction processed successfully. Receipt #${Date.now()}`,
      })

      // Reset form
      setCartItems([])
      setPaymentMethod("")
      setAmountReceived("")
      setCustomerPhone("")
      setPaymentOpen(false)
    } catch (error) {
      toast({
        title: "Sale Failed",
        description: "Please try again",
        variant: "destructive"
      })
    }
  }

  const change = paymentMethod === "cash" && amountReceived 
    ? Math.max(0, parseFloat(amountReceived) - total)
    : 0

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main POS Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Point of Sale</h1>
            <div className="flex gap-2">
              <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-64 justify-start">
                    <Search className="mr-2 h-4 w-4" />
                    Search medications...
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search medications..." />
                    <CommandList>
                      <CommandEmpty>No medications found.</CommandEmpty>
                      <CommandGroup>
                        {medications.map((med) => (
                          <CommandItem
                            key={med.id}
                            onSelect={() => addToCart(med)}
                            className="flex items-center justify-between p-3"
                          >
                            <div className="flex-1">
                              <div className="font-medium">{med.name}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {med.category}
                                </Badge>
                                {med.prescription && (
                                  <Badge variant="destructive" className="text-xs">Rx</Badge>
                                )}
                                <Badge variant={med.stock <= med.minStock ? "destructive" : "secondary"} className="text-xs">
                                  Stock: {med.stock}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">RWF {med.price}</div>
                              <div className="text-xs text-muted-foreground">{med.batch}</div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <Button variant="outline" size="icon">
                <Scan className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 p-4 overflow-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {medications.map((med) => (
              <Card 
                key={med.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => addToCart(med)}
              >
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="font-medium text-sm leading-tight">{med.name}</div>
                    <div className="flex items-center gap-1">
                      {med.prescription && (
                        <Badge variant="destructive" className="text-xs">Rx</Badge>
                      )}
                      <Badge variant="outline" className="text-xs">{med.category}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-lg">RWF {med.price}</span>
                      <Badge variant={med.stock <= med.minStock ? "destructive" : "secondary"}>
                        {med.stock}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-96 bg-white border-l flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Cart ({cartItems.length})
            </h2>
            {cartItems.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear Cart</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to remove all items from the cart?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={clearCart}>Clear Cart</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          {cartItems.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Cart is empty</p>
              <p className="text-sm">Add items to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cartItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Batch: {item.batch}
                        </div>
                        {item.prescription && (
                          <Badge variant="destructive" className="text-xs mt-1">
                            Prescription Required
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">RWF {item.price * item.quantity}</div>
                        <div className="text-xs text-muted-foreground">
                          RWF {item.price} each
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Cart Summary */}
        {cartItems.length > 0 && (
          <div className="p-4 border-t space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>RWF {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>VAT (18%):</span>
                <span>RWF {tax.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>RWF {total.toFixed(2)}</span>
              </div>
            </div>

            <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
              <DialogTrigger asChild>
                <Button className="w-full" size="lg">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Process Payment
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Process Payment</DialogTitle>
                  <DialogDescription>
                    Complete the transaction for RWF {total.toFixed(2)}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="customer-phone">Customer Phone (Optional)</Label>
                    <Input
                      id="customer-phone"
                      placeholder="+250 xxx xxx xxx"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">
                          <div className="flex items-center gap-2">
                            <Banknote className="h-4 w-4" />
                            Cash
                          </div>
                        </SelectItem>
                        <SelectItem value="card">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Card
                          </div>
                        </SelectItem>
                        <SelectItem value="mobile">
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4" />
                            Mobile Money
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {paymentMethod === "cash" && (
                    <div>
                      <Label htmlFor="amount-received">Amount Received</Label>
                      <Input
                        id="amount-received"
                        type="number"
                        placeholder="0.00"
                        value={amountReceived}
                        onChange={(e) => setAmountReceived(e.target.value)}
                      />
                      {amountReceived && parseFloat(amountReceived) >= total && (
                        <div className="mt-2 p-2 bg-green-50 rounded text-sm">
                          <div className="flex justify-between">
                            <span>Change:</span>
                            <span className="font-semibold">RWF {change.toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setPaymentOpen(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button onClick={processSale} className="flex-1">
                      <Receipt className="mr-2 h-4 w-4" />
                      Complete Sale
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  )
}