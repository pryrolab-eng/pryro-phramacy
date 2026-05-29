import { redirect } from 'next/navigation'
import { createClient } from '../../../supabase/server'
import { selectPrimaryMembership } from '@/utils/select-pharmacy-membership'
import { SidebarInset } from '@/components/ui/sidebar'
import { SuperadminSidebar } from '@/components/superadmin-sidebar'
import { PharmacySidebar } from '@/components/pharmacy-sidebar'
import { PharmacistSidebar } from '@/components/pharmacist-sidebar'
import { CashierSidebar } from '@/components/cashier-sidebar'
import { isCashierLikeRole } from '@/lib/subscription/nav-config'
import SubscriptionBlocker from '@/components/subscription-blocker'
import { FeatureRouteGuard } from '@/components/subscription/feature-route-guard'
import { createServiceClient } from '../../../supabase/service'
import { resolvePharmacyEntitlements } from '@/lib/subscription/lifecycle/entitlements'
import { resolveActivePharmacyContext } from '@/lib/pharmacy/active-pharmacy'
import { DashboardShellBar } from '@/components/shell/dashboard-shell-bar'
import { DashboardProviders } from '@/components/shell/dashboard-providers'
import { DashboardCommandPalette, AdminCommandPalette } from '@/components/dashboard'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in')
  }

  const [{ data: publicProfile }, { data: membershipRows }, ] = await Promise.all([
    supabase
      .from('users')
      .select('is_platform_admin')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('pharmacy_users')
      .select('role, pharmacy_id')
      .eq('user_id', user.id)
      .eq('is_active', true),
  ])

  const userProfile = selectPrimaryMembership(membershipRows ?? undefined)

  const isPlatformAdmin =
    publicProfile?.is_platform_admin === true ||
    userProfile?.role === 'superadmin' ||
    userProfile?.role === 'admin'

  let isSubscriptionExpired = false
  let activePharmacyId: string | null = userProfile?.pharmacy_id ?? null
  let userRole = userProfile?.role || 'pharmacy_owner'

  if (!isPlatformAdmin && user) {
    const admin = createServiceClient()
    const activeCtx = await resolveActivePharmacyContext(admin, user.id)
    activePharmacyId = activeCtx.activePharmacyId
    userRole = activeCtx.role ?? userRole

    if (activePharmacyId) {
      const { data: pharmacy } = await supabase
        .from('pharmacies')
        .select('status')
        .eq('id', activePharmacyId)
        .maybeSingle()

      let accessAllowed = true
      try {
        const entitlements = await resolvePharmacyEntitlements(
          admin,
          activePharmacyId,
        )
        accessAllowed = entitlements.isAccessAllowed
      } catch (entErr) {
        console.error('DashboardLayout: entitlements resolve failed', entErr)
      }

      isSubscriptionExpired =
        pharmacy?.status === 'suspended' || !accessAllowed
    }
  }

  const getSidebar = () => {
    if (isPlatformAdmin) return <SuperadminSidebar />
    if (userRole === 'pharmacist') return <PharmacistSidebar />
    if (isCashierLikeRole(userRole)) return <CashierSidebar />
    return <PharmacySidebar />
  }

  const dashboardBody = (
    <>
      {getSidebar()}
      <SidebarInset className="flex flex-col">
        <SubscriptionBlocker isExpired={isSubscriptionExpired} userRole={userRole} />
        <DashboardShellBar showBranchSwitcher={!isPlatformAdmin} />
        {!isPlatformAdmin ? <DashboardCommandPalette /> : <AdminCommandPalette />}
        <div className="flex-1 min-h-0">
          {!isPlatformAdmin ? (
            <FeatureRouteGuard>{children}</FeatureRouteGuard>
          ) : (
            children
          )}
        </div>
      </SidebarInset>
    </>
  )

  return (
    <DashboardProviders withPharmacyContext={!isPlatformAdmin}>
      {dashboardBody}
    </DashboardProviders>
  )
}
