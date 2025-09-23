'use client'

import { useState } from 'react'
import { createClient } from '../../../supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DebugSupabase() {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const checkAuth = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setResult(`Current user: ${user?.email || 'None'}`)
    } catch (err) {
      setResult(`Auth check failed: ${err}`)
    }
    setLoading(false)
  }

  const testSignup = async () => {
    setLoading(true)
    const testEmail = `user${Date.now()}@gmail.com`
    try {
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: '123456'
      })
      
      setResult(`SIGNUP TEST:
Email: ${testEmail}
User created: ${!!data.user}
User ID: ${data.user?.id || 'None'}
Error: ${error?.message || 'None'}
Session: ${!!data.session}`)
    } catch (err) {
      setResult(`Signup failed: ${err}`)
    }
    setLoading(false)
  }

  const checkPharmacyUsers = async () => {
    setLoading(true)
    try {
      const { data: pharmacies } = await supabase.from('pharmacies').select('id, name')
      const { data: users } = await supabase.from('pharmacy_users').select('*')
      
      setResult(`PHARMACIES TABLE:
${JSON.stringify(pharmacies, null, 2)}

PHARMACY_USERS TABLE:
${JSON.stringify(users, null, 2)}`)
    } catch (err) {
      setResult(`Query failed: ${err}`)
    }
    setLoading(false)
  }

  const testInsert = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('pharmacy_users')
        .insert({
          pharmacy_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          user_id: '12345678-1234-1234-1234-123456789012',
          role: 'pharmacist',
          is_active: true
        })
        .select()
      
      setResult(`INSERT TEST:
Success: ${!!data}
Error: ${error?.message || 'None'}
Data: ${JSON.stringify(data, null, 2)}`)
    } catch (err) {
      setResult(`Insert failed: ${err}`)
    }
    setLoading(false)
  }

  const checkEnv = () => {
    setResult(`ENVIRONMENT:
Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL || 'Missing'}
Anon Key: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Missing'}`)
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Supabase Debug Console</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Debug Tests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={checkEnv} disabled={loading}>
              Check Environment
            </Button>
            <Button onClick={checkAuth} disabled={loading}>
              Check Auth
            </Button>
            <Button onClick={testSignup} disabled={loading}>
              Test Signup
            </Button>
            <Button onClick={checkPharmacyUsers} disabled={loading}>
              Check Table
            </Button>
            <Button onClick={testInsert} disabled={loading}>
              Test Insert
            </Button>
          </div>
          
          <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
            <pre>{result || 'Click a button to run tests...'}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}