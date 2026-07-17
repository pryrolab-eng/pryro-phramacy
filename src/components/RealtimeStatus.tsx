'use client'

import { Wifi, WifiOff } from 'lucide-react'
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates'
import { statusToneChipClass } from '@/lib/ui/status-tone'
import { cn } from '@/lib/utils'

export function RealtimeStatus() {
  const { connected } = useRealtimeUpdates(() => {})

  return (
    <span
      className={cn(
        'inline-flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium',
        connected ? statusToneChipClass.success : statusToneChipClass.muted,
      )}
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
