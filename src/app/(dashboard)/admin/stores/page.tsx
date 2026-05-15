'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Search, Plus, Eye, Edit, Trash2 } from "lucide-react";
import { Spinner } from '@/components/ui/spinner';
import { adminPharmaciesQueryKey, useAdminPharmacies, useInsuranceProviders } from '@/hooks'
import {
  createAdminPharmacy,
  deleteAdminPharmacy,
  updateAdminPharmacy,
} from '@/lib/http/admin/pharmacies'

export default function PharmacyManagementPage() {
  const queryClient = useQueryClient()
  const pharmaciesQuery = useAdminPharmacies()
  const insuranceQuery = useInsuranceProviders()
  const [isAddingPharmacy, setIsAddingPharmacy] = useState(false)
  const [isViewingPharmacy, setIsViewingPharmacy] = useState(false)
  const [isEditingPharmacy, setIsEditingPharmacy] = useState(false)
  const [selectedPharmacy, setSelectedPharmacy] = useState<any>(null)
  const [newPharmacy, setNewPharmacy] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    license_number: '',
    owner_name: '',
    owner_email: '',
    owner_password: '',
    subscription_plan: 'free',
    insurance_providers: []
  })

  const handleInsuranceChange = (insuranceId: string, checked: boolean) => {
    if (checked) {
      setNewPharmacy({
        ...newPharmacy,
        insurance_providers: [...newPharmacy.insurance_providers, insuranceId]
      })
    } else {
      setNewPharmacy({
        ...newPharmacy,
        insurance_providers: newPharmacy.insurance_providers.filter(id => id !== insuranceId)
      })
    }
  }

  const pharmacies = pharmaciesQuery.data ?? []
  const insurance = insuranceQuery.data ?? []
  const loading = pharmaciesQuery.isPending || insuranceQuery.isPending

  const handleAddPharmacy = async () => {
    try {
      await createAdminPharmacy(newPharmacy as Record<string, unknown>)
      await queryClient.invalidateQueries({ queryKey: adminPharmaciesQueryKey })
      setIsAddingPharmacy(false)
      setNewPharmacy({
        name: '', address: '', phone: '', email: '', license_number: '',
        owner_name: '', owner_email: '', owner_password: '', subscription_plan: 'free',
        insurance_providers: []
      })
      alert('Pharmacy added successfully!')
    } catch (error) {
      console.error('Error adding pharmacy:', error)
      alert(error instanceof Error ? error.message : 'Error adding pharmacy. Please try again.')
    }
  }

  const handleEditPharmacy = async () => {
    if (!selectedPharmacy?.id) return
    try {
      await updateAdminPharmacy(
        selectedPharmacy.id,
        selectedPharmacy as Record<string, unknown>,
      )
      await queryClient.invalidateQueries({ queryKey: adminPharmaciesQueryKey })
      setIsEditingPharmacy(false)
      setSelectedPharmacy(null)
      alert('Pharmacy updated successfully!')
    } catch (error) {
      console.error('Error updating pharmacy:', error)
      alert(error instanceof Error ? error.message : 'Failed to update pharmacy')
    }
  }

  const handleDeletePharmacy = async (id: string) => {
    if (confirm('Are you sure you want to delete this pharmacy?')) {
      try {
        await deleteAdminPharmacy(id)
        await queryClient.invalidateQueries({ queryKey: adminPharmaciesQueryKey })
        alert('Pharmacy deleted successfully!')
      } catch (error) {
        console.error('Error deleting pharmacy:', error)
        alert(error instanceof Error ? error.message : 'Failed to delete pharmacy')
      }
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Spinner className="size-6" />
    </div>
  )

  return (
    <div className="p-6">


        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Building2 className="h-8 w-8 text-blue-600" />
              Pharmacy Management
            </h1>
            <p className="text-gray-600">Manage all registered pharmacies</p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Registered Pharmacies</CardTitle>
                  <CardDescription>View and manage all pharmacies</CardDescription>
                </div>
                <Dialog open={isAddingPharmacy} onOpenChange={setIsAddingPharmacy}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Pharmacy
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add New Pharmacy</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="grid gap-2">
                          <Label>Pharmacy Name</Label>
                          <Input
                            value={newPharmacy.name}
                            onChange={(e) => setNewPharmacy({...newPharmacy, name: e.target.value})}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>License Number</Label>
                          <Input
                            value={newPharmacy.license_number}
                            onChange={(e) => setNewPharmacy({...newPharmacy, license_number: e.target.value})}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Subscription Plan</Label>
                          <Select value={newPharmacy.subscription_plan} onValueChange={(value) => setNewPharmacy({...newPharmacy, subscription_plan: value})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="free">Free</SelectItem>
                              <SelectItem value="standard">Standard</SelectItem>
                              <SelectItem value="premium">Premium</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid gap-2">
                        <Label>Address</Label>
                        <Input
                          value={newPharmacy.address}
                          onChange={(e) => setNewPharmacy({...newPharmacy, address: e.target.value})}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>Phone</Label>
                          <Input
                            value={newPharmacy.phone}
                            onChange={(e) => setNewPharmacy({...newPharmacy, phone: e.target.value})}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Email</Label>
                          <Input
                            type="email"
                            value={newPharmacy.email}
                            onChange={(e) => setNewPharmacy({...newPharmacy, email: e.target.value})}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="grid gap-2">
                          <Label>Owner Name</Label>
                          <Input
                            value={newPharmacy.owner_name}
                            onChange={(e) => setNewPharmacy({...newPharmacy, owner_name: e.target.value})}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Owner Email</Label>
                          <Input
                            type="email"
                            value={newPharmacy.owner_email}
                            onChange={(e) => setNewPharmacy({...newPharmacy, owner_email: e.target.value})}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Owner Password</Label>
                          <PasswordInput
                            value={newPharmacy.owner_password}
                            onChange={(e) => setNewPharmacy({...newPharmacy, owner_password: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label>Insurance Providers</Label>
                        <div className="space-y-3 max-h-40 overflow-y-auto border rounded p-3">
                          {insurance.map(provider => (
                            <div key={provider.id} className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`insurance-${provider.id}`}
                                  checked={newPharmacy.insurance_providers.includes(provider.id)}
                                  onChange={(e) => handleInsuranceChange(provider.id, e.target.checked)}
                                />
                                <label htmlFor={`insurance-${provider.id}`} className="text-sm font-medium">
                                  {provider.name}
                                </label>
                              </div>
                              {newPharmacy.insurance_providers.includes(provider.id) && (
                                <div className="ml-6 space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span>Coverage: {provider.coverage_percentage}%</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={provider.coverage_percentage}
                                    onChange={(e) => {
                                      const updatedInsurance = insurance.map(ins => 
                                        ins.id === provider.id 
                                          ? {...ins, coverage_percentage: Number(e.target.value)}
                                          : ins
                                      )
                                      setInsurance(updatedInsurance)
                                    }}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      <Button onClick={handleAddPharmacy} disabled={!newPharmacy.name || !newPharmacy.owner_email} className="w-full sm:w-auto">
                        Add Pharmacy
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-6">
                <Input placeholder="Search pharmacies..." className="flex-1" />
                <Button variant="outline" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                {pharmacies.map((pharmacy) => (
                  <div key={pharmacy.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-lg">{pharmacy.name}</h3>
                        <p className="text-sm text-gray-600">{pharmacy.license_number}</p>
                        <p className="text-sm text-gray-500">{pharmacy.address}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-800">
                          {pharmacy.status || 'active'}
                        </Badge>
                        <Badge className="bg-blue-100 text-blue-800">
                          {pharmacy.subscription_plan}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                      <div>
                        <span className="text-gray-600">Phone:</span>
                        <p className="font-medium">{pharmacy.phone}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Email:</span>
                        <p className="font-medium">{pharmacy.email}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Created:</span>
                        <p className="font-medium">{new Date(pharmacy.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => {
                        setSelectedPharmacy(pharmacy)
                        setIsViewingPharmacy(true)
                      }}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        setSelectedPharmacy({
                          ...pharmacy,
                          insurance_providers: pharmacy.insurance_providers || [],
                          owner_name: pharmacy.owner_name || '',
                          owner_email: pharmacy.owner_email || pharmacy.email || '',
                          new_password: ''
                        })
                        setIsEditingPharmacy(true)
                      }}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => handleDeletePharmacy(pharmacy.id)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* View Dialog */}
        <Dialog open={isViewingPharmacy} onOpenChange={setIsViewingPharmacy}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pharmacy Details</DialogTitle>
            </DialogHeader>
            {selectedPharmacy && (
              <div className="space-y-4">
                <div><strong>Name:</strong> {selectedPharmacy.name}</div>
                <div><strong>License:</strong> {selectedPharmacy.license_number}</div>
                <div><strong>Address:</strong> {selectedPharmacy.address}</div>
                <div><strong>Phone:</strong> {selectedPharmacy.phone}</div>
                <div><strong>Email:</strong> {selectedPharmacy.email}</div>
                <div><strong>Plan:</strong> {selectedPharmacy.subscription_plan}</div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditingPharmacy} onOpenChange={setIsEditingPharmacy}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Pharmacy</DialogTitle>
            </DialogHeader>
            {selectedPharmacy && (
              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label>Pharmacy Name</Label>
                    <Input
                      value={selectedPharmacy.name || ''}
                      onChange={(e) => setSelectedPharmacy({...selectedPharmacy, name: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>License Number</Label>
                    <Input
                      value={selectedPharmacy.license_number || ''}
                      onChange={(e) => setSelectedPharmacy({...selectedPharmacy, license_number: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Subscription Plan</Label>
                    <Select value={selectedPharmacy.subscription_plan || 'free'} onValueChange={(value) => setSelectedPharmacy({...selectedPharmacy, subscription_plan: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label>Address</Label>
                  <Input
                    value={selectedPharmacy.address || ''}
                    onChange={(e) => setSelectedPharmacy({...selectedPharmacy, address: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Phone</Label>
                    <Input
                      value={selectedPharmacy.phone || ''}
                      onChange={(e) => setSelectedPharmacy({...selectedPharmacy, phone: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={selectedPharmacy.email || ''}
                      onChange={(e) => setSelectedPharmacy({...selectedPharmacy, email: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label>Owner Name</Label>
                    <Input
                      value={selectedPharmacy.owner_name || ''}
                      onChange={(e) => setSelectedPharmacy({...selectedPharmacy, owner_name: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Owner Email</Label>
                    <Input
                      type="email"
                      value={selectedPharmacy.owner_email || selectedPharmacy.email || ''}
                      onChange={(e) => setSelectedPharmacy({...selectedPharmacy, owner_email: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>New Password (optional)</Label>
                    <PasswordInput
                      placeholder="Leave blank to keep current password"
                      value={selectedPharmacy.new_password || ''}
                      onChange={(e) => setSelectedPharmacy({...selectedPharmacy, new_password: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label>Insurance Providers</Label>
                  <div className="space-y-3 max-h-40 overflow-y-auto border rounded p-3">
                    {insurance.map(provider => (
                      <div key={provider.id} className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`edit-insurance-${provider.id}`}
                            checked={selectedPharmacy.insurance_providers?.includes(provider.id) || false}
                            onChange={(e) => {
                              const currentProviders = selectedPharmacy.insurance_providers || []
                              if (e.target.checked) {
                                setSelectedPharmacy({
                                  ...selectedPharmacy,
                                  insurance_providers: [...currentProviders, provider.id]
                                })
                              } else {
                                setSelectedPharmacy({
                                  ...selectedPharmacy,
                                  insurance_providers: currentProviders.filter(id => id !== provider.id)
                                })
                              }
                            }}
                          />
                          <label htmlFor={`edit-insurance-${provider.id}`} className="text-sm font-medium">
                            {provider.name}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Button onClick={handleEditPharmacy} className="w-full sm:w-auto">
                  Save Changes
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

    </div>
  );
}
