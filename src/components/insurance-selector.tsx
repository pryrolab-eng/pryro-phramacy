'use client'

import { useMemo } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useInsuranceProviders } from '@/hooks/useInsuranceProviders'

interface InsuranceSelectorProps {
  value: string
  onValueChange: (value: string) => void
  coveragePercent?: number
}

export function InsuranceSelector({ value, onValueChange, coveragePercent }: InsuranceSelectorProps) {
  const providersQuery = useInsuranceProviders()
  const loading = providersQuery.isPending

  const insuranceOptions = useMemo((): Array<{
    value: string
    label: string
    coverage?: number
  }> => {
    const providers = providersQuery.data ?? []
    return [
      { value: 'cash', label: 'Cash (No Insurance)' },
      ...providers.map((provider) => ({
        value: String(provider.name ?? provider.id),
        label: `${provider.name ?? provider.id} Coverage`,
        coverage:
          typeof provider.coverage_percentage === 'number'
            ? provider.coverage_percentage
            : undefined,
      })),
    ]
  }, [providersQuery.data])

  return (
    <div className="space-y-2">
      <Select value={value} onValueChange={onValueChange} disabled={loading}>
        <SelectTrigger className="text-xs">
          <SelectValue placeholder={loading ? "Loading..." : "Select insurance type"} />
        </SelectTrigger>
        <SelectContent className="z-[110]">
          {insuranceOptions.map((option) => (
            <SelectItem key={option.value} value={option.value} className="text-xs">
              <div className="flex items-center justify-between w-full">
                <span>{option.label}</span>
                {option.coverage != null && (
                  <Badge variant="secondary" className="ml-2 text-[10px]">
                    {option.coverage}%
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {value !== 'cash' && coveragePercent != null && coveragePercent > 0 ? (
        <div className="text-xs text-muted-foreground">
          Selected: {value} with {coveragePercent}% coverage
        </div>
      ) : null}
    </div>
  )
}
