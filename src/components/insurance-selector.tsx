'use client'

import { useEffect, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface InsuranceProvider {
  id: string
  name: string
  coverage_percentage: number
  is_active: boolean
}

interface InsuranceSelectorProps {
  value: string
  onValueChange: (value: string) => void
  coveragePercent?: number
}

export function InsuranceSelector({ value, onValueChange, coveragePercent }: InsuranceSelectorProps) {
  const [insuranceOptions, setInsuranceOptions] = useState<Array<{ value: string; label: string; coverage?: number }>>([{ value: 'cash', label: 'Cash (No Insurance)' }])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInsuranceProviders = async () => {
      try {
        const response = await fetch('/api/insurance')
        if (response.ok) {
          const providers: InsuranceProvider[] = await response.json()
          const options = [
            { value: 'cash', label: 'Cash (No Insurance)' },
            ...providers.map(provider => ({
              value: provider.name,
              label: `${provider.name} Coverage`,
              coverage: provider.coverage_percentage
            }))
          ]
          setInsuranceOptions(options)
        }
      } catch (error) {
        console.error('Failed to fetch insurance providers:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInsuranceProviders()
  }, [])

  return (
    <div className="space-y-2">
      <Select value={value} onValueChange={onValueChange} disabled={loading}>
        <SelectTrigger className="text-xs">
          <SelectValue placeholder={loading ? "Loading..." : "Select insurance type"} />
        </SelectTrigger>
        <SelectContent>
          {insuranceOptions.map((option) => (
            <SelectItem key={option.value} value={option.value} className="text-xs">
              <div className="flex items-center justify-between w-full">
                <span>{option.label}</span>
                {option.coverage && (
                  <Badge variant="secondary" className="ml-2 text-[10px]">
                    {option.coverage}%
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {value && coveragePercent && (
        <div className="text-xs text-muted-foreground">
          Selected: {value} with {coveragePercent}% coverage
        </div>
      )}
    </div>
  )
}