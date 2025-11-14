'use client'

import { useState } from 'react'
import { createClient } from '../../../supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DebugRateLimit() {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const testRateLimit = async () => {
    setLoading(true)
    const results = []
    
    for (let i = 0; i < 10; i++) {
      try {
        const start = Date.now()
        const { data, error } = await supabase.auth.getUser()
        const duration = Date.now() - start
        
        results.push(`Request ${i + 1}: ${error ? `ERROR: ${error.message}` : 'SUCCESS'} (${duration}ms)`)
        
        if (error?.message.includes('rate limit')) {
          results.push('🚨 RATE LIMIT HIT!')
          break
        }
      } catch (err) {
        results.push(`Request ${i + 1}: FAILED - ${err}`)
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    setResult(results.join('\n'))
    setLoading(false)
  }

  const checkSupabaseStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch('https://status.supabase.com/api/v2/status.json')
      const status = await response.json()
      setResult(`Supabase Status: ${status.status.description}\nLast Updated: ${status.page.updated_at}`)
    } catch (err) {
      setResult(`Failed to check Supabase status: ${err}`)
    }
    setLoading(false)
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Rate Limit Debug</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Rate Limit Tests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Button onClick={testRateLimit} disabled={loading}>
              Test Rate Limit (10 requests)
            </Button>
            <Button onClick={checkSupabaseStatus} disabled={loading}>
              Check Supabase Status
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