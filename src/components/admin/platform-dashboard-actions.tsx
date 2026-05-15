'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { FileText, Plus, Shield } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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

  return (
    <div className="flex flex-wrap gap-2">
      <Dialog open={isAddingPharmacy} onOpenChange={setIsAddingPharmacy}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Pharmacy
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Pharmacy</DialogTitle>
            <DialogDescription>Create a pharmacy and owner account</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Pharmacy Name</Label>
              <Input
                value={newPharmacy.name}
                onChange={(e) => setNewPharmacy({ ...newPharmacy, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Address</Label>
              <Input
                value={newPharmacy.address}
                onChange={(e) => setNewPharmacy({ ...newPharmacy, address: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Owner Name</Label>
                <Input
                  value={newPharmacy.owner_name}
                  onChange={(e) =>
                    setNewPharmacy({ ...newPharmacy, owner_name: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Owner Email</Label>
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
                  onChange={(e) => setNewPharmacy({ ...newPharmacy, phone: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Owner Password</Label>
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
              <Label>Subscription Plan</Label>
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
                <Label>Insurance Providers</Label>
                <div className="max-h-36 space-y-2 overflow-y-auto rounded-md border p-3">
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
                          handleInsuranceChange(String(provider.id), e.target.checked)
                        }
                      />
                      {String(provider.name ?? 'Provider')}
                    </label>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              onClick={handleAddPharmacy}
              disabled={
                saving ||
                !newPharmacy.name ||
                !newPharmacy.owner_email ||
                !newPharmacy.owner_password
              }
            >
              {saving ? 'Creating…' : 'Create Pharmacy'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddingInsurance} onOpenChange={setIsAddingInsurance}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Shield className="mr-2 h-4 w-4" />
            Add Insurance
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Insurance Provider</DialogTitle>
            <DialogDescription>
              Create a global insurance provider for pharmacies
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Insurance Name</Label>
                <Input
                  value={newInsurance.name}
                  onChange={(e) => setNewInsurance({ ...newInsurance, name: e.target.value })}
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
                <Label>Contact Email</Label>
                <Input
                  type="email"
                  value={newInsurance.contact_email}
                  onChange={(e) =>
                    setNewInsurance({ ...newInsurance, contact_email: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Contact Phone</Label>
                <Input
                  value={newInsurance.contact_phone}
                  onChange={(e) =>
                    setNewInsurance({ ...newInsurance, contact_phone: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Policy Number</Label>
              <Input
                value={newInsurance.policy_number}
                onChange={(e) =>
                  setNewInsurance({ ...newInsurance, policy_number: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Invoice Template</Label>
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
              <Button variant="outline" asChild className="w-full">
                <Link href="/admin/insurance-templates" target="_blank">
                  <FileText className="mr-2 h-4 w-4" />
                  Open Template Designer
                </Link>
              </Button>
            ) : null}
          </div>
          <DialogFooter>
            <Button onClick={handleAddInsurance} disabled={saving || !newInsurance.name}>
              {saving ? 'Adding…' : 'Add Insurance Provider'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
