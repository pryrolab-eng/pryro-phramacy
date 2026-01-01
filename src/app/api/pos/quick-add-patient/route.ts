import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Quick add patient data:', body)
    
    // Forward to customers API for consistency
    const customerResponse = await fetch('http://localhost:3000/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientName: body.patientName || body.name,
        phoneNumber: body.phoneNumber || body.phone,
        insuranceNumber: body.insuranceNumber || ''
      })
    })
    
    if (customerResponse.ok) {
      const result = await customerResponse.json()
      return NextResponse.json({ 
        success: true, 
        customer: {
          id: result.customer.id,
          name: result.customer.name,
          phone: result.customer.phone,
          insurance_number: result.customer.insurance_number
        },
        message: result.message
      })
    } else {
      throw new Error('Failed to add to customers')
    }
  } catch (error) {
    console.error('Quick add patient error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to add patient',
      details: error.message 
    }, { status: 500 })
  }
}