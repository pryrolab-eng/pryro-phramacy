'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Settings, Save, Shield, Bell, Globe, Database, Users, Building2, BarChart3, Zap, Key, Monitor, AlertTriangle, FileText, Plus } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Spinner } from '@/components/ui/spinner'

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [stockLocations, setStockLocations] = useState([])
  const [isAddLocationOpen, setIsAddLocationOpen] = useState(false)
  const [newLocation, setNewLocation] = useState({ name: '', description: '' })
  const [settings, setSettings] = useState({
    platformName: 'Pryrox',
    adminEmail: 'admin@pryrox.com',
    maxPharmacies: 100,
    enableRegistrations: true,
    enableNotifications: true,
    maintenanceMode: false,
    backupEnabled: true,
    autoUpdates: true,
    maxUsersPerPharmacy: 50,
    apiRateLimit: 1000,
    enableWhiteLabel: true,
    enableMultiBranch: true,
    dataRetentionDays: 2555,
    enableAuditLogs: true,
    ssoEnabled: false,
    encryptionEnabled: true
  })

  useEffect(() => {
    const loadData = async () => {
      await fetchStockLocations()
      const timer = setTimeout(() => setLoading(false), 600)
      return () => clearTimeout(timer)
    }
    loadData()
  }, [])

  const fetchStockLocations = async () => {
    try {
      const response = await fetch('/api/settings/locations')
      if (response.ok) {
        const data = await response.json()
        setStockLocations(data)
      }
    } catch (error) {
      console.error('Error fetching locations:', error)
    }
  }

  const handleAddLocation = async () => {
    try {
      const response = await fetch('/api/settings/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLocation)
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        await fetchStockLocations()
        setIsAddLocationOpen(false)
        setNewLocation({ name: '', description: '' })
        alert('Location added successfully!')
      } else {
        alert(result.error || 'Failed to add location')
      }
    } catch (error) {
      console.error('Error adding location:', error)
      alert('Failed to add location')
    }
  }

  const handleSave = () => {
    alert('Settings saved successfully!')
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Spinner className="size-6" />
    </div>
  )

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <SidebarTrigger />
            <div className="h-4 w-px bg-border" />
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Settings className="h-8 w-8 text-blue-600" />
              Admin Settings
            </h1>
          </div>
          <p className="text-gray-600">Configure platform settings and preferences</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Platform Configuration
              </CardTitle>
              <CardDescription>Basic platform settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Platform Name</Label>
                <Input
                  value={settings.platformName}
                  onChange={(e) => setSettings({...settings, platformName: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label>Admin Email</Label>
                <Input
                  type="email"
                  value={settings.adminEmail}
                  onChange={(e) => setSettings({...settings, adminEmail: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label>Maximum Pharmacies</Label>
                <Input
                  type="number"
                  value={settings.maxPharmacies}
                  onChange={(e) => setSettings({...settings, maxPharmacies: Number(e.target.value)})}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Multi-Tenant Settings
              </CardTitle>
              <CardDescription>Tenant and user management</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Max Users per Pharmacy</Label>
                <Input
                  type="number"
                  value={settings.maxUsersPerPharmacy}
                  onChange={(e) => setSettings({...settings, maxUsersPerPharmacy: Number(e.target.value)})}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enable Multi-Branch</p>
                  <p className="text-sm text-muted-foreground">Allow multiple locations per pharmacy</p>
                </div>
                <Switch
                  checked={settings.enableMultiBranch}
                  onCheckedChange={(checked) => setSettings({...settings, enableMultiBranch: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">White-label Features</p>
                  <p className="text-sm text-muted-foreground">Custom branding per tenant</p>
                </div>
                <Switch
                  checked={settings.enableWhiteLabel}
                  onCheckedChange={(checked) => setSettings({...settings, enableWhiteLabel: checked})}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                API & Integration Limits
              </CardTitle>
              <CardDescription>Rate limits and API management</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>API Rate Limit (requests/hour)</Label>
                <Input
                  type="number"
                  value={settings.apiRateLimit}
                  onChange={(e) => setSettings({...settings, apiRateLimit: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Payment Gateway</p>
                    <p className="text-sm text-muted-foreground">Active integrations: 3</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Insurance APIs</p>
                    <p className="text-sm text-muted-foreground">Active integrations: 2</p>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security & Access
              </CardTitle>
              <CardDescription>Security and access control settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enable New Registrations</p>
                  <p className="text-sm text-muted-foreground">Allow new pharmacy registrations</p>
                </div>
                <Switch
                  checked={settings.enableRegistrations}
                  onCheckedChange={(checked) => setSettings({...settings, enableRegistrations: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">SSO Integration</p>
                  <p className="text-sm text-muted-foreground">Single sign-on support</p>
                </div>
                <Switch
                  checked={settings.ssoEnabled}
                  onCheckedChange={(checked) => setSettings({...settings, ssoEnabled: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Data Encryption</p>
                  <p className="text-sm text-muted-foreground">AES-256 encryption</p>
                </div>
                <Switch
                  checked={settings.encryptionEnabled}
                  onCheckedChange={(checked) => setSettings({...settings, encryptionEnabled: checked})}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Compliance & Audit
              </CardTitle>
              <CardDescription>Regulatory compliance settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Data Retention (days)</Label>
                <Input
                  type="number"
                  value={settings.dataRetentionDays}
                  onChange={(e) => setSettings({...settings, dataRetentionDays: Number(e.target.value)})}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Audit Logging</p>
                  <p className="text-sm text-muted-foreground">Track all system activities</p>
                </div>
                <Switch
                  checked={settings.enableAuditLogs}
                  onCheckedChange={(checked) => setSettings({...settings, enableAuditLogs: checked})}
                />
              </div>
              <Button variant="outline" className="w-full">
                <FileText className="mr-2 h-4 w-4" />
                Download Compliance Report
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                System Operations
              </CardTitle>
              <CardDescription>Operational settings and monitoring</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Maintenance Mode</p>
                  <p className="text-sm text-muted-foreground">Put platform in maintenance mode</p>
                </div>
                <Switch
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => setSettings({...settings, maintenanceMode: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enable Notifications</p>
                  <p className="text-sm text-muted-foreground">Send system notifications</p>
                </div>
                <Switch
                  checked={settings.enableNotifications}
                  onCheckedChange={(checked) => setSettings({...settings, enableNotifications: checked})}
                />
              </div>
              <Button variant="outline" className="w-full">
                <AlertTriangle className="mr-2 h-4 w-4" />
                System Health Dashboard
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                System Management
              </CardTitle>
              <CardDescription>System backup and update settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Automatic Backups</p>
                  <p className="text-sm text-muted-foreground">Enable daily system backups</p>
                </div>
                <Switch
                  checked={settings.backupEnabled}
                  onCheckedChange={(checked) => setSettings({...settings, backupEnabled: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Automatic Updates</p>
                  <p className="text-sm text-muted-foreground">Enable automatic system updates</p>
                </div>
                <Switch
                  checked={settings.autoUpdates}
                  onCheckedChange={(checked) => setSettings({...settings, autoUpdates: checked})}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>System Load</span>
                  <span>45%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{width: '45%'}}></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Stock Locations
              </CardTitle>
              <CardDescription>Manage warehouse and branch locations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {stockLocations.length > 0 ? (
                  stockLocations.map((location: any) => (
                    <div key={location.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{location.name}</p>
                        <p className="text-sm text-muted-foreground">{location.description}</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    No locations found. Add your first location.
                  </div>
                )}
              </div>
              <Button className="w-full" onClick={() => setIsAddLocationOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add New Location
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Platform Analytics
              </CardTitle>
              <CardDescription>Usage statistics and insights</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">47</div>
                  <div className="text-sm text-muted-foreground">Active Pharmacies</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">234</div>
                  <div className="text-sm text-muted-foreground">Total Users</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>API Usage</span>
                  <span>78%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{width: '78%'}}></div>
                </div>
              </div>
              <Button variant="outline" className="w-full">
                <BarChart3 className="mr-2 h-4 w-4" />
                View Detailed Analytics
              </Button>
            </CardContent>
          </Card>

        </div>
        
        <div className="flex justify-end pt-6">
          <Button onClick={handleSave} className="w-32">
            <Save className="mr-2 h-4 w-4" />
            Save Settings
          </Button>
        </div>
      </div>

      {/* Add Location Dialog */}
      <Dialog open={isAddLocationOpen} onOpenChange={setIsAddLocationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Location</DialogTitle>
            <DialogDescription>Create a new stock location</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Location Name</Label>
              <Input
                placeholder="e.g. Downtown Branch"
                value={newLocation.name}
                onChange={(e) => setNewLocation({...newLocation, name: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Input
                placeholder="e.g. City center location"
                value={newLocation.description}
                onChange={(e) => setNewLocation({...newLocation, description: e.target.value})}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsAddLocationOpen(false)}>Cancel</Button>
            <Button onClick={handleAddLocation} disabled={!newLocation.name}>
              Add Location
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}