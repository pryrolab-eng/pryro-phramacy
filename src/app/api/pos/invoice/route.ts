import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'
import { requireSessionPharmacyId } from '@/lib/pharmacy/get-session-pharmacy'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patientId, insuranceType, items, doctorName, mrcCode } = body

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const pharmacyId = await requireSessionPharmacyId(supabase, user.id)

    const { data: pharmacy } = await supabase
      .from('pharmacies')
      .select('*')
      .eq('id', pharmacyId)
      .single()

    const { data: insurance } = await supabase
      .from('insurance_providers')
      .select('*')
      .ilike('name', `%${insuranceType}%`)
      .single()

    const receiptNumber = `RCP-${Date.now()}`
    const currentDate = new Date()

    const insurancePricesResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/insurance/pricing?insurance=${insuranceType}`,
    )
    const insurancePrices = await insurancePricesResponse.json()

    let totalAmount = 0
    let taxAmount = 0
    const processedItems = items.map((item: { name: string; price: number; quantity: number }) => {
      const insurancePrice = insurancePrices[item.name] || item.price
      const total = item.quantity * insurancePrice
      totalAmount += total
      taxAmount += total * 0.18

      const coverageAmount = (total * (insurance?.coverage_percentage || 0)) / 100
      const patientAmount = total - coverageAmount

      return {
        ...item,
        insurancePrice,
        pharmacyPrice: item.price,
        total,
        insuranceCoverage: coverageAmount,
        patientPortion: patientAmount,
      }
    })

    const invoiceData = {
      pharmacyName: pharmacy?.name || 'Test Pharmacy',
      pharmacyAddress: pharmacy?.address || 'Kigali, Rwanda',
      pharmacyPhone: pharmacy?.phone || '+250788123456',
      pharmacyTIN: pharmacy?.tin_number || 'TIN-123456789',
      insuranceName: insurance?.name || insuranceType,
      insurancePercentage: insurance?.coverage_percentage || 0,
      receiptNumber,
      date: currentDate.toLocaleDateString('en-GB'),
      time: currentDate.toLocaleTimeString('en-GB', { hour12: false }),
      sdcId: `SDC-${Date.now()}`,
      beneficialNumber: patientId,
      beneficialName: body.patientName || 'Patient Name',
      relationship: body.relationship || 'Self',
      telephone: body.patientPhone || '',
      affiliateName: body.affiliateName || body.patientName,
      dateOfBirth: body.dateOfBirth || '',
      dutyStation: body.dutyStation || '',
      insuranceTIN: body.insuranceTIN || '',
      doctorName: doctorName || '',
      mrcCode: mrcCode || '',
      items: processedItems,
      totalAmount,
      taxAmount,
      totalWithTax: totalAmount + taxAmount,
      insuranceAmount: (totalAmount * (insurance?.coverage_percentage || 0)) / 100,
      patientAmount: (totalAmount * (100 - (insurance?.coverage_percentage || 0))) / 100,
      patientPercentage: 100 - (insurance?.coverage_percentage || 0),
    }

    return NextResponse.json({ success: true, invoice: invoiceData })
  } catch (error) {
    console.error('POST /api/pos/invoice', error)
    return NextResponse.json({ success: false, error: 'Failed to generate invoice' }, { status: 500 })
  }
}
