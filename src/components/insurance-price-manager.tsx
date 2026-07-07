'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, FileSpreadsheet, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useApplyFormularyCoverageMutation,
  useInsuranceProviders,
} from '@/hooks/useInsuranceProviders'
import { useInventoryList } from '@/hooks/useInventory'
import { toast } from 'sonner'
import { parseExcelFile } from '@/lib/import/parse-excel'
import { downloadImportTemplate } from '@/lib/import/templates'
import {
  INSURANCE_IMPORT_COLUMNS,
  validateInsuranceImportRows,
} from '@/lib/import/insurance-rows'
import {
  buildFormularyMatchPreviews,
  shouldAutoConfirmMatch,
  type FormularyMatchPreview,
  type MatchConfidence,
} from '@/lib/import/medication-name-match'
import { cn } from '@/lib/utils'

type Props = {
  autoOpen?: boolean
}

type ReviewRow = FormularyMatchPreview & {
  selectedMedicationId: string
  confirmed: boolean
}

const CONFIDENCE_LABEL: Record<MatchConfidence, string> = {
  exact: 'Exact',
  high: 'High',
  medium: 'Review',
  low: 'Weak',
  none: 'No match',
}

const CONFIDENCE_CLASS: Record<MatchConfidence, string> = {
  exact: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  high: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
  medium: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
  low: 'bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200',
  none: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
}

export function InsurancePriceManager({ autoOpen = false }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedInsurance, setSelectedInsurance] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [reviewRows, setReviewRows] = useState<ReviewRow[]>([])
  const [step, setStep] = useState<'upload' | 'review'>('upload')

  const providersQuery = useInsuranceProviders()
  const inventoryQuery = useInventoryList()
  const applyMutation = useApplyFormularyCoverageMutation()
  const insuranceProviders = providersQuery.data ?? []
  const loading = providersQuery.isPending

  const catalog = useMemo(() => {
    const seen = new Map<string, string>()
    for (const row of inventoryQuery.data ?? []) {
      const medicationId = row.medicationId || row.id
      if (!seen.has(medicationId)) {
        seen.set(medicationId, row.name)
      }
    }
    return Array.from(seen.entries()).map(([medicationId, name]) => ({
      medicationId,
      name,
    }))
  }, [inventoryQuery.data])

  const confirmedCount = useMemo(
    () => reviewRows.filter((row) => row.confirmed && row.selectedMedicationId).length,
    [reviewRows],
  )

  useEffect(() => {
    if (autoOpen) {
      fileInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [autoOpen])

  const handleReviewMatches = async () => {
    if (!file || !selectedInsurance) return

    if (catalog.length === 0) {
      toast.error('Import inventory first', {
        description: 'Your product catalog is empty. Add stock before loading a formulary.',
      })
      return
    }

    try {
      const jsonData = await parseExcelFile(file)
      const { rows, errors } = validateInsuranceImportRows(jsonData)
      if (errors.length > 0) {
        toast.error('Fix template errors first', {
          description: errors.slice(0, 3).join('; '),
        })
        return
      }

      if (rows.length === 0) {
        toast.error('No medication rows found in file')
        return
      }

      const previews = buildFormularyMatchPreviews({
        rows: rows.map((row) => ({
          insurerName: row.Name,
          insurerCode: row.Code || undefined,
          referencePrice: row.Price || undefined,
        })),
        catalog,
      })

      setReviewRows(
        previews.map((preview) => ({
          ...preview,
          selectedMedicationId: preview.suggested?.medicationId ?? '',
          confirmed:
            shouldAutoConfirmMatch(preview.suggested) &&
            Boolean(preview.suggested?.medicationId),
        })),
      )
      setStep('review')
    } catch {
      toast.error('Could not read Excel file')
    }
  }

  const handleApplyConfirmed = async () => {
    if (!selectedInsurance) return

    const items = reviewRows
      .filter((row) => row.confirmed && row.selectedMedicationId)
      .map((row) => ({
        medicationId: row.selectedMedicationId,
        externalCode: row.insurerCode,
      }))

    if (items.length === 0) {
      toast.error('Select at least one match to apply')
      return
    }

    const result = await applyMutation.mutateAsync({
      insurance: selectedInsurance,
      items,
    })

    if (result.failures?.length) {
      toast.warning(`Applied ${result.applied} of ${items.length}`, {
        description: result.failures.slice(0, 2).map((f) => f.error).join('; '),
      })
    } else {
      toast.success(`Coverage applied for ${result.applied} products`)
    }

    if (result.applied > 0) {
      setStep('upload')
      setFile(null)
      setReviewRows([])
    }
  }

  const updateRow = (rowNumber: number, patch: Partial<ReviewRow>) => {
    setReviewRows((rows) =>
      rows.map((row) => (row.rowNumber === rowNumber ? { ...row, ...patch } : row)),
    )
  }

  if (step === 'review') {
    return (
      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
              Review matches before applying
            </p>
            <p className="text-sm text-muted-foreground">
              Confirm each insurer line maps to the right product in your catalog.
              {confirmedCount} of {reviewRows.length} selected.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={() => setStep('upload')}>
            Back
          </Button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>Insurer formulary</TableHead>
                <TableHead>Match</TableHead>
                <TableHead>Your catalog product</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviewRows.map((row) => {
                const selected =
                  row.alternatives.find((c) => c.medicationId === row.selectedMedicationId) ??
                  row.suggested
                const confidence = selected?.confidence ?? 'none'

                return (
                  <TableRow key={row.rowNumber}>
                    <TableCell>
                      <Checkbox
                        checked={row.confirmed}
                        disabled={!row.selectedMedicationId}
                        onCheckedChange={(checked) =>
                          updateRow(row.rowNumber, { confirmed: Boolean(checked) })
                        }
                        aria-label={`Include ${row.insurerName}`}
                      />
                    </TableCell>
                    <TableCell className="min-w-[12rem]">
                      <p className="font-medium">{row.insurerName}</p>
                      {row.insurerCode ? (
                        <p className="text-xs text-muted-foreground">Code: {row.insurerCode}</p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={cn('font-normal', CONFIDENCE_CLASS[confidence])}>
                        {CONFIDENCE_LABEL[confidence]}
                        {selected ? ` · ${selected.score}%` : ''}
                      </Badge>
                    </TableCell>
                    <TableCell className="min-w-[16rem]">
                      <Select
                        value={row.selectedMedicationId || undefined}
                        onValueChange={(medicationId) => {
                          const candidate =
                            row.alternatives.find((c) => c.medicationId === medicationId) ??
                            null
                          updateRow(row.rowNumber, {
                            selectedMedicationId: medicationId,
                            confirmed: shouldAutoConfirmMatch(candidate),
                          })
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose catalog product" />
                        </SelectTrigger>
                        <SelectContent>
                          {row.alternatives.length > 0 ? (
                            row.alternatives.map((candidate) => (
                              <SelectItem
                                key={candidate.medicationId}
                                value={candidate.medicationId}
                              >
                                {candidate.name} ({candidate.score}%)
                              </SelectItem>
                            ))
                          ) : (
                            catalog.map((item) => (
                              <SelectItem key={item.medicationId} value={item.medicationId}>
                                {item.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setReviewRows((rows) =>
                rows.map((row) => ({
                  ...row,
                  confirmed:
                    Boolean(row.selectedMedicationId) &&
                    shouldAutoConfirmMatch(
                      row.alternatives.find(
                        (c) => c.medicationId === row.selectedMedicationId,
                      ) ?? row.suggested,
                    ),
                })),
              )
            }}
          >
            Auto-select strong matches
          </Button>
          <Button
            type="button"
            onClick={() => void handleApplyConfirmed()}
            disabled={applyMutation.isPending || confirmedCount === 0}
            className="sm:ml-auto"
          >
            {applyMutation.isPending ? (
              'Applying…'
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Apply {confirmedCount} confirmed
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4 sm:p-5">
      <Select value={selectedInsurance} onValueChange={setSelectedInsurance} disabled={loading}>
        <SelectTrigger>
          <SelectValue placeholder={loading ? 'Loading...' : 'Select insurer'} />
        </SelectTrigger>
        <SelectContent>
          {insuranceProviders.map((provider) => (
            <SelectItem key={provider.id} value={String(provider.name ?? provider.id)}>
              {String(provider.name ?? provider.id)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => void downloadImportTemplate('insurance')}
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Download template
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mr-2 h-4 w-4" />
          {file ? file.name : 'Choose file'}
        </Button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <Button
        onClick={() => void handleReviewMatches()}
        disabled={
          !file ||
          !selectedInsurance ||
          inventoryQuery.isPending ||
          inventoryQuery.isFetching
        }
        className="w-full sm:w-auto"
      >
        Review matches
      </Button>

      <p className="text-sm text-muted-foreground">
        Columns: {INSURANCE_IMPORT_COLUMNS.join(', ')}. Pryrox suggests matches from your
        catalog — you confirm before coverage is applied.
      </p>
    </div>
  )
}
