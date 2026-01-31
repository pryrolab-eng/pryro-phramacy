'use client'

import { useState } from 'react'
import { PaymentForm } from '@/components/payment/PaymentForm'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface POSPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  saleData: {
    id: string
    totalAmount: number
    customerName?: string
    customerPhone?: string
  }
  onPaymentComplete: () => void
}

export function POSPaymentDialog({ 
  open, 
  onOpenChange, 
  saleData, 
  onPaymentComplete 
}: POSPaymentDialogProps) {
  const { toast } = useToast()
  const [checking, setChecking] = useState(false)

  const handlePaymentSuccess = async (transaction: any) => {
    toast({
      title: 'Payment Initiated',
      description: 'Waiting for payment confirmation...'
    })

    // Poll for payment status
    const checkInterval = setInterval(async () => {
      setChecking(true)
      try {
        const response = await fetch(`/api/kpay/status?transactionId=${transaction.id}`)
        const data = await response.json()

        if (data.transaction.status === 'completed') {
          clearInterval(checkInterval)
          toast({
            title: 'Payment Successful',
            description: 'Transaction completed successfully'
          })
          onPaymentComplete()
          onOpenChange(false)
        } else if (data.transaction.status === 'failed') {
          clearInterval(checkInterval)
          toast({
            title: 'Payment Failed',
            description: data.transaction.error_message || 'Payment was not successful',
            variant: 'destructive'
          })
        }
      } catch (error) {
        console.error('Status check error:', error)
      } finally {
        setChecking(false)
      }
    }, 5000) // Check every 5 seconds

    // Stop checking after 5 minutes
    setTimeout(() => clearInterval(checkInterval), 300000)
  }

  const handlePaymentError = (error: string) => {
    toast({
      title: 'Payment Error',
      description: error,
      variant: 'destructive'
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Process Payment</DialogTitle>
        </DialogHeader>
        <PaymentForm
          amount={saleData.totalAmount}
          saleId={saleData.id}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />
        {checking && (
          <div className="text-center text-sm text-muted-foreground">
            Checking payment status...
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
