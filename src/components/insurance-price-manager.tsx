'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function InsurancePriceManager() {
  const [selectedInsurance, setSelectedInsurance] = useState('')
  const [file, setFile] = useState<File | null>(null)

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
      
      <Select value={selectedInsurance} onValueChange={setSelectedInsurance}>
        <SelectTrigger>
          <SelectValue placeholder="Select Insurance" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="MMI">MMI</SelectItem>
          <SelectItem value="RSSB">RSSB</SelectItem>
          <SelectItem value="Radiant">Radiant</SelectItem>
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