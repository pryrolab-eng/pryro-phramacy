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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Pill, Plus, Clock, CheckCircle, AlertCircle, User, Calendar, Search, Filter, Download, ArrowUpRight, FileText, Users } from 'lucide-react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Spinner } from '@/components/ui/spinner'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

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
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddingPrescription, setIsAddingPrescription] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
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

  useEffect(() => {
    filterPrescriptions()
  }, [prescriptions, searchTerm, statusFilter])

  const fetchPrescriptions = async () => {
    try {
      const response = await fetch('/api/prescriptions')
      if (response.ok) {
        const data = await response.json()
        setPrescriptions(data)
      } else {
        // Mock data for demo
        const mockData = [
          { id: '1', patient: 'Marie Uwimana', doctor: 'Dr. Kagame', medications: ['Paracetamol 500mg', 'Amoxicillin 250mg'], priority: 'high', status: 'pending', time: '10:30 AM', insurance: 'RSSB', created_at: '2024-12-01' },
          { id: '2', patient: 'Jean Baptiste', doctor: 'Dr. Mukamana', medications: ['Ibuprofen 400mg'], priority: 'medium', status: 'completed', time: '11:15 AM', insurance: 'MMI', created_at: '2024-12-01' },
          { id: '3', patient: 'Grace Mukamana', doctor: 'Dr. Nkurunziza', medications: ['Vitamin C 1000mg', 'Zinc 15mg'], priority: 'low', status: 'dispensed', time: '09:45 AM', insurance: 'None', created_at: '2024-12-01' }
        ]
        setPrescriptions(mockData)
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterPrescriptions = () => {
    let filtered = prescriptions
    
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.doctor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.medications.some(m => m.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter)
    }
    
    setFilteredPrescriptions(filtered)
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

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Spinner className="size-6" />
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />
          <div>
            <h1 className="text-xl font-bold">Prescriptions</h1>
            <p className="text-sm text-muted-foreground">Manage patient prescriptions and dispensing</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Dialog open={isAddingPrescription} onOpenChange={setIsAddingPrescription}>
            <DialogTrigger asChild>
              <Button size="sm">
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
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Prescriptions</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{prescriptions.length}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
              +12% from last week
            </div>
            <Progress value={75} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center">
              <Clock className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{prescriptions.filter(p => p.status === 'pending').length}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <Clock className="h-3 w-3 text-orange-500 mr-1" />
              Awaiting processing
            </div>
            <Progress value={40} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <AlertCircle className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{prescriptions.filter(p => p.status === 'completed').length}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <CheckCircle className="h-3 w-3 text-blue-500 mr-1" />
              Ready to dispense
            </div>
            <Progress value={60} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dispensed</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{prescriptions.filter(p => p.status === 'dispensed').length}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
              Successfully completed
            </div>
            <Progress value={90} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="prescriptions">All Prescriptions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-sm">
                  <Clock className="mr-2 h-4 w-4 text-orange-500" />
                  Pending Prescriptions
                </CardTitle>
                <CardDescription>Awaiting processing</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {prescriptions.filter(p => p.status === 'pending').map((prescription) => (
                      <div key={prescription.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{prescription.patient}</p>
                          <p className="text-xs text-muted-foreground">Dr. {prescription.doctor}</p>
                        </div>
                        <div className="text-right">
                          <Badge className={getPriorityColor(prescription.priority)} className="text-xs">
                            {prescription.priority}
                          </Badge>
                          <Button size="sm" className="mt-1" onClick={() => updatePrescriptionStatus(prescription.id, 'completed')}>
                            Process
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-sm">
                  <AlertCircle className="mr-2 h-4 w-4 text-blue-500" />
                  Ready to Dispense
                </CardTitle>
                <CardDescription>Completed prescriptions</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {prescriptions.filter(p => p.status === 'completed').map((prescription) => (
                      <div key={prescription.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{prescription.patient}</p>
                          <p className="text-xs text-muted-foreground">Dr. {prescription.doctor}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="text-xs">
                            {prescription.insurance}
                          </Badge>
                          <Button size="sm" className="mt-1" onClick={() => updatePrescriptionStatus(prescription.id, 'dispensed')}>
                            Dispense
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Stats</CardTitle>
                <CardDescription>Today's prescription metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Completion Rate</span>
                    <span className="text-sm text-muted-foreground">85%</span>
                  </div>
                  <Progress value={85} />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Avg Processing Time</span>
                    <span className="text-sm text-muted-foreground">12 min</span>
                  </div>
                  <Progress value={70} />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Insurance Claims</span>
                    <span className="text-sm text-muted-foreground">67%</span>
                  </div>
                  <Progress value={67} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="prescriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">All Prescriptions</CardTitle>
                  <CardDescription>Manage and track prescription status</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search prescriptions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="dispensed">Dispensed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Medications</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Insurance</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPrescriptions.map((prescription) => (
                    <TableRow key={prescription.id}>
                      <TableCell className="font-medium">{prescription.patient}</TableCell>
                      <TableCell>Dr. {prescription.doctor}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {prescription.medications.slice(0, 2).map((med, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {med}
                            </Badge>
                          ))}
                          {prescription.medications.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{prescription.medications.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(prescription.priority)}>
                          {prescription.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(prescription.status)}>
                          {prescription.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{prescription.insurance}</TableCell>
                      <TableCell>
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Prescription Trends</CardTitle>
                <CardDescription>Daily prescription volume</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{
                  prescriptions: { label: "Prescriptions", color: "#3b82f6" }
                }}>
                  <BarChart data={[
                    { day: "Mon", prescriptions: 12 },
                    { day: "Tue", prescriptions: 15 },
                    { day: "Wed", prescriptions: 18 },
                    { day: "Thu", prescriptions: 14 },
                    { day: "Fri", prescriptions: 20 },
                    { day: "Sat", prescriptions: 16 },
                    { day: "Sun", prescriptions: 10 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="prescriptions" fill="#3b82f6" radius={4} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Status Distribution</CardTitle>
                <CardDescription>Current prescription status breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          {name: 'Pending', value: prescriptions.filter(p => p.status === 'pending').length, fill: '#f59e0b'},
                          {name: 'Completed', value: prescriptions.filter(p => p.status === 'completed').length, fill: '#3b82f6'},
                          {name: 'Dispensed', value: prescriptions.filter(p => p.status === 'dispensed').length, fill: '#10b981'}
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        dataKey="value"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-1 gap-2 text-xs mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded" />
                    <span>Pending ({prescriptions.filter(p => p.status === 'pending').length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded" />
                    <span>Completed ({prescriptions.filter(p => p.status === 'completed').length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded" />
                    <span>Dispensed ({prescriptions.filter(p => p.status === 'dispensed').length})</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}