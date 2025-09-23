'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestCreate() {
  const [email, setEmail] = useState('pharmacist123@test.com')
  const [password, setPassword] = useState('123')
  const [name, setName] = useState('Test Pharmacist')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const testCreatePharmacist = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/pharmacist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          full_name: name,
          phone: '+250788123456',
          role: 'pharmacist',
          pharmacy_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
        })
      })
      
      const data = await response.json()
      
      setResult(`API Response:
Status: ${response.status}
Success: ${response.ok}
Message: ${data.message || 'None'}
Error: ${data.error || 'None'}
User ID: ${data.user?.id || 'None'}`)
    } catch (err) {
      setResult(`❌ Request failed: ${err}`)
    }
    setLoading(false)
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Test Pharmacist Creation</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Create Test Pharmacist</CardTitle>
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
          <Input 
            placeholder="Name" 
            value={name} 
            onChange={(e) => setName(e.target.value)}
          />
          
          <Button onClick={testCreatePharmacist} disabled={loading}>
            Create Pharmacist
          </Button>
          
          <div className="bg-gray-100 p-4 rounded">
            <pre className="text-sm">{result || 'No results yet'}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}