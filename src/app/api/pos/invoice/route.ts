import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patientId, insuranceType, items, doctorName, mrcCode } = body

    const supabase = createClient()
    
    // Get pharmacy settings
    const { data: pharmacy } = await supabase
      .from('pharmacies')
      .select('*')
      .eq('id', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
      .single()

    // Get insurance details
    const { data: insurance } = await supabase
      .from('insurance_providers')
      .select('*')
      .where('name', 'ilike', `%${insuranceType}%`)
      .single()

    // Generate receipt number
    const receiptNumber = `RCP-${Date.now()}`
    const currentDate = new Date()
    
    // Get insurance prices for products
    const insurancePricesResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/insurance/pricing?insurance=${insuranceType}`)
    const insurancePrices = await insurancePricesResponse.json()
    
    // Calculate totals using insurance prices when available
    let totalAmount = 0
    let taxAmount = 0
    const processedItems = items.map((item: any) => {
      // Use insurance price if available, otherwise use pharmacy price
      const insurancePrice = insurancePrices[item.name] || item.price
      const total = item.quantity * insurancePrice
      totalAmount += total
      taxAmount += total * 0.18
      
      const coverageAmount = total * (insurance?.coverage_percentage || 0) / 100
      const patientAmount = total - coverageAmount
      
      return {
        ...item,
        insurancePrice,
        pharmacyPrice: item.price,
        total,
        insuranceCoverage: coverageAmount,
        patientPortion: patientAmount
      }
    })

    const invoiceData = {
      // Header
      pharmacyName: pharmacy?.name || 'Test Pharmacy',
      pharmacyAddress: pharmacy?.address || 'Kigali, Rwanda',
      pharmacyPhone: pharmacy?.phone || '+250788123456',
      pharmacyTIN: pharmacy?.tin_number || 'TIN-123456789',
      
      // Insurance info
      insuranceName: insurance?.name || insuranceType,
      insurancePercentage: insurance?.coverage_percentage || 0,
      
      // Receipt details
      receiptNumber,
      date: currentDate.toLocaleDateString('en-GB'),
      time: currentDate.toLocaleTimeString('en-GB', { hour12: false }),
      sdcId: `SDC-${Date.now()}`,
      
      // Patient info
      beneficialNumber: patientId,
      beneficialName: body.patientName || 'Patient Name',
      relationship: body.relationship || 'Self',
      telephone: body.patientPhone || '',
      affiliateName: body.affiliateName || body.patientName,
      dateOfBirth: body.dateOfBirth || '',
      dutyStation: body.dutyStation || '',
      insuranceTIN: body.insuranceTIN || '',
      
      // Medical details
      doctorName: doctorName || '',
      mrcCode: mrcCode || '',
      
      // Items
      items: processedItems,
      
      // Totals
      totalAmount,
      taxAmount,
      totalWithTax: totalAmount + taxAmount,
      insuranceAmount: totalAmount * (insurance?.coverage_percentage || 0) / 100,
      patientAmount: totalAmount * (100 - (insurance?.coverage_percentage || 0)) / 100,
      patientPercentage: 100 - (insurance?.coverage_percentage || 0)
    }

    return NextResponse.json({ success: true, invoice: invoiceData })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to generate invoice' }, { status: 500 })
  }
}