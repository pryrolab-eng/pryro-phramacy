'use client'

import { useState } from 'react'
import { createClient } from '../../../supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestAuth() {
  const [email, setEmail] = useState('abdousentore@gmail.com')
  const [password, setPassword] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const testLogin = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        setResult(`❌ Login failed: ${error.message}`)
      } else {
        setResult(`✅ Login successful: ${data.user?.email}`)
        // Use server action for proper redirect
        const formData = new FormData()
        formData.append('email', email)
        formData.append('password', password)
        
        const response = await fetch('/api/auth/signin', {
          method: 'POST',
          body: formData
        })
        
        if (response.redirected) {
          window.location.href = response.url
        } else {
          window.location.href = '/dashboard'
        }
      }
    } catch (err) {
      setResult(`❌ Error: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    setResult(`Session: ${session ? `✅ ${session.user.email}` : '❌ No session'}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Test Supabase Auth</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          
          <div className="flex gap-2">
            <Button onClick={testLogin} disabled={loading}>
              {loading ? 'Logging in...' : 'Test Login'}
            </Button>
            <Button onClick={checkSession} variant="outline">
              Check Session
            </Button>
          </div>

          {result && (
            <div className="p-3 bg-gray-100 rounded text-sm">
              {result}
            </div>
          )}

          <div className="text-xs text-gray-600">
            <p>Test: abdousentore@gmail.com</p>
            <p>Password: (enter your password)</p>
            <p className="mt-2">Or use regular sign-in: <a href="/sign-in" className="text-blue-600">/sign-in</a></p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}