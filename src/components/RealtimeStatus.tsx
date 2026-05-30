'use client'

import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates'
import { Wifi, WifiOff } from 'lucide-react'

export function RealtimeStatus() {
  const { connected } = useRealtimeUpdates(() => {})

  return (
    <span
      className={`inline-flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium ${
        connected
          ? 'border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300'
          : 'border-neutral-200/80 bg-neutral-50 text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-400'
      }`}
    >
      {connected ? (
        <Wifi className="h-3.5 w-3.5" strokeWidth={1.75} />
      ) : (
        <WifiOff className="h-3.5 w-3.5" strokeWidth={1.75} />
      )}
      {connected ? 'Live' : 'Offline'}
    </span>
  )
}