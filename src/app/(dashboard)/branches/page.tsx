'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Building2, Plus, MapPin, Phone, User, ArrowRightLeft } from 'lucide-react'

interface Branch {
  id: string
  name: string
  code: string
  address: string
  phone: string
  manager_name: string
  is_main: boolean
  is_active: boolean
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [isAddingBranch, setIsAddingBranch] = useState(false)
  const [transferDialogOpen, setTransferDialogOpen] = useState(false)
  const [newBranch, setNewBranch] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    manager_name: '',
    is_main: false
  })

  useEffect(() => {
    fetchBranches()
  }, [])

  const fetchBranches = async () => {
    try {
      const response = await fetch('/api/branches')
      if (response.ok) {
        const data = await response.json()
        setBranches(data)
      }
    } catch (error) {
      setBranches([
        { id: '1', name: 'Main Branch', code: 'MAIN', address: 'Kigali City Center', phone: '+250788123456', manager_name: 'John Doe', is_main: true, is_active: true },
        { id: '2', name: 'Remera Branch', code: 'REM', address: 'Remera, Gasabo', phone: '+250788123457', manager_name: 'Jane Smith', is_main: false, is_active: true }
      ])
    }
  }

  const handleAddBranch = async () => {
    try {
      const response = await fetch('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newBranch, pharmacy_id: 'current-pharmacy-id' })
      })
      if (response.ok) {
        fetchBranches()
        setIsAddingBranch(false)
        setNewBranch({ name: '', code: '', address: '', phone: '', manager_name: '', is_main: false })
      }
    } catch (error) {
      alert('Failed to add branch')
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Branch Management</h1>
          <p className="text-muted-foreground">Manage multiple pharmacy locations</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setTransferDialogOpen(true)} variant="outline">
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            Stock Transfer
          </Button>
          <Dialog open={isAddingBranch} onOpenChange={setIsAddingBranch}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Branch
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Branch</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Branch Name</Label>
                    <Input 
                      placeholder="e.g. Remera Branch"
                      value={newBranch.name}
                      onChange={(e) => setNewBranch({...newBranch, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Branch Code</Label>
                    <Input 
                      placeholder="e.g. REM"
                      value={newBranch.code}
                      onChange={(e) => setNewBranch({...newBranch, code: e.target.value.toUpperCase()})}
                    />
                  </div>
                </div>
                <div>
                  <Label>Address</Label>
                  <Input 
                    placeholder="Full address"
                    value={newBranch.address}
                    onChange={(e) => setNewBranch({...newBranch, address: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Phone</Label>
                    <Input 
                      placeholder="+250788123456"
                      value={newBranch.phone}
                      onChange={(e) => setNewBranch({...newBranch, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Manager Name</Label>
                    <Input 
                      placeholder="Manager name"
                      value={newBranch.manager_name}
                      onChange={(e) => setNewBranch({...newBranch, manager_name: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isMain"
                    checked={newBranch.is_main}
                    onChange={(e) => setNewBranch({...newBranch, is_main: e.target.checked})}
                  />
                  <Label htmlFor="isMain">Main Branch</Label>
                </div>
                <Button onClick={handleAddBranch} className="w-full">Add Branch</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {branches.map((branch) => (
          <Card key={branch.id} className={branch.is_main ? 'border-blue-500' : ''}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {branch.name}
                </div>
                <div className="flex gap-1">
                  {branch.is_main && <Badge variant="default">Main</Badge>}
                  <Badge variant={branch.is_active ? "default" : "secondary"}>
                    {branch.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                Code: {branch.code}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {branch.address}
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {branch.phone}
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  {branch.manager_name}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => {
                  setNewBranch({
                    name: branch.name,
                    code: branch.code,
                    address: branch.address,
                    phone: branch.phone,
                    manager_name: branch.manager_name,
                    is_main: branch.is_main
                  })
                  setIsAddingBranch(true)
                }}>Edit</Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={async () => {
                  try {
                    const response = await fetch(`/api/branches/${branch.id}`)
                    if (response.ok) {
                      const inventory = await response.json()
                      alert(`${branch.name} Stock:\n\n${inventory.map((item: any) => `${item.name}: ${item.stock} units`).join('\n') || 'No inventory found'}`)
                    }
                  } catch (error) {
                    alert('Failed to fetch stock')
                  }
                }}>View Stock</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Stock Transfer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>From Branch</Label>
                <select className="w-full p-2 border rounded">
                  <option>Select branch</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>To Branch</Label>
                <select className="w-full p-2 border rounded">
                  <option>Select branch</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label>Product</Label>
              <Input placeholder="Search product..." />
            </div>
            <div>
              <Label>Quantity</Label>
              <Input type="number" placeholder="Enter quantity" />
            </div>
            <div>
              <Label>Notes</Label>
              <Input placeholder="Transfer reason or notes" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setTransferDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={() => { alert('Transfer request submitted!'); setTransferDialogOpen(false) }} className="flex-1">
                Submit Transfer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}