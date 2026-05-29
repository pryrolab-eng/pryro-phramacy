'use client'

import { useState } from 'react'
import { useProcessPosSaleMutation } from '@/hooks/usePos'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ShoppingCart, Plus, Minus } from 'lucide-react'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

export function QuickPOS() {
  const saleMutation = useProcessPosSaleMutation()
  const [isOpen, setIsOpen] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedDrug, setSelectedDrug] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')

  const drugs = [
    { id: '1', name: 'Paracetamol 500mg', price: 500 },
    { id: '2', name: 'Ibuprofen 400mg', price: 800 },
    { id: '3', name: 'Vitamin C 500mg', price: 1200 }
  ]

  const addToCart = () => {
    const drug = drugs.find(d => d.id === selectedDrug)
    if (!drug) return

    const existing = cart.find(item => item.id === drug.id)
    if (existing) {
      setCart(cart.map(item => 
        item.id === drug.id ? { ...item, quantity: item.quantity + 1 } : item
      ))
    } else {
      setCart([...cart, { ...drug, quantity: 1 }])
    }
    setSelectedDrug('')
  }

  const updateQuantity = (id: string, change: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQuantity = item.quantity + change
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item
      }
      return item
    }).filter(item => item.quantity > 0))
  }

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  const processSale = async () => {
    try {
      await saleMutation.mutateAsync({
        customer: {
          name: '',
          phone: '',
          insuranceNumber: '',
          insuranceType: '',
          coveragePercent: 0,
        },
        items: cart.map((item) => ({
          ...item,
          medicationId: item.id,
          stock: 999,
          batch: '—',
          expiryDate: null,
          daysToExpiry: 999,
          requiresPrescription: false,
        })),
        subtotal: total,
        insuranceCoverage: 0,
        patientAmount: total,
        paymentMethod,
        cashAmount: total,
        insuranceAmount: 0,
      })
      setCart([])
      setPaymentMethod('')
      setIsOpen(false)
    } catch (error) {
      console.error('Sale failed:', error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full justify-start bg-blue-600 hover:bg-blue-700">
          <ShoppingCart className="mr-3 h-5 w-5" />
          Open Point of Sale (POS)
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Quick POS Sale</DialogTitle>
          <DialogDescription>Process a quick sale</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Select value={selectedDrug} onValueChange={setSelectedDrug}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select drug" />
              </SelectTrigger>
              <SelectContent>
                {drugs.map(drug => (
                  <SelectItem key={drug.id} value={drug.id}>
                    {drug.name} - {drug.price} RWF
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={addToCart} disabled={!selectedDrug}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2 max-h-40 overflow-y-auto">
            {cart.map(item => (
              <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm">{item.name}</span>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => updateQuantity(item.id, -1)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <Button size="sm" variant="outline" onClick={() => updateQuantity(item.id, 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                  <span className="w-20 text-right">{item.price * item.quantity} RWF</span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-2">
            <div className="flex justify-between font-bold">
              <span>Total:</span>
              <span>{total} RWF</span>
            </div>
          </div>

          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger>
              <SelectValue placeholder="Payment method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="mobile">Mobile Money</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={processSale} disabled={cart.length === 0 || !paymentMethod}>
              Process Sale
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}