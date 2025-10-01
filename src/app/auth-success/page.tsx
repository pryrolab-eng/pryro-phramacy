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
        
        // Check auth state
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          console.log('🔄 AUTH STATE CHANGE:', event, session?.user?.email || 'No user')
        })
        
        if (user && session) {
          sessionStorage.removeItem('userRole')
          
          if (user.email === 'abdousentore@gmail.com') {
            console.log('👑 CLIENT: Redirecting to superadmin')
            router.push('/superadmin')
          } else {
            console.log('🏥 CLIENT: Redirecting to dashboard')
            router.push('/dashboard')
          }
        } else {
          console.log('❌ CLIENT: No valid session, redirecting to sign-in')
          router.push('/sign-in')
        }
        
        // Cleanup subscription
        return () => subscription?.unsubscribe()
        
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