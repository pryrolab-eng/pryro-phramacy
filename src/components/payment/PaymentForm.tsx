'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface PaymentFormProps {
  amount: number
  saleId?: string
  subscriptionId?: string
  onSuccess?: (transaction: any) => void
  onError?: (error: string) => void
}

export function PaymentForm({ amount, saleId, subscriptionId, onSuccess, onError }: PaymentFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    paymentMethod: 'momo',
    bankId: '63510'
  })

  const paymentMethods = [
    { value: 'momo', label: 'Mobile Money' },
    { value: 'cc', label: 'Credit/Debit Card' },
    { value: 'bank', label: 'Bank Transfer' },
    { value: 'spenn', label: 'Spenn' },
    { value: 'smartcash', label: 'SmartCash' }
  ]

  const mobileMoneyProviders = [
    { value: '63510', label: 'MTN Mobile Money' },
    { value: '63514', label: 'Airtel Money' },
    { value: '63502', label: 'Spenn' }
  ]

  const banks = [
    { value: '040', label: 'Bank of Kigali' },
    { value: '100', label: 'Ecobank' },
    { value: '192', label: 'Equity Bank' },
    { value: '400', label: 'Banque Populaire du Rwanda' },
    { value: '900', label: 'Bank of Africa' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/kpay/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          saleId,
          subscriptionId,
          ...formData,
          details: saleId ? 'Pharmacy sale payment' : 'Subscription payment'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Payment failed')
      }

      if (data.success && data.transaction.checkoutUrl) {
        window.location.href = data.transaction.checkoutUrl
      } else if (data.success) {
        onSuccess?.(data.transaction)
      } else {
        throw new Error(data.kpayResponse?.statusdesc || 'Payment failed')
      }
    } catch (error: any) {
      onError?.(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Details</CardTitle>
        <CardDescription>Amount: {amount.toLocaleString()} RWF</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customerName">Customer Name</Label>
            <Input
              id="customerName"
              required
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerPhone">Phone Number</Label>
            <Input
              id="customerPhone"
              type="tel"
              placeholder="250788000000"
              required
              value={formData.customerPhone}
              onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerEmail">Email (Optional)</Label>
            <Input
              id="customerEmail"
              type="email"
              value={formData.customerEmail}
              onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select
              value={formData.paymentMethod}
              onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.paymentMethod === 'momo' && (
            <div className="space-y-2">
              <Label htmlFor="bankId">Mobile Money Provider</Label>
              <Select
                value={formData.bankId}
                onValueChange={(value) => setFormData({ ...formData, bankId: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mobileMoneyProviders.map((provider) => (
                    <SelectItem key={provider.value} value={provider.value}>
                      {provider.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.paymentMethod === 'bank' && (
            <div className="space-y-2">
              <Label htmlFor="bankId">Bank</Label>
              <Select
                value={formData.bankId}
                onValueChange={(value) => setFormData({ ...formData, bankId: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {banks.map((bank) => (
                    <SelectItem key={bank.value} value={bank.value}>
                      {bank.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Pay {amount.toLocaleString()} RWF
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
