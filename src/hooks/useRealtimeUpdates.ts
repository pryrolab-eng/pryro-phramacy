'use client'

import { useEffect, useState } from 'react'

interface RealtimeUpdate {
  type: 'inventory_update' | 'new_sale' | 'stock_alert' | 'prescription_update'
  data: any
}

export function useRealtimeUpdates(onUpdate: (update: RealtimeUpdate) => void) {
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    // Simulate WebSocket with polling for now
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/realtime/updates')
        if (response.ok) {
          const updates = await response.json()
          updates.forEach(onUpdate)
          setConnected(true)
        }
      } catch (error) {
        setConnected(false)
      }
    }, 5000) // Poll every 5 seconds

    return () => clearInterval(interval)
  }, [onUpdate])

  return { connected }
}