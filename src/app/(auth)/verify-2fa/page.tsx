import { Suspense } from 'react'
import { Verify2FAForm } from './verify-2fa-form'

function Verify2FAFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  )
}

export default function Verify2FAPage() {
  return (
    <Suspense fallback={<Verify2FAFallback />}>
      <Verify2FAForm />
    </Suspense>
  )
}
