import { redirect } from 'next/navigation'
import { createClient } from '../../../supabase/server'
import { PharmacyProvider } from '@/hooks/usePharmacyStore'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { SuperadminSidebar } from '@/components/superadmin-sidebar'
import { PharmacySidebar } from '@/components/pharmacy-sidebar'
import { PharmacistSidebar } from '@/components/pharmacist-sidebar'

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
    .select('role')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  console.log('👤 USER ROLE:', userProfile?.role);

  // Determine which sidebar to show based on user role
  const getSidebar = () => {
    if (user.email === 'abdousentore@gmail.com') {
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
          {children}
        </SidebarInset>
      </SidebarProvider>
    </PharmacyProvider>
  )
}