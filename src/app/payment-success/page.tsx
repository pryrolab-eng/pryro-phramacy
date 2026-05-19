'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'checking' | 'success' | 'failed'>('checking')
  const [message, setMessage] = useState('Verifying your payment...')

  const goNext = () => {
    const fromOb =
      typeof window !== 'undefined' &&
      (sessionStorage.getItem('pryrox_payment_return') === 'onboarding' ||
        searchParams.get('return') === 'onboarding')
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('pryrox_payment_return')
    }
    router.push(fromOb ? '/dashboard' : '/settings')
  }

  useEffect(() => {
    const provider = searchParams.get('provider')
    const checkoutId = searchParams.get('checkout_id')
    const tid = searchParams.get('tid')
    const refid = searchParams.get('refid')

    const checkPayment = async () => {
      try {
        if (provider === 'polar' && checkoutId) {
          const response = await fetch(
            `/api/polar/status?checkoutId=${encodeURIComponent(checkoutId)}`,
            { credentials: 'include' }
          )
          const data = await response.json()
          if (data.status === 'completed') {
            setStatus('success')
            setMessage('Payment completed successfully!')
          } else if (data.status === 'failed') {
            setStatus('failed')
            setMessage('Payment failed. Please try again.')
          } else {
            setStatus('failed')
            setMessage(
              'Payment is still processing. Check Settings in a few minutes.'
            )
          }
          return
        }

        if (!tid && !refid) {
          setStatus('failed')
          setMessage('Invalid payment reference')
          return
        }

        const response = await fetch(
          `/api/kpay/status?${tid ? `tid=${tid}` : `refid=${refid}`}`,
          { credentials: 'include' }
        )
        const data = await response.json()

        if (data.transaction?.status === 'completed') {
          setStatus('success')
          setMessage('Payment completed successfully!')
        } else if (data.transaction?.status === 'failed') {
          setStatus('failed')
          setMessage('Payment failed. Please try again.')
        } else {
          setStatus('failed')
          setMessage('Payment is still processing. Please check back later.')
        }
      } catch {
        setStatus('failed')
        setMessage('Unable to verify payment status')
      }
    }

    void checkPayment()
  }, [searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          {status === 'checking' && <Loader2 className="h-16 w-16 mx-auto mb-4 animate-spin text-blue-600" />}
          {status === 'success' && <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-600" />}
          {status === 'failed' && <XCircle className="h-16 w-16 mx-auto mb-4 text-red-600" />}
          
          <CardTitle>
            {status === 'checking' && 'Processing Payment'}
            {status === 'success' && 'Payment Successful'}
            {status === 'failed' && 'Payment Failed'}
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'success' && (
            <Button onClick={goNext} className="w-full">
              Continue
            </Button>
          )}
          {status === 'failed' && (
            <div className="space-y-2">
              <Button onClick={() => router.push('/settings')} className="w-full">
                Try Again
              </Button>
              <Button onClick={() => router.push('/dashboard')} variant="outline" className="w-full">
                Go to Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
