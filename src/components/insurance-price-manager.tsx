'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface InsuranceProvider {
  id: string
  name: string
  coverage_percentage: number
  is_active: boolean
}

export function InsurancePriceManager() {
  const [selectedInsurance, setSelectedInsurance] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [insuranceProviders, setInsuranceProviders] = useState<InsuranceProvider[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInsuranceProviders = async () => {
      try {
        const response = await fetch('/api/insurance')
        if (response.ok) {
          const providers: InsuranceProvider[] = await response.json()
          setInsuranceProviders(providers)
        }
      } catch (error) {
        console.error('Failed to fetch insurance providers:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInsuranceProviders()
  }, [])

  const handleFileUpload = async () => {
    if (!file || !selectedInsurance) return

    // Parse Excel file (simplified - would use a library like xlsx)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('insurance', selectedInsurance)

    // Mock price extraction from Excel
    const mockPrices = {
      'Amoxicillin 250mg': 500,
      'Paracetamol 500mg': 300,
      'Ibuprofen 400mg': 450
    }

    await fetch('/api/insurance/pricing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        insurance: selectedInsurance,
        priceList: mockPrices
      })
    })
  }

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-xl font-bold">Insurance Price Management</h2>
      
      <Select value={selectedInsurance} onValueChange={setSelectedInsurance} disabled={loading}>
        <SelectTrigger>
          <SelectValue placeholder={loading ? "Loading..." : "Select Insurance"} />
        </SelectTrigger>
        <SelectContent>
          {insuranceProviders.map((provider) => (
            <SelectItem key={provider.id} value={provider.name}>
              {provider.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input 
        type="file" 
        accept=".xlsx,.xls"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <Button onClick={handleFileUpload} disabled={!file || !selectedInsurance}>
        Upload Price List
      </Button>

      <div className="text-sm text-muted-foreground">
        Upload Excel files with insurance price lists. Only products already in your inventory will be updated.
      </div>
    </div>
  )
}