'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const FIELD_OPTIONS = {
  header: ['pharmacyName', 'pharmacyAddress', 'pharmacyPhone', 'pharmacyTIN', 'date', 'time', 'receiptNumber'],
  patient: ['beneficialNumber', 'beneficialName', 'relationship', 'telephone', 'affiliateName', 'dateOfBirth', 'dutyStation', 'insuranceTIN'],
  product: ['name', 'batch', 'expiryDate', 'quantity', 'price', 'total', 'insuranceCoverage']
}

export function InvoiceEditor() {
  const [template, setTemplate] = useState({
    showLogo: true,
    headerFields: [],
    patientFields: [],
    productFields: [],
    showTax: true,
    showInsuranceSplit: true,
    footerText: ''
  })

  useEffect(() => {
    fetch('/api/pharmacy/invoice-template')
      .then(res => res.json())
      .then(setTemplate)
  }, [])

  const handleSave = async () => {
    await fetch('/api/pharmacy/invoice-template', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(template)
    })
  }

  const toggleField = (section: string, field: string) => {
    setTemplate(prev => ({
      ...prev,
      [`${section}Fields`]: prev[`${section}Fields`].includes(field)
        ? prev[`${section}Fields`].filter(f => f !== field)
        : [...prev[`${section}Fields`], field]
    }))
  }

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold">Invoice Template Editor</h2>
      
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox 
            checked={template.showLogo} 
            onCheckedChange={(checked) => setTemplate(prev => ({ ...prev, showLogo: checked }))}
          />
          <Label>Show Logo</Label>
        </div>

        <div>
          <Label className="text-lg font-semibold">Header Fields</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {FIELD_OPTIONS.header.map(field => (
              <div key={field} className="flex items-center space-x-2">
                <Checkbox 
                  checked={template.headerFields.includes(field)}
                  onCheckedChange={() => toggleField('header', field)}
                />
                <Label>{field}</Label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-lg font-semibold">Patient Fields</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {FIELD_OPTIONS.patient.map(field => (
              <div key={field} className="flex items-center space-x-2">
                <Checkbox 
                  checked={template.patientFields.includes(field)}
                  onCheckedChange={() => toggleField('patient', field)}
                />
                <Label>{field}</Label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-lg font-semibold">Product Fields</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {FIELD_OPTIONS.product.map(field => (
              <div key={field} className="flex items-center space-x-2">
                <Checkbox 
                  checked={template.productFields.includes(field)}
                  onCheckedChange={() => toggleField('product', field)}
                />
                <Label>{field}</Label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              checked={template.showTax} 
              onCheckedChange={(checked) => setTemplate(prev => ({ ...prev, showTax: checked }))}
            />
            <Label>Show Tax Calculations</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              checked={template.showInsuranceSplit} 
              onCheckedChange={(checked) => setTemplate(prev => ({ ...prev, showInsuranceSplit: checked }))}
            />
            <Label>Show Insurance Split</Label>
          </div>
        </div>

        <div>
          <Label>Footer Text</Label>
          <Input 
            value={template.footerText}
            onChange={(e) => setTemplate(prev => ({ ...prev, footerText: e.target.value }))}
            placeholder="Enter footer text"
          />
        </div>

        <Button onClick={handleSave}>Save Template</Button>
      </div>
    </div>
  )
}