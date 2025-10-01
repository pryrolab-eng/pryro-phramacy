'use client'

import { useState } from 'react'
import { createClient } from '../../supabase/client'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

export default function DatabaseRoleChecker() {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const checkCurrentUser = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setResult('No user logged in')
        return
      }

      // Check users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      // Check pharmacy_users table
      const { data: pharmacyUserData, error: pharmacyError } = await supabase
        .from('pharmacy_users')
        .select('*')
        .eq('user_id', user.id)

      setResult(`
CURRENT USER: ${user.email}
USER ID: ${user.id}

USERS TABLE:
${userError ? `Error: ${userError.message}` : userData ? JSON.stringify(userData, null, 2) : 'No record found'}

PHARMACY_USERS TABLE:
${pharmacyError ? `Error: ${pharmacyError.message}` : pharmacyUserData ? JSON.stringify(pharmacyUserData, null, 2) : 'No records found'}

EXPECTED FOR SUPER ADMIN:
- Email: abdousentore@gmail.com
- users.role: 'super_admin' OR hardcoded email check
- No pharmacy_users record needed
      `)
    } catch (error) {
      setResult(`Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const fixSuperAdminRole = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user || user.email !== 'abdousentore@gmail.com') {
        setResult('Must be logged in as abdousentore@gmail.com to fix role')
        return
      }

      // Insert or update user in users table with super_admin role
      const { data, error } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email,
          role: 'super_admin',
          full_name: user.user_metadata?.full_name || 'Super Admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (error) {
        setResult(`Error fixing role: ${error.message}`)
      } else {
        setResult('✅ Super admin role fixed in database!')
        // Clear session storage to force role refresh
        sessionStorage.removeItem('userRole')
      }
    } catch (error) {
      setResult(`Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-4xl mx-auto m-6">
      <CardHeader>
        <CardTitle>Database Role Checker</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={checkCurrentUser} disabled={loading}>
            Check Current User Roles
          </Button>
          <Button onClick={fixSuperAdminRole} disabled={loading} variant="outline">
            Fix Super Admin Role
          </Button>
        </div>

        {result && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <pre className="text-sm whitespace-pre-wrap overflow-auto">{result}</pre>
          </div>
        )}

        <div className="mt-6 p-4 bg-yellow-50 rounded">
          <h3 className="font-semibold mb-2">Database Schema Check:</h3>
          <p className="text-sm">
            For super admin to work properly, we need either:
            <br />1. <strong>Hardcoded email check</strong> (current approach)
            <br />2. <strong>Database role</strong>: users table with role = 'super_admin'
          </p>
        </div>
      </CardContent>
    </Card>
  )
}