import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'

export async function GET() {
  try {
    const supabase = createClient()
    
    const { data: pharmacy } = await supabase
      .from('pharmacies')
      .select('invoice_template')
      .eq('id', 'userPharmacy.pharmacy_id')
      .single()

    const defaultTemplate = {
      showLogo: true,
      headerFields: ['pharmacyName', 'pharmacyAddress', 'pharmacyPhone', 'date'],
      patientFields: ['beneficialNumber', 'beneficialName', 'telephone', 'insuranceTIN'],
      productFields: ['name', 'batch', 'expiryDate', 'quantity', 'price', 'total'],
      showTax: true,
      showInsuranceSplit: true,
      footerText: 'Thank you for your business'
    }

    return NextResponse.json(pharmacy?.invoice_template || defaultTemplate)
  } catch (error) {
    return NextResponse.json({
      showLogo: true,
      headerFields: ['pharmacyName', 'pharmacyAddress', 'pharmacyPhone', 'date'],
      patientFields: ['beneficialNumber', 'beneficialName', 'telephone', 'insuranceTIN'],
      productFields: ['name', 'batch', 'expiryDate', 'quantity', 'price', 'total'],
      showTax: true,
      showInsuranceSplit: true,
      footerText: 'Thank you for your business'
    })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    const template = await request.json()
    
    const { error } = await supabase
      .from('pharmacies')
      .update({ invoice_template: template })
      .eq('id', 'userPharmacy.pharmacy_id')

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update template' })
  }
}
