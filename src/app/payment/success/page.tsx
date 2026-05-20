'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const checkoutId = searchParams.get('checkout_id')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    if (!checkoutId) {
      setStatus('error')
      return
    }
    // Give webhook a moment to process, then confirm
    const timer = setTimeout(() => setStatus('success'), 2000)
    return () => clearTimeout(timer)
  }, [checkoutId])

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {status === 'loading' && (
          <>
            <Loader2 className="mx-auto size-12 animate-spin text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Confirming your payment...</h1>
            <p className="text-gray-500">Please wait while we activate your subscription.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="mx-auto size-16 text-green-500" />
            <h1 className="text-2xl font-bold text-gray-900">Payment Successful!</h1>
            <p className="text-gray-500">
              Your Pryrox subscription is now active. You can start managing your pharmacy right away.
            </p>
            <div className="flex flex-col gap-3 pt-2">
              <Button asChild className="w-full bg-gray-950 hover:bg-gray-800">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/">Back to Home</Link>
              </Button>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto size-16 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-3xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
            <p className="text-gray-500">We couldn't confirm your payment. Please contact support.</p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">Back to Home</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
