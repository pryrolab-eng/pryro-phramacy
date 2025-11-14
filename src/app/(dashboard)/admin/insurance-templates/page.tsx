'use client'

import { useState } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileText, Eye, Type, Image, Calendar, DollarSign, User, Hash, Minus } from 'lucide-react'

export default function InsuranceTemplatesPage() {
  const [template, setTemplate] = useState({ name: '' })
  const [elements, setElements] = useState([])
  const [draggedElement, setDraggedElement] = useState(null)
  const [selectedElement, setSelectedElement] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [insuranceForm, setInsuranceForm] = useState({
    name: '',
    coverage_percentage: 80,
    contact_email: '',
    contact_phone: '',
    policy_number: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddInsurance = async () => {
    if (!insuranceForm.name) return
    
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/insurance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(insuranceForm)
      })
      
      if (response.ok) {
        alert('Insurance provider added successfully!')
        setInsuranceForm({ name: '', coverage_percentage: 80, contact_email: '', contact_phone: '', policy_number: '' })
      } else {
        alert('Failed to add insurance provider')
      }
    } catch (error) {
      alert('Failed to add insurance provider')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const componentTypes = [
    { type: 'text', label: 'Text', icon: Type, defaultProps: { text: 'Sample Text', fontSize: '16px' } },
    { type: 'title', label: 'Title', icon: Type, defaultProps: { text: 'Invoice Title', fontSize: '24px', fontWeight: 'bold' } },
    { type: 'variable', label: 'Variable', icon: Hash, defaultProps: { variable: 'insurance_name', label: 'Insurance Name' } },
    { type: 'date', label: 'Date', icon: Calendar, defaultProps: { variable: 'date', label: 'Date' } },
    { type: 'amount', label: 'Amount', icon: DollarSign, defaultProps: { variable: 'amount', label: 'Amount', suffix: ' RWF' } },
    { type: 'patient', label: 'Patient', icon: User, defaultProps: { variable: 'patient_name', label: 'Patient Name', fontSize: 16, width: 200, height: 30 } },
    { type: 'image', label: 'Image', icon: Image, defaultProps: { src: 'https://via.placeholder.com/100x100/3b82f6/ffffff?text=Logo', alt: 'Logo', width: 100, height: 100 } },
    { type: 'line', label: 'Line', icon: Minus, defaultProps: { width: 300, height: 2, backgroundColor: '#000' } }
  ]

  const handleDragStart = (e, componentType) => {
    setDraggedElement(componentType)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    if (draggedElement) {
      const newElement = {
        id: Date.now() + Math.random(), // Ensure unique IDs
        ...draggedElement,
        ...draggedElement.defaultProps,
        x: e.nativeEvent.offsetX,
        y: e.nativeEvent.offsetY
      }
      setElements([...elements, newElement])
      setDraggedElement(null)
    }
  }

  const handleElementDrag = (elementId, newX, newY) => {
    setElements(elements.map(el => 
      el.id === elementId ? { ...el, x: newX, y: newY } : el
    ))
  }

  const handleElementResize = (elementId, newWidth, newHeight) => {
    setElements(elements.map(el => 
      el.id === elementId ? { ...el, width: newWidth, height: newHeight } : el
    ))
  }

  const updateElementProperty = (property, value) => {
    if (selectedElement) {
      setElements(elements.map(el => 
        el.id === selectedElement.id ? { ...el, [property]: value } : el
      ))
      setSelectedElement({ ...selectedElement, [property]: value })
    }
  }

  const loadTemplate = (templateType) => {
    let templateElements = []
    
    if (templateType === 'basic') {
      templateElements = [
        { id: 1, type: 'image', src: 'https://via.placeholder.com/80x80/10b981/ffffff?text=SEAL', x: 50, y: 20, width: 80, height: 80 },
        { id: 2, type: 'title', text: '{{insurance_name}} MEDICAL CLAIM', x: 150, y: 30, fontSize: 22, fontWeight: 'bold', width: 300, height: 35 },
        { id: 3, type: 'text', text: 'REPUBLIC OF RWANDA', x: 150, y: 65, fontSize: 14, width: 200, height: 25 },
        { id: 4, type: 'line', x: 50, y: 120, width: 450, height: 3, backgroundColor: '#10b981' },
        { id: 5, type: 'text', text: 'PATIENT DETAILS', x: 50, y: 140, fontSize: 16, fontWeight: 'bold', width: 200, height: 30 },
        { id: 6, type: 'variable', variable: 'patient_name', label: 'Full Name', x: 50, y: 175, fontSize: 14, width: 200, height: 25 },
        { id: 7, type: 'variable', variable: 'policy_number', label: 'Policy Number', x: 300, y: 175, fontSize: 14, width: 200, height: 25 },
        { id: 8, type: 'variable', variable: 'date', label: 'Date of Service', x: 50, y: 210, fontSize: 14, width: 200, height: 25 },
        { id: 9, type: 'text', text: 'FINANCIAL SUMMARY', x: 50, y: 250, fontSize: 16, fontWeight: 'bold', width: 200, height: 30 },
        { id: 10, type: 'variable', variable: 'amount', label: 'Total Amount', x: 50, y: 285, fontSize: 16, width: 180, height: 30, suffix: ' RWF' },
        { id: 11, type: 'variable', variable: 'coverage_percentage', label: 'Coverage Rate', x: 250, y: 285, fontSize: 16, width: 150, height: 30, suffix: '%' },
        { id: 12, type: 'text', text: 'Authorized by {{insurance_name}} - Rwanda', x: 50, y: 340, fontSize: 12, width: 400, height: 25 }
      ]
    } else if (templateType === 'professional') {
      templateElements = [
        { id: 1, type: 'image', src: 'https://via.placeholder.com/150x60/1e40af/ffffff?text=INSURANCE', x: 50, y: 20, width: 150, height: 60 },
        { id: 2, type: 'image', src: 'https://via.placeholder.com/60x60/dc2626/ffffff?text=RW', x: 420, y: 20, width: 60, height: 60 },
        { id: 3, type: 'title', text: 'OFFICIAL INSURANCE CERTIFICATE', x: 120, y: 100, fontSize: 20, fontWeight: 'bold', width: 350, height: 35 },
        { id: 4, type: 'line', x: 50, y: 150, width: 450, height: 2, backgroundColor: '#1e40af' },
        { id: 5, type: 'line', x: 50, y: 155, width: 450, height: 1, backgroundColor: '#dc2626' },
        { id: 6, type: 'text', text: 'Certificate No: {{policy_number}}', x: 50, y: 175, fontSize: 14, fontWeight: 'bold', width: 250, height: 25 },
        { id: 7, type: 'variable', variable: 'date', label: 'Issue Date', x: 320, y: 175, fontSize: 14, width: 180, height: 25 },
        { id: 8, type: 'text', text: 'BENEFICIARY INFORMATION', x: 50, y: 210, fontSize: 14, fontWeight: 'bold', width: 250, height: 25 },
        { id: 9, type: 'variable', variable: 'patient_name', label: 'Beneficiary Name', x: 50, y: 240, fontSize: 13, width: 220, height: 25 },
        { id: 10, type: 'text', text: 'COVERAGE DETAILS', x: 300, y: 210, fontSize: 14, fontWeight: 'bold', width: 200, height: 25 },
        { id: 11, type: 'variable', variable: 'coverage_percentage', label: 'Coverage Level', x: 300, y: 240, fontSize: 13, width: 150, height: 25, suffix: '% Coverage' },
        { id: 12, type: 'text', text: 'CLAIM AMOUNT', x: 50, y: 280, fontSize: 14, fontWeight: 'bold', width: 200, height: 25 },
        { id: 13, type: 'variable', variable: 'amount', label: 'Approved Amount', x: 50, y: 310, fontSize: 16, fontWeight: 'bold', width: 200, height: 30, suffix: ' RWF' },
        { id: 14, type: 'line', x: 50, y: 360, width: 450, height: 1, backgroundColor: '#6b7280' },
        { id: 15, type: 'text', text: 'This certificate is valid and authorized by {{insurance_name}}', x: 50, y: 375, fontSize: 11, width: 400, height: 20 },
        { id: 16, type: 'image', src: 'https://via.placeholder.com/100x40/059669/ffffff?text=SIGNATURE', x: 350, y: 400, width: 100, height: 40 }
      ]
    } else if (templateType === 'detailed') {
      templateElements = [
        { id: 1, type: 'image', src: 'https://via.placeholder.com/100x100/7c3aed/ffffff?text=MOH', x: 50, y: 20, width: 100, height: 100 },
        { id: 2, type: 'title', text: 'MINISTRY OF HEALTH', x: 170, y: 30, fontSize: 18, fontWeight: 'bold', width: 250, height: 25 },
        { id: 3, type: 'text', text: 'REPUBLIC OF RWANDA', x: 170, y: 55, fontSize: 16, width: 200, height: 25 },
        { id: 4, type: 'title', text: 'MEDICAL INSURANCE CLAIM REPORT', x: 170, y: 80, fontSize: 16, fontWeight: 'bold', width: 300, height: 25 },
        { id: 5, type: 'line', x: 50, y: 140, width: 450, height: 3, backgroundColor: '#7c3aed' },
        { id: 6, type: 'text', text: 'INSURANCE PROVIDER: {{insurance_name}}', x: 50, y: 160, fontSize: 14, fontWeight: 'bold', width: 300, height: 25 },
        { id: 7, type: 'variable', variable: 'policy_number', label: 'Policy Reference', x: 350, y: 160, fontSize: 14, width: 150, height: 25 },
        { id: 8, type: 'line', x: 50, y: 190, width: 450, height: 1, backgroundColor: '#d1d5db' },
        { id: 9, type: 'text', text: 'PATIENT INFORMATION', x: 50, y: 210, fontSize: 14, fontWeight: 'bold', width: 200, height: 25 },
        { id: 10, type: 'variable', variable: 'patient_name', label: 'Patient Full Name', x: 50, y: 235, fontSize: 12, width: 200, height: 20 },
        { id: 11, type: 'variable', variable: 'date', label: 'Treatment Date', x: 270, y: 235, fontSize: 12, width: 150, height: 20 },
        { id: 12, type: 'text', text: 'MEDICAL FACILITY', x: 50, y: 265, fontSize: 14, fontWeight: 'bold', width: 200, height: 25 },
        { id: 13, type: 'text', text: 'Hospital/Clinic Name: ________________', x: 50, y: 290, fontSize: 12, width: 300, height: 20 },
        { id: 14, type: 'text', text: 'FINANCIAL BREAKDOWN', x: 50, y: 320, fontSize: 14, fontWeight: 'bold', width: 200, height: 25 },
        { id: 15, type: 'variable', variable: 'amount', label: 'Total Medical Cost', x: 50, y: 345, fontSize: 13, width: 180, height: 25, suffix: ' RWF' },
        { id: 16, type: 'variable', variable: 'coverage_percentage', label: 'Insurance Coverage', x: 250, y: 345, fontSize: 13, width: 150, height: 25, suffix: '%' },
        { id: 17, type: 'text', text: 'Patient Responsibility: _______ RWF', x: 50, y: 375, fontSize: 13, width: 250, height: 25 },
        { id: 18, type: 'line', x: 50, y: 410, width: 450, height: 2, backgroundColor: '#7c3aed' },
        { id: 19, type: 'text', text: 'AUTHORIZATION', x: 50, y: 430, fontSize: 14, fontWeight: 'bold', width: 200, height: 25 },
        { id: 20, type: 'text', text: 'Approved by: ________________', x: 50, y: 455, fontSize: 12, width: 200, height: 20 },
        { id: 21, type: 'text', text: 'Date: ________________', x: 270, y: 455, fontSize: 12, width: 150, height: 20 },
        { id: 22, type: 'image', src: 'https://via.placeholder.com/80x40/dc2626/ffffff?text=OFFICIAL+STAMP', x: 400, y: 450, width: 80, height: 40 },
        { id: 23, type: 'text', text: 'This document is official and legally binding under Rwanda Insurance Law', x: 50, y: 510, fontSize: 10, width: 450, height: 20 }
      ]
    }
    
    setElements(templateElements)
    setSelectedElement(null)
  }

  const renderElement = (element) => {
    const sampleData = {
      insurance_name: 'RSSB Insurance',
      policy_number: 'POL-2024-001', 
      patient_name: 'John Doe',
      date: new Date().toLocaleDateString(),
      amount: '50000',
      coverage_percentage: '80'
    }

    const isSelected = selectedElement?.id === element.id
    const style = {
      position: 'absolute',
      left: element.x,
      top: element.y,
      width: element.width || 'auto',
      height: element.height || 'auto',
      fontSize: element.fontSize,
      fontWeight: element.fontWeight,
      border: isSelected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
      cursor: 'move',
      padding: '4px',
      backgroundColor: 'white'
    }

    const handleMouseDown = (e) => {
      e.preventDefault()
      setSelectedElement(element)
      const startX = e.clientX - element.x
      const startY = e.clientY - element.y
      
      const handleMouseMove = (moveEvent) => {
        const newX = Math.max(0, moveEvent.clientX - startX)
        const newY = Math.max(0, moveEvent.clientY - startY)
        handleElementDrag(element.id, newX, newY)
      }
      
      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
      
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    let content = ''
    if (element.type === 'variable' || element.type === 'date' || element.type === 'amount' || element.type === 'patient') {
      content = `${element.label}: ${sampleData[element.variable]}${element.suffix || ''}`
    } else if (element.type === 'image') {
      return (
        <div key={element.id} style={style} onMouseDown={handleMouseDown}>
          <img src={element.src} alt={element.alt} style={{ width: '100%', height: '100%' }} />
          {isSelected && (
            <div 
              className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 cursor-se-resize rounded-full"
              onMouseDown={(e) => {
                e.stopPropagation()
                const startX = e.clientX
                const startY = e.clientY
                const startWidth = element.width
                const startHeight = element.height
                
                const handleMouseMove = (moveEvent) => {
                  const newWidth = Math.max(20, startWidth + (moveEvent.clientX - startX))
                  const newHeight = Math.max(20, startHeight + (moveEvent.clientY - startY))
                  handleElementResize(element.id, newWidth, newHeight)
                }
                
                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove)
                  document.removeEventListener('mouseup', handleMouseUp)
                }
                
                document.addEventListener('mousemove', handleMouseMove)
                document.addEventListener('mouseup', handleMouseUp)
              }}
            />
          )}
        </div>
      )
    } else if (element.type === 'line') {
      return (
        <div key={element.id} style={{...style, backgroundColor: element.backgroundColor}} onMouseDown={handleMouseDown} />
      )
    } else {
      content = element.text
    }
    
    return (
      <div key={element.id} style={style} onMouseDown={handleMouseDown}>
        {content}
        {isSelected && (
          <div 
            className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 cursor-se-resize rounded-full"
            onMouseDown={(e) => {
              e.stopPropagation()
              const startX = e.clientX
              const startY = e.clientY
              const startWidth = element.width || 100
              const startHeight = element.height || 30
              
              const handleMouseMove = (moveEvent) => {
                const newWidth = Math.max(20, startWidth + (moveEvent.clientX - startX))
                const newHeight = Math.max(20, startHeight + (moveEvent.clientY - startY))
                handleElementResize(element.id, newWidth, newHeight)
              }
              
              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove)
                document.removeEventListener('mouseup', handleMouseUp)
              }
              
              document.addEventListener('mousemove', handleMouseMove)
              document.addEventListener('mouseup', handleMouseUp)
            }}
          />
        )}
      </div>
    )
  }

  return (
    <div className="p-6">


        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <FileText className="h-8 w-8 text-blue-600" />
              Insurance Template Designer
            </h1>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Professional Insurance Templates</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 hover:border-green-400 bg-gradient-to-br from-white to-green-50" onClick={() => loadTemplate('basic')}>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2 text-green-700">Rwanda Medical Claim</h3>
                  <div className="text-xs bg-green-50 p-3 rounded border">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                      <div className="font-bold">RSSB MEDICAL CLAIM</div>
                    </div>
                    <div className="text-gray-600">Republic of Rwanda</div>
                    <div className="border-t mt-2 pt-2">
                      <div>Patient: John Doe</div>
                      <div>Amount: 50,000 RWF | Coverage: 80%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 hover:border-blue-400 bg-gradient-to-br from-white to-blue-50" onClick={() => loadTemplate('professional')}>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2 text-blue-700">Official Certificate</h3>
                  <div className="text-xs bg-blue-50 p-3 rounded border">
                    <div className="flex items-center justify-between mb-1">
                      <div className="w-4 h-3 bg-blue-700 rounded"></div>
                      <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                    </div>
                    <div className="font-bold text-center">INSURANCE CERTIFICATE</div>
                    <div className="border-t border-b py-1 my-1">
                      <div>Certificate No: POL-2024-001</div>
                      <div>Coverage: 90% | Approved Amount</div>
                    </div>
                    <div className="text-right text-gray-500">Authorized</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 hover:border-purple-400 bg-gradient-to-br from-white to-purple-50" onClick={() => loadTemplate('detailed')}>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2 text-purple-700">Ministry Health Report</h3>
                  <div className="text-xs bg-purple-50 p-3 rounded border">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 bg-purple-600 rounded"></div>
                      <div className="font-bold">MINISTRY OF HEALTH</div>
                    </div>
                    <div className="text-gray-600">Republic of Rwanda</div>
                    <div className="border-t mt-2 pt-2 space-y-1">
                      <div>Patient Information</div>
                      <div>Medical Facility</div>
                      <div>Financial Breakdown</div>
                      <div className="flex justify-between">
                        <span>Authorization</span>
                        <div className="w-3 h-2 bg-red-600 rounded"></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center gap-4">
                <Button onClick={() => setElements([])} variant="outline" size="sm">
                  Clear Canvas
                </Button>
                <Button onClick={() => window.print()} variant="outline" size="sm">
                  Print Preview
                </Button>
                <div className="text-sm text-gray-600">
                  Elements: {elements.length}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => setTemplate({...template, name: template.name || 'My Template'})} size="sm">
                  Save Template
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-6 grid-cols-4">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Add Insurance Provider</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label>Insurance Name</Label>
                    <Input
                      value={insuranceForm.name}
                      onChange={(e) => setInsuranceForm({...insuranceForm, name: e.target.value})}
                      placeholder="e.g., RSSB, MMI"
                    />
                  </div>
                  <div>
                    <Label>Coverage Percentage</Label>
                    <Input
                      type="number"
                      value={insuranceForm.coverage_percentage}
                      onChange={(e) => setInsuranceForm({...insuranceForm, coverage_percentage: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label>Contact Email</Label>
                    <Input
                      value={insuranceForm.contact_email}
                      onChange={(e) => setInsuranceForm({...insuranceForm, contact_email: e.target.value})}
                      placeholder="contact@insurance.com"
                    />
                  </div>
                  <div>
                    <Label>Contact Phone</Label>
                    <Input
                      value={insuranceForm.contact_phone}
                      onChange={(e) => setInsuranceForm({...insuranceForm, contact_phone: e.target.value})}
                      placeholder="+250 xxx xxx xxx"
                    />
                  </div>
                  <div>
                    <Label>Policy Number</Label>
                    <Input
                      value={insuranceForm.policy_number}
                      onChange={(e) => setInsuranceForm({...insuranceForm, policy_number: e.target.value})}
                      placeholder="Policy reference number"
                    />
                  </div>
                  <Button onClick={handleAddInsurance} disabled={isSubmitting || !insuranceForm.name} className="w-full">
                    {isSubmitting ? 'Adding...' : 'Add Insurance Provider'}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Template Info</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label>Template Name</Label>
                    <Input
                      value={template.name}
                      onChange={(e) => setTemplate({...template, name: e.target.value})}
                      placeholder="e.g., RSSB Custom Template"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Components</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {componentTypes.map((component) => (
                      <div
                        key={component.type}
                        draggable
                        onDragStart={(e) => handleDragStart(e, component)}
                        className="flex items-center gap-2 p-3 border rounded cursor-move hover:bg-gray-50"
                      >
                        <component.icon className="h-4 w-4" />
                        {component.label}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-lg col-span-3">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    Design Canvas
                  </CardTitle>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Click to select</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Drag to move</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>Resize with handle</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div 
                  className="border-2 border-dashed border-blue-200 rounded-lg m-4 p-6 bg-white min-h-[600px] relative shadow-inner"
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  style={{
                    backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                  }}
                >
                  {elements.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-gray-400">
                        <div className="text-4xl mb-4">📄</div>
                        <p className="text-lg font-medium">Drop components here</p>
                        <p className="text-sm">Start building your insurance template</p>
                      </div>
                    </div>
                  )}
                  {elements.map(renderElement)}
                </div>
              </CardContent>
            </Card>

            {selectedElement && (
              <Card>
                <CardHeader>
                  <CardTitle>Properties</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedElement.type !== 'line' && selectedElement.type !== 'image' && (
                    <div>
                      <Label>Text</Label>
                      <Input
                        value={selectedElement.text || selectedElement.label || ''}
                        onChange={(e) => updateElementProperty(selectedElement.text ? 'text' : 'label', e.target.value)}
                      />
                    </div>
                  )}
                  {selectedElement.type === 'image' && (
                    <div className="space-y-2">
                      <div>
                        <Label>Image URL</Label>
                        <Input
                          value={selectedElement.src || ''}
                          onChange={(e) => updateElementProperty('src', e.target.value)}
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateElementProperty('src', 'https://via.placeholder.com/150x50/3b82f6/ffffff?text=Header')}
                        >
                          Header Logo
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateElementProperty('src', 'https://via.placeholder.com/80x80/10b981/ffffff?text=Seal')}
                        >
                          Official Seal
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateElementProperty('src', 'https://via.placeholder.com/100x30/ef4444/ffffff?text=Stamp')}
                        >
                          Stamp
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateElementProperty('src', 'https://via.placeholder.com/120x40/8b5cf6/ffffff?text=Signature')}
                        >
                          Signature
                        </Button>
                      </div>
                    </div>
                  )}
                  <div>
                    <Label>Font Size</Label>
                    <Input
                      type="number"
                      value={selectedElement.fontSize || 16}
                      onChange={(e) => updateElementProperty('fontSize', Number(e.target.value))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Width</Label>
                      <Input
                        type="number"
                        value={selectedElement.width}
                        onChange={(e) => updateElementProperty('width', Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label>Height</Label>
                      <Input
                        type="number"
                        value={selectedElement.height}
                        onChange={(e) => updateElementProperty('height', Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => {
                      setElements(elements.filter(el => el.id !== selectedElement.id))
                      setSelectedElement(null)
                    }}
                  >
                    Delete Element
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

    </div>
  )
}
