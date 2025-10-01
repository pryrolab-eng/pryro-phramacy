'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../supabase/client'

export default function DebugRoleBanner() {
  const [debugInfo, setDebugInfo] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const checkRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setDebugInfo('❌ No user logged in')
        return
      }

      const isSuper = user.email === 'abdousentore@gmail.com'
      const cached = sessionStorage.getItem('userRole')
      
      setDebugInfo(`
🔍 EMAIL: ${user.email}
🔍 SUPER CHECK: ${isSuper ? '✅ MATCH' : '❌ NO MATCH'}  
🔍 CACHED ROLE: ${cached}
🔍 EXPECTED: ${isSuper ? 'superadmin' : 'other'}
      `.trim())
    }
    
    checkRole()
  }, [])

  if (!debugInfo) return null

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-100 border-b-2 border-red-300 p-2 text-xs z-50">
      <pre className="text-center">{debugInfo}</pre>
    </div>
  )
}