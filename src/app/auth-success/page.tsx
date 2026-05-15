'use client'

import { useEffect } from 'react'
import { createClient } from '../../../../supabase/client'
import { useRouter } from 'next/navigation'

export default function AuthSuccess() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        console.log('🔍 CLIENT: Starting auth check...')
        
        // Check session first
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        console.log('🍪 CLIENT SESSION:', session ? 'Found' : 'None')
        console.log('❌ CLIENT SESSION ERROR:', sessionError?.message || 'None')
        
        // Get user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        console.log('👤 CLIENT USER:', user?.email || 'No user')
        console.log('❌ CLIENT USER ERROR:', userError?.message || 'None')
        
        void supabase.auth.onAuthStateChange((event, session) => {
          console.log('🔄 AUTH STATE CHANGE:', event, session?.user?.email || 'No user')
        })
        
        if (user && session) {
          sessionStorage.removeItem('userRole')

          const { data: profile } = await supabase
            .from('users')
            .select('is_platform_admin')
            .eq('id', user.id)
            .maybeSingle()

          if (profile?.is_platform_admin) {
            console.log('👑 CLIENT: Redirecting to platform dashboard')
            router.push('/admin')
            return
          }

          const { data: memberships } = await supabase
            .from('pharmacy_users')
            .select('pharmacy_id')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .limit(1)
          const pharmacyId = memberships?.[0]?.pharmacy_id
          if (!pharmacyId) {
            router.push('/onboarding')
            return
          }
          const { data: activeSub } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('pharmacy_id', pharmacyId)
            .eq('is_active', true)
            .limit(1)
            .maybeSingle()
          router.push(activeSub ? '/dashboard' : '/onboarding')
          return
        } else {
          console.log('❌ CLIENT: No valid session, redirecting to sign-in')
          router.push('/sign-in')
        }
      } catch (error) {
        console.error('🚨 CLIENT AUTH ERROR:', error)
        router.push('/sign-in')
      }
    }

    handleRedirect()
  }, [router, supabase])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-600">Redirecting...</p>
      </div>
    </div>
  )
}