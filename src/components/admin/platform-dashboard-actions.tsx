'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { FileText, Plus, Shield } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogTrigger,
  DashboardButton,
  DashboardDialogContent,
  DashboardDialogHeader,
  DashboardDialogTitle,
  DashboardDialogDescription,
  DashboardDialogBody,
  DashboardDialogActions,
  DashboardToolbar,
} from '@/components/dashboard'
import {
  adminPharmaciesQueryKey,
  adminReportsSummaryQueryKey,
  insuranceProvidersQueryKey,
  useInsuranceProviders,
} from '@/hooks'
import { createAdminPharmacy } from '@/lib/http/admin/pharmacies'
import { createInsuranceProvider } from '@/lib/http/insurance'

const emptyPharmacy = {
  name: '',
  address: '',
  phone: '',
  email: '',
  license_number: '',
  owner_name: '',
  owner_email: '',
  owner_password: '',
  subscription_plan: 'free',
  insurance_providers: [] as string[],
}

const emptyInsurance = {
  name: '',
  coverage_percentage: 80,
  contact_email: '',
  contact_phone: '',
  policy_number: '',
  invoice_template: 'default',
}

export function PlatformDashboardActions() {
  const queryClient = useQueryClient()
  const insuranceQuery = useInsuranceProviders()
  const [isAddingPharmacy, setIsAddingPharmacy] = useState(false)
  const [isAddingInsurance, setIsAddingInsurance] = useState(false)
  const [newPharmacy, setNewPharmacy] = useState(emptyPharmacy)
  const [newInsurance, setNewInsurance] = useState(emptyInsurance)
  const [saving, setSaving] = useState(false)

  const insurance = insuranceQuery.data ?? []

  const invalidateDashboard = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: adminPharmaciesQueryKey }),
      queryClient.invalidateQueries({ queryKey: adminReportsSummaryQueryKey }),
      queryClient.invalidateQueries({ queryKey: insuranceProvidersQueryKey }),
    ])
  }

  const handleInsuranceChange = (insuranceId: string, checked: boolean) => {
    setNewPharmacy((prev) => ({
      ...prev,
      insurance_providers: checked
        ? [...prev.insurance_providers, insuranceId]
        : prev.insurance_providers.filter((id) => id !== insuranceId),
    }))
  }

  const handleAddPharmacy = async () => {
    setSaving(true)
    try {
      await createAdminPharmacy(newPharmacy as Record<string, unknown>)
      await invalidateDashboard()
      setIsAddingPharmacy(false)
      setNewPharmacy({ ...emptyPharmacy, insurance_providers: [] })
    } catch (error) {
      console.error('Error adding pharmacy:', error)
      alert(error instanceof Error ? error.message : 'Failed to create pharmacy')
    } finally {
      setSaving(false)
    }
  }

  const handleAddInsurance = async () => {
    setSaving(true)
    try {
      await createInsuranceProvider({
        name: newInsurance.name,
        coverage_percentage: newInsurance.coverage_percentage,
        contact_email: newInsurance.contact_email || undefined,
        contact_phone: newInsurance.contact_phone || undefined,
        policy_number: newInsurance.policy_number || undefined,
        invoice_template: newInsurance.invoice_template,
      })
      await invalidateDashboard()
      setIsAddingInsurance(false)
      setNewInsurance(emptyInsurance)
    } catch (error) {
      console.error('Error adding insurance:', error)
      alert(error instanceof Error ? error.message : 'Failed to add insurance provider')
    } finally {
      setSaving(false)
    }
  }

  const pharmacyFormValid =
    Boolean(newPharmacy.name) &&
    Boolean(newPharmacy.owner_email) &&
    Boolean(newPharmacy.owner_password)

  return (
    <DashboardToolbar className="w-auto border-0 bg-transparent p-0 shadow-none">
      <Dialog open={isAddingPharmacy} onOpenChange={setIsAddingPharmacy}>
        <DialogTrigger asChild>
          <DashboardButton tone="primary">
            <Plus className="mr-2 h-4 w-4" strokeWidth={1.75} />
            Add pharmacy
          </DashboardButton>
        </DialogTrigger>
        <DashboardDialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DashboardDialogHeader>
            <DashboardDialogTitle>Add pharmacy</DashboardDialogTitle>
            <DashboardDialogDescription>
              Create a pharmacy and owner account
            </DashboardDialogDescription>
          </DashboardDialogHeader>
          <DashboardDialogBody className="max-h-none overflow-visible">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Pharmacy name</Label>
                <Input
                  value={newPharmacy.name}
                  onChange={(e) => setNewPharmacy({ ...newPharmacy, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Address</Label>
                <Input
                  value={newPharmacy.address}
                  onChange={(e) =>
                    setNewPharmacy({ ...newPharmacy, address: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Owner name</Label>
                  <Input
                    value={newPharmacy.owner_name}
                    onChange={(e) =>
                      setNewPharmacy({ ...newPharmacy, owner_name: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Owner email</Label>
                  <Input
                    type="email"
                    value={newPharmacy.owner_email}
                    onChange={(e) =>
                      setNewPharmacy({ ...newPharmacy, owner_email: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Phone</Label>
                  <Input
                    value={newPharmacy.phone}
                    onChange={(e) =>
                      setNewPharmacy({ ...newPharmacy, phone: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Owner password</Label>
                  <PasswordInput
                    value={newPharmacy.owner_password}
                    onChange={(e) =>
                      setNewPharmacy({ ...newPharmacy, owner_password: e.target.value })
                    }
                    placeholder="Minimum 8 characters"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Subscription plan</Label>
                <Select
                  value={newPharmacy.subscription_plan}
                  onValueChange={(value) =>
                    setNewPharmacy({ ...newPharmacy, subscription_plan: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free / Trial</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {insurance.length > 0 ? (
                <div className="grid gap-2">
                  <Label>Insurance providers</Label>
                  <div className="max-h-36 space-y-2 overflow-y-auto rounded-lg border border-neutral-200/80 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
                    {insurance.map((provider) => (
                      <label
                        key={String(provider.id)}
                        className="flex cursor-pointer items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={newPharmacy.insurance_providers.includes(
                            String(provider.id),
                          )}
                          onChange={(e) =>
                            handleInsuranceChange(
                              String(provider.id),
                              e.target.checked,
                            )
                          }
                        />
                        {String(provider.name ?? 'Provider')}
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </DashboardDialogBody>
          <DashboardDialogActions
            cancelLabel="Cancel"
            confirmLabel="Create pharmacy"
            onCancel={() => setIsAddingPharmacy(false)}
            onConfirm={handleAddPharmacy}
            confirmDisabled={!pharmacyFormValid}
            confirmLoading={saving}
          />
        </DashboardDialogContent>
      </Dialog>

      <Dialog open={isAddingInsurance} onOpenChange={setIsAddingInsurance}>
        <DialogTrigger asChild>
          <DashboardButton tone="outline">
            <Shield className="mr-2 h-4 w-4" strokeWidth={1.75} />
            Add insurance
          </DashboardButton>
        </DialogTrigger>
        <DashboardDialogContent className="max-w-2xl">
          <DashboardDialogHeader>
            <DashboardDialogTitle>Add insurance provider</DashboardDialogTitle>
            <DashboardDialogDescription>
              Create a global insurance provider for pharmacies
            </DashboardDialogDescription>
          </DashboardDialogHeader>
          <DashboardDialogBody className="max-h-none overflow-visible">
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Insurance name</Label>
                  <Input
                    value={newInsurance.name}
                    onChange={(e) =>
                      setNewInsurance({ ...newInsurance, name: e.target.value })
                    }
                    placeholder="e.g. RSSB, MMI"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Coverage %</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={newInsurance.coverage_percentage}
                    onChange={(e) =>
                      setNewInsurance({
                        ...newInsurance,
                        coverage_percentage: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Contact email</Label>
                  <Input
                    type="email"
                    value={newInsurance.contact_email}
                    onChange={(e) =>
                      setNewInsurance({
                        ...newInsurance,
                        contact_email: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Contact phone</Label>
                  <Input
                    value={newInsurance.contact_phone}
                    onChange={(e) =>
                      setNewInsurance({
                        ...newInsurance,
                        contact_phone: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Policy number</Label>
                <Input
                  value={newInsurance.policy_number}
                  onChange={(e) =>
                    setNewInsurance({
                      ...newInsurance,
                      policy_number: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Invoice template</Label>
                <Select
                  value={newInsurance.invoice_template}
                  onValueChange={(value) =>
                    setNewInsurance({ ...newInsurance, invoice_template: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="rssb">RSSB</SelectItem>
                    <SelectItem value="mmi">MMI</SelectItem>
                    <SelectItem value="radiant">Radiant</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newInsurance.invoice_template === 'custom' ? (
                <DashboardButton tone="outline" className="w-full" asChild>
                  <Link href="/admin/insurance-templates" target="_blank">
                    <FileText className="mr-2 h-4 w-4" strokeWidth={1.75} />
                    Open template designer
                  </Link>
                </DashboardButton>
              ) : null}
            </div>
          </DashboardDialogBody>
          <DashboardDialogActions
            cancelLabel="Cancel"
            confirmLabel="Add provider"
            onCancel={() => setIsAddingInsurance(false)}
            onConfirm={handleAddInsurance}
            confirmDisabled={!newInsurance.name}
            confirmLoading={saving}
          />
        </DashboardDialogContent>
      </Dialog>
    </DashboardToolbar>
  )
}
