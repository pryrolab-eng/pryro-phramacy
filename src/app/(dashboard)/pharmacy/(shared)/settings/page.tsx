'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { parseSettingsTab, type SettingsTabValue } from '@/lib/settings-tabs'
import { DashboardPageLoading } from '@/components/dashboard'
import { FeatureGate } from '@/components/subscription/feature-gate'
import { SettingsShell } from '@/components/settings/settings-shell'
import { SettingsActivePanel } from '@/components/settings/settings-active-panel'
import { SettingsDialogs } from '@/components/settings/settings-dialogs'
import {
  SettingsPageProvider,
  useSettingsPage,
} from '@/components/settings/settings-page-provider'

export default function SettingsPage() {
  return (
    <Suspense fallback={<DashboardPageLoading label="Loading settings…" />}>
      <FeatureGate
        featureKey="settings.access"
        loadingFallback={<DashboardPageLoading label="Loading settings…" />}
      >
        <SettingsPageProvider>
          <SettingsPageInner />
        </SettingsPageProvider>
      </FeatureGate>
    </Suspense>
  )
}

function SettingsPageInner() {
  const { loading } = useSettingsPage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabFromUrl = parseSettingsTab(searchParams.get('tab'))
  const [activeTab, setActiveTab] = useState<SettingsTabValue>(tabFromUrl)

  useEffect(() => {
    setActiveTab(tabFromUrl)
  }, [tabFromUrl])

  const handleTabChange = (next: SettingsTabValue) => {
    setActiveTab(next)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', next)
    router.replace(`/settings?${params.toString()}`, { scroll: false })
  }

  if (loading) {
    return <DashboardPageLoading label="Loading settings…" />
  }

  return (
    <SettingsShell activeTab={activeTab} onTabChange={handleTabChange}>
      <SettingsActivePanel tab={activeTab} />
      <SettingsDialogs />
    </SettingsShell>
  )
}
