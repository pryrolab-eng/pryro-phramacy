'use client'

import { useState } from 'react'
import { createClient } from '../../../supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestSupabase() {
  const [email, setEmail] = useState('test@example.com')
  const [password, setPassword] = useState('123')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const testConnection = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('pharmacy_users').select('count').limit(1)
      setResult(`✅ Connection OK. Error: ${error?.message || 'None'}`)
    } catch (err) {
      setResult(`❌ Connection failed: ${err}`)
    }
    setLoading(false)
  }

  const testSignup = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: 'Test User' } }
      })
      
      setResult(`Signup result:
User ID: ${data?.user?.id || 'None'}
Email: ${data?.user?.email || 'None'}
Error: ${error?.message || 'None'}
Session: ${data?.session ? 'Yes' : 'No'}`)
    } catch (err) {
      setResult(`❌ Signup failed: ${err}`)
    }
    setLoading(false)
  }

  const testPharmacyUsers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('pharmacy_users')
        .select('*')
        .limit(5)
      
      setResult(`Pharmacy users table:
Count: ${data?.length || 0}
Error: ${error?.message || 'None'}
Data: ${JSON.stringify(data, null, 2)}`)
    } catch (err) {
      setResult(`❌ Query failed: ${err}`)
    }
    setLoading(false)
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Supabase Test Page</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Test User Creation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input 
            placeholder="Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
          />
          
          <div className="flex space-x-2">
            <Button onClick={testConnection} disabled={loading}>
              Test Connection
            </Button>
            <Button onClick={testSignup} disabled={loading}>
              Test Signup
            </Button>
            <Button onClick={testPharmacyUsers} disabled={loading}>
              Check pharmacy_users
            </Button>
          </div>
          
          <div className="bg-gray-100 p-4 rounded">
            <pre className="text-sm">{result || 'No results yet'}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}