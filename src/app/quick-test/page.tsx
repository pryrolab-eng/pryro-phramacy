'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function QuickTest() {
  const [email, setEmail] = useState('newuser@gmail.com')
  const [password, setPassword] = useState('123')
  const [result, setResult] = useState('')

  const testCreate = async () => {
    try {
      const response = await fetch('/api/pharmacist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          full_name: 'Test User',
          phone: '+250788123456',
          role: 'pharmacist'
        })
      })
      
      const text = await response.text()
      setResult(`Status: ${response.status}\n\nResponse:\n${text}`)
    } catch (err) {
      setResult(`Error: ${err}`)
    }
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">Quick Pharmacist Test</h1>
      <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
      <Button onClick={testCreate}>Create Pharmacist</Button>
      <pre className="bg-gray-100 p-4 rounded text-sm">{result}</pre>
    </div>
  )
}