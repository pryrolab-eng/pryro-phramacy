'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface InsuranceSelectorProps {
  value: string
  onValueChange: (value: string) => void
  coveragePercent?: number
}

export function InsuranceSelector({ value, onValueChange, coveragePercent }: InsuranceSelectorProps) {
  const insuranceOptions = [
    { value: 'cash', label: 'Cash Payment (No Insurance)' },
    { value: 'RAMA', label: 'RAMA - 100% Coverage', coverage: 100 },
    { value: 'MMI', label: 'MMI - 85% Coverage', coverage: 85 },
    { value: 'RSSB', label: 'RSSB - 90% Coverage', coverage: 90 },
    { value: 'Radiant', label: 'Radiant - 80% Coverage', coverage: 80 }
  ]

  return (
    <div className="space-y-2">
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select insurance type" />
        </SelectTrigger>
        <SelectContent>
          {insuranceOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center justify-between w-full">
                <span>{option.label}</span>
                {option.coverage && (
                  <Badge variant="secondary" className="ml-2">
                    {option.coverage}%
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {value && coveragePercent && (
        <div className="text-sm text-muted-foreground">
          Selected: {value} with {coveragePercent}% coverage
        </div>
      )}
    </div>
  )
}