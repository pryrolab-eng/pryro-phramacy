'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pill, Plus, Clock, CheckCircle, AlertCircle, User, Calendar } from 'lucide-react'
import { SidebarTrigger } from '@/components/ui/sidebar'

interface Prescription {
  id: string
  patient: string
  doctor: string
  medications: string[]
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'completed' | 'dispensed'
  time: string
  insurance: string
  created_at: string
}

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddingPrescription, setIsAddingPrescription] = useState(false)
  const [newPrescription, setNewPrescription] = useState({
    patient: '',
    doctor: '',
    medications: '',
    priority: 'medium',
    insurance: ''
  })

  useEffect(() => {
    fetchPrescriptions()
  }, [])

  const fetchPrescriptions = async () => {
    try {
      const response = await fetch('/api/prescriptions')
      if (response.ok) {
        const data = await response.json()
        setPrescriptions(data)
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddPrescription = async () => {
    try {
      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPrescription,
          medications: newPrescription.medications.split(',').map(m => m.trim())
        })
      })
      
      if (response.ok) {
        await fetchPrescriptions()
        setIsAddingPrescription(false)
        setNewPrescription({ patient: '', doctor: '', medications: '', priority: 'medium', insurance: '' })
        alert('Prescription added successfully!')
      }
    } catch (error) {
      console.error('Error adding prescription:', error)
    }
  }

  const updatePrescriptionStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/prescriptions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      
      if (response.ok) {
        await fetchPrescriptions()
      }
    } catch (error) {
      console.error('Error updating prescription:', error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'dispensed': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) return <div className="p-6">Loading prescriptions...</div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div className="h-4 w-px bg-border" />
          <div>
            <h1 className="text-3xl font-bold">Prescriptions</h1>
            <p className="text-muted-foreground">Manage patient prescriptions and dispensing</p>
          </div>
        </div>
        <Dialog open={isAddingPrescription} onOpenChange={setIsAddingPrescription}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Prescription
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Prescription</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Patient Name</Label>
                <Input
                  value={newPrescription.patient}
                  onChange={(e) => setNewPrescription({...newPrescription, patient: e.target.value})}
                  placeholder="Enter patient name"
                />
              </div>
              <div className="grid gap-2">
                <Label>Doctor</Label>
                <Input
                  value={newPrescription.doctor}
                  onChange={(e) => setNewPrescription({...newPrescription, doctor: e.target.value})}
                  placeholder="Enter doctor name"
                />
              </div>
              <div className="grid gap-2">
                <Label>Medications (comma separated)</Label>
                <Textarea
                  value={newPrescription.medications}
                  onChange={(e) => setNewPrescription({...newPrescription, medications: e.target.value})}
                  placeholder="Paracetamol 500mg, Amoxicillin 250mg"
                />
              </div>
              <div className="grid gap-2">
                <Label>Priority</Label>
                <Select value={newPrescription.priority} onValueChange={(value) => setNewPrescription({...newPrescription, priority: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Insurance</Label>
                <Select value={newPrescription.insurance} onValueChange={(value) => setNewPrescription({...newPrescription, insurance: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RSSB">RSSB</SelectItem>
                    <SelectItem value="MMI">MMI</SelectItem>
                    <SelectItem value="Radiant">Radiant</SelectItem>
                    <SelectItem value="None">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddPrescription} disabled={!newPrescription.patient || !newPrescription.doctor}>
                Add Prescription
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5 text-orange-500" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{prescriptions.filter(p => p.status === 'pending').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="mr-2 h-5 w-5 text-blue-500" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{prescriptions.filter(p => p.status === 'completed').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
              Dispensed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{prescriptions.filter(p => p.status === 'dispensed').length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Prescriptions</CardTitle>
          <CardDescription>Manage and track prescription status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {prescriptions.map((prescription) => (
              <div key={prescription.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Pill className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{prescription.patient}</p>
                    <p className="text-sm text-muted-foreground">
                      <User className="inline h-3 w-3 mr-1" />
                      Dr. {prescription.doctor} • 
                      <Calendar className="inline h-3 w-3 ml-2 mr-1" />
                      {prescription.time}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {prescription.medications.slice(0, 2).map((med, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {med}
                        </Badge>
                      ))}
                      {prescription.medications.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{prescription.medications.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <div className="flex space-x-2">
                    <Badge className={getPriorityColor(prescription.priority)}>
                      {prescription.priority}
                    </Badge>
                    <Badge className={getStatusColor(prescription.status)}>
                      {prescription.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{prescription.insurance}</p>
                  <div className="flex space-x-1">
                    {prescription.status === 'pending' && (
                      <Button size="sm" onClick={() => updatePrescriptionStatus(prescription.id, 'completed')}>
                        Complete
                      </Button>
                    )}
                    {prescription.status === 'completed' && (
                      <Button size="sm" onClick={() => updatePrescriptionStatus(prescription.id, 'dispensed')}>
                        Dispense
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {prescriptions.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No prescriptions found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}