import { useState, useEffect } from 'react'
import { dashboardApi, pharmacyApi } from '@/lib/api'

export function usePharmacy() {
  const [pharmacy, setPharmacy] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPharmacy() {
      try {
        const data = await pharmacyApi.getCurrent()
        setPharmacy(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch pharmacy')
      } finally {
        setLoading(false)
      }
    }

    fetchPharmacy()
  }, [])

  return { pharmacy, loading, error }
}

export function useDashboard(pharmacyId?: string) {
  const [stats, setStats] = useState<any>(null)
  const [alerts, setAlerts] = useState<any[]>([])
  const [recentSales, setRecentSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!pharmacyId) return

    async function fetchDashboard() {
      try {
        const response = await fetch('/api/dashboard')
        if (!response.ok) throw new Error('Failed to fetch dashboard data')
        
        const data = await response.json()
        setStats(data.stats)
        setAlerts(data.alerts)
        setRecentSales(data.recentSales)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [pharmacyId])

  return { stats, alerts, recentSales, loading, error }
}