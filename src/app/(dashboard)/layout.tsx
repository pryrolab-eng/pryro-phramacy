import { redirect } from 'next/navigation'
import { createClient } from '../../../supabase/server'
import { PharmacyProvider } from '@/hooks/usePharmacyStore'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { SuperadminSidebar } from '@/components/superadmin-sidebar'
import { PharmacySidebar } from '@/components/pharmacy-sidebar'
import { PharmacistSidebar } from '@/components/pharmacist-sidebar'
import SubscriptionBlocker from '@/components/subscription-blocker'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  console.log('🏠 DASHBOARD LAYOUT CHECK');
  
  const supabase = await createClient()
  
  // Use getUser which handles session refresh automatically
  const { data: { user }, error } = await supabase.auth.getUser()
  
  console.log('👤 LAYOUT USER CHECK:', {
    hasUser: !!user,
    userEmail: user?.email,
    userId: user?.id,
    error: error?.message,
    errorCode: error?.status
  });

  if (!user) {
    console.log('➡️ LAYOUT: No user, redirecting to sign-in');
    redirect('/sign-in')
  }
  
  console.log('✅ LAYOUT: User authenticated successfully');

  // Get user role from pharmacy_users table
  const { data: userProfile } = await supabase
    .from('pharmacy_users')
    .select('role, pharmacy_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  console.log('👤 USER ROLE:', userProfile?.role);

  // Check subscription status
  let isSubscriptionExpired = false
  let userRole = userProfile?.role || 'pharmacy_owner'
  
  if (userProfile?.pharmacy_id && userProfile?.role !== 'superadmin') {
    const { data: pharmacy } = await supabase
      .from('pharmacies')
      .select('status, subscription_expires_at')
      .eq('id', userProfile.pharmacy_id)
      .single()
    
    if (pharmacy) {
      isSubscriptionExpired = pharmacy.status === 'suspended' || 
        (pharmacy.subscription_expires_at && new Date(pharmacy.subscription_expires_at) < new Date())
    }
  }

  // Determine which sidebar to show based on user role
  const getSidebar = () => {
    if (userProfile?.role === 'superadmin') {
      return <SuperadminSidebar />
    }
    
    if (userProfile?.role === 'pharmacist') {
      return <PharmacistSidebar />
    }
    
    // Default to pharmacy owner sidebar
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