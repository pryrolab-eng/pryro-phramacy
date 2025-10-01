'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../supabase/client'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

export default function LiveSidebarTest() {
  const [debugInfo, setDebugInfo] = useState('')
  const [userRole, setUserRole] = useState('')
  const supabase = createClient()

  const runSidebarLogic = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      let role = 'pharmacy_owner'
      let debugSteps = []
      
      debugSteps.push(`1. Got user: ${user?.email || 'No user'}`)
      
      if (user) {
        debugSteps.push(`2. Checking if email === 'abdousentore@gmail.com'`)
        debugSteps.push(`   Email: "${user.email}"`)
        debugSteps.push(`   Match: ${user.email === 'abdousentore@gmail.com'}`)
        
        if (user.email === 'abdousentore@gmail.com') {
          role = 'superadmin'
          debugSteps.push(`3. ✅ Set role to 'superadmin'`)
        } else {
          debugSteps.push(`3. ❌ Email doesn't match, checking pharmacy_users table`)
          
          const { data: pharmacyUser, error } = await supabase
            .from('pharmacy_users')
            .select('role')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .single()
          
          debugSteps.push(`4. Pharmacy user query result:`)
          debugSteps.push(`   Data: ${JSON.stringify(pharmacyUser)}`)
          debugSteps.push(`   Error: ${error?.message || 'None'}`)
          
          if (pharmacyUser?.role) {
            role = pharmacyUser.role
            debugSteps.push(`5. ✅ Set role to '${pharmacyUser.role}' from pharmacy_users`)
          } else {
            role = 'pharmacist'
            debugSteps.push(`5. ❌ No pharmacy role found, defaulting to 'pharmacist'`)
          }
        }
      }
      
      debugSteps.push(`\nFINAL ROLE: ${role}`)
      debugSteps.push(`CACHED ROLE: ${sessionStorage.getItem('userRole')}`)
      
      setUserRole(role)
      setDebugInfo(debugSteps.join('\n'))
      
    } catch (error) {
      setDebugInfo(`Error: ${error}`)
    }
  }

  const clearCache = () => {
    sessionStorage.removeItem('userRole')
    setDebugInfo('Cache cleared. Refresh page or run test again.')
  }

  useEffect(() => {
    runSidebarLogic()
  }, [])

  return (
    <Card className="max-w-4xl mx-auto m-6">
      <CardHeader>
        <CardTitle>Live Sidebar Logic Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={runSidebarLogic}>Run Sidebar Logic</Button>
          <Button onClick={clearCache} variant="outline">Clear Cache</Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Expected Navigation:</h3>
            <div className="text-sm">
              {userRole === 'superadmin' ? (
                <ul className="space-y-1">
                  <li>• Dashboard (/superadmin)</li>
                  <li>• Admin Panel (/admin)</li>
                  <li>• Pharmacy List (/admin/stores)</li>
                  <li>• Categories (/admin/categories)</li>
                  <li>• Template Designer</li>
                  <li>• Subscriptions</li>
                  <li>• Reports</li>
                </ul>
              ) : (
                <ul className="space-y-1">
                  <li>• Pharmacy Dashboard</li>
                  <li>• Inventory</li>
                  <li>• POS</li>
                  <li>• Sales</li>
                  <li>• Customers</li>
                  <li>• Branches</li>
                  <li>• Staff Manage</li>
                  <li>• Settings</li>
                </ul>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Role Info:</h3>
            <div className="text-sm">
              <p><strong>Detected Role:</strong> {userRole}</p>
              <p><strong>Should be:</strong> {userRole === 'superadmin' ? '✅ Super Admin' : '❌ Super Admin'}</p>
            </div>
          </div>
        </div>

        {debugInfo && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <h3 className="font-semibold mb-2">Debug Steps:</h3>
            <pre className="text-sm whitespace-pre-wrap">{debugInfo}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}