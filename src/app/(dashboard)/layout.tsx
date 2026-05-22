import { redirect } from 'next/navigation'
import { createClient } from '../../../supabase/server'
import { selectPrimaryMembership } from '@/utils/select-pharmacy-membership'
import { PharmacyProvider } from '@/hooks/usePharmacyStore'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { SuperadminSidebar } from '@/components/superadmin-sidebar'
import { PharmacySidebar } from '@/components/pharmacy-sidebar'
import { PharmacistSidebar } from '@/components/pharmacist-sidebar'
import SubscriptionBlocker from '@/components/subscription-blocker'
import { createServiceClient } from '../../../supabase/service'
import { resolvePharmacyEntitlements } from '@/lib/subscription/lifecycle/entitlements'

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

  // Run all DB queries in parallel
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
  const userRole = userProfile?.role || 'pharmacy_owner'
  
  if (userProfile?.pharmacy_id && !isPlatformAdmin) {
    const admin = createServiceClient()
    const [{ data: pharmacy }, entitlements] = await Promise.all([
      supabase
        .from('pharmacies')
        .select('status')
        .eq('id', userProfile.pharmacy_id)
        .maybeSingle(),
      resolvePharmacyEntitlements(admin, userProfile.pharmacy_id),
    ])

    isSubscriptionExpired =
      pharmacy?.status === 'suspended' || !entitlements.isAccessAllowed
  }

  const getSidebar = () => {
    if (isPlatformAdmin) return <SuperadminSidebar />
    if (userProfile?.role === 'pharmacist') return <PharmacistSidebar />
    return <PharmacySidebar />
  }

  return (
    <PharmacyProvider>
      <SidebarProvider>
        {getSidebar()}
        <SidebarInset>
          <SubscriptionBlocker isExpired={isSubscriptionExpired} userRole={userRole} />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </PharmacyProvider>
  )
}