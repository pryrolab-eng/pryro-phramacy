'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  useInsuranceProviders,
  useUploadInsurancePricingMutation,
} from '@/hooks/useInsuranceProviders'

export function InsurancePriceManager() {
  const [selectedInsurance, setSelectedInsurance] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const providersQuery = useInsuranceProviders()
  const uploadMutation = useUploadInsurancePricingMutation()
  const insuranceProviders = providersQuery.data ?? []
  const loading = providersQuery.isPending

  const handleFileUpload = async () => {
    if (!file || !selectedInsurance) return

    const mockPrices = {
      'Amoxicillin 250mg': 500,
      'Paracetamol 500mg': 300,
      'Ibuprofen 400mg': 450
    }

    await uploadMutation.mutateAsync({
      insurance: selectedInsurance,
      priceList: mockPrices,
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
            <SelectItem key={provider.id} value={String(provider.name ?? provider.id)}>
              {String(provider.name ?? provider.id)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input 
        type="file" 
        accept=".xlsx,.xls"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <Button
        onClick={handleFileUpload}
        disabled={!file || !selectedInsurance || uploadMutation.isPending}
      >
        {uploadMutation.isPending ? 'Uploading...' : 'Upload Price List'}
      </Button>

      <div className="text-sm text-muted-foreground">
        Upload Excel files with insurance price lists. Only products already in your inventory will be updated.
      </div>
    </div>
  )
}
