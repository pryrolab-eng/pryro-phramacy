'use client'

import { PaymentForm } from '@/components/payment/PaymentForm'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'


interface POSPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  saleData: {
    id?: string
    totalAmount: number
    customerName?: string
    customerPhone?: string
    defaultPaymentMethod?: string
  }
  onPaymentComplete: (transactionId: string) => void
}

export function POSPaymentDialog({ 
  open, 
  onOpenChange, 
  saleData, 
  onPaymentComplete 
}: POSPaymentDialogProps) {
  const { toast } = useToast()

  const handlePaymentSuccess = async (transaction: any) => {
    toast({
      title: 'Payment Initiated',
      description: 'Waiting for payment confirmation...'
    })

    onPaymentComplete(transaction.id)
    onOpenChange(false)
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
          customerName={saleData.customerName}
          customerPhone={saleData.customerPhone}
          defaultPaymentMethod={saleData.defaultPaymentMethod}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />
      </DialogContent>
    </Dialog>
  )
}
