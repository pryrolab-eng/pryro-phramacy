'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  useInsuranceProviders,
  useUploadInsurancePricingMutation,
} from '@/hooks/useInsuranceProviders'
import { toast } from 'sonner'

async function parseExcelFile(file: File): Promise<Record<string, number>> {
  const XLSX = await import('xlsx')
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) return {}

  const sheet = workbook.Sheets[sheetName]
  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })

  const priceList: Record<string, number> = {}

  for (const row of rows) {
    const keys = Object.keys(row)
    const nameKey = keys.find((k) =>
      /^(name|medication|drug|product|item)$/i.test(k.trim()),
    ) ?? keys[0]

    const priceKey = keys.find((k) =>
      /^(price|cost|amount|rate|coverage)$/i.test(k.trim()),
    ) ?? keys[1]

    const name = String(row[nameKey] ?? '').trim()
    if (!name) continue

    const rawPrice = priceKey ? Number(row[priceKey]) : 0
    priceList[name] = Number.isFinite(rawPrice) ? rawPrice : 0
  }

  return priceList
}

export function InsurancePriceManager() {
  const [selectedInsurance, setSelectedInsurance] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const providersQuery = useInsuranceProviders()
  const uploadMutation = useUploadInsurancePricingMutation()
  const insuranceProviders = providersQuery.data ?? []
  const loading = providersQuery.isPending

  const handleFileUpload = async () => {
    if (!file || !selectedInsurance) return

    const priceList = await parseExcelFile(file)
    const entries = Object.keys(priceList)

    if (entries.length === 0) {
      toast.error('No medication data found', {
        description: 'The file should have a "name" column and a "price" column.',
      })
      return
    }

    const result = await uploadMutation.mutateAsync({
      insurance: selectedInsurance,
      priceList,
    })

    if (result.upserted > 0) {
      toast.success(`${result.upserted} medications updated`)
    }
    if (result.errors?.length) {
      toast.warning(`${result.errors.length} items skipped`, {
        description: result.errors.slice(0, 3).join('; '),
      })
    }
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
        Upload Excel files with insurance price lists. Expected columns: <strong>name</strong> (medication name) and <strong>price</strong> (coverage amount). Only products already in your inventory will be updated.
      </div>
    </div>
  )
}
