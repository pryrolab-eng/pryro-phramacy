import { redirect } from 'next/navigation'
import { createClient } from '../../../supabase/server'
import { selectPrimaryMembership } from '@/utils/select-pharmacy-membership'
import { PharmacyProvider } from '@/hooks/usePharmacyStore'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { SuperadminSidebar } from '@/components/superadmin-sidebar'
import { PharmacySidebar } from '@/components/pharmacy-sidebar'
import { PharmacistSidebar } from '@/components/pharmacist-sidebar'
import SubscriptionBlocker from '@/components/subscription-blocker'
import { Toaster } from 'sonner'

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
    // Check the new SaaS subscription model first (subscriptions.status = 'active')
    // Fall back to legacy pharmacy.status check for backward compatibility
    const [{ data: activeSub }, { data: pharmacy }] = await Promise.all([
      supabase
        .from('subscriptions')
        .select('id, status')
        .eq('pharmacy_id', userProfile.pharmacy_id)
        .eq('subscription_type', 'main')
        .in('status', ['active', 'trialing'])
        .limit(1)
        .maybeSingle(),
      supabase
        .from('pharmacies')
        .select('status, subscription_expires_at')
        .eq('id', userProfile.pharmacy_id)
        .maybeSingle(),
    ])

    if (!activeSub) {
      // No active SaaS subscription — check legacy fields
      if (pharmacy) {
        isSubscriptionExpired =
          pharmacy.status === 'suspended' ||
          (pharmacy.subscription_expires_at != null &&
            new Date(pharmacy.subscription_expires_at) < new Date())
      }
    }
    // If activeSub exists, subscription is valid — isSubscriptionExpired stays false
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
      <Toaster richColors position="top-right" />
    </PharmacyProvider>
  )
}