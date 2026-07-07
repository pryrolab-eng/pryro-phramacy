'use client'



import { useState } from 'react'

import { useSearchParams } from 'next/navigation'

import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

import { Input } from '@/components/ui/input'

import { Label } from '@/components/ui/label'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { useVerify2FAMutation } from '@/hooks/useAuth'



export function Verify2FAForm() {

  const [code, setCode] = useState('')

  const verifyMutation = useVerify2FAMutation()

  const searchParams = useSearchParams()

  const sessionToken = searchParams.get('session')



  const handleVerify = async (e: React.FormEvent) => {

    e.preventDefault()



    try {

      const { completeResult } = await verifyMutation.mutateAsync({

        sessionToken,

        token: code,

      })



      if (completeResult.nativeSession) {

        window.location.href = "/app"

      } else {

        toast.error(completeResult.error || 'Failed to complete authentication')

      }

    } catch (error) {

      const message =

        error instanceof Error ? error.message : 'Verification failed'

      toast.error(message)

    }

  }



  const loading = verifyMutation.isPending



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

            <Button type="submit" className="w-full rounded-[10px]" disabled={loading || code.length !== 6}>

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

