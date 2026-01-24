'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Verify2FAPage() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionToken = searchParams.get('session')

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken, token: code })
      })

      const data = await response.json()

      if (response.ok) {
        // Complete 2FA and restore session
        const completeResponse = await fetch('/api/auth/complete-2fa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionToken })
        })
        
        const completeData = await completeResponse.json()
        
        if (completeResponse.ok && completeData.token) {
          // Verify the token to create session
          const { createClient } = await import('@/../../supabase/client')
          const supabase = createClient()
          
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: completeData.token,
            type: completeData.type as any
          })
          
          if (!verifyError) {
            window.location.href = '/dashboard'
          } else {
            console.error('Verify error:', verifyError)
            setError('Failed to complete authentication')
          }
        } else {
          setError('Failed to complete authentication')
        }
      } else {
        setError(data.error || 'Invalid code')
      }
    } catch (err) {
      setError('Verification failed')
    } finally {
      setLoading(false)
    }
  }

  if (!sessionToken) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Session</CardTitle>
            <CardDescription>Please sign in again</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>Enter the 6-digit code from your authenticator app</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Authentication Code</Label>
              <Input
                id="code"
                type="text"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                required
                autoFocus
              />
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading || code.length !== 6}>
              {loading ? 'Verifying...' : 'Verify'}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Lost your device? Use one of your backup codes instead
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
