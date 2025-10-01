'use client'

import { useState } from 'react'
import { createClient } from '../../../supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestRLS() {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const testRLS = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setResult('❌ No user - login first')
        return
      }

      // Test users table access
      const { data: userData, error: userTableError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      // Test pharmacy_users table access  
      const { data: pharmacyData, error: pharmacyError } = await supabase
        .from('pharmacy_users')
        .select('*')
        .eq('user_id', user.id)

      setResult(`
USER: ${user.email} (${user.id})

USERS TABLE:
${userTableError ? `❌ ${userTableError.message}` : `✅ ${JSON.stringify(userData, null, 2)}`}

PHARMACY_USERS TABLE:
${pharmacyError ? `❌ ${pharmacyError.message}` : `✅ ${JSON.stringify(pharmacyData, null, 2)}`}
      `)
    } catch (error) {
      setResult(`❌ Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>RLS Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testRLS} disabled={loading}>
            Test Database Access
          </Button>

          {result && (
            <div className="p-4 bg-gray-100 rounded">
              <pre className="text-sm whitespace-pre-wrap">{result}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}