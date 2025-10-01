'use client'

import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates'
import { Wifi, WifiOff } from 'lucide-react'

export function RealtimeStatus() {
  const { connected } = useRealtimeUpdates(() => {})

  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
      connected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
    }`}>
      {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
      {connected ? 'Live' : 'Offline'}
    </div>
  )
}