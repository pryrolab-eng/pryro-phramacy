import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's pharmacy_id
    const { data: userPharmacy } = await supabase
      .from('pharmacy_users')
      .select('pharmacy_id')
      .eq('user_id', user.id)
      .single()

    if (!userPharmacy) {
      return NextResponse.json({ error: 'Pharmacy not found' }, { status: 403 })
    }
    
    const body = await request.json()
    console.log('Sale data received:', body)
    
    const { 
      customer, 
      items, 
      subtotal, 
      insuranceCoverage, 
      patientAmount, 
      paymentMethod, 
      cashAmount, 
      insuranceAmount 
    } = body
    
    // Get insurance provider ID if insurance is used
    let insuranceProviderId = null
    if (customer?.insuranceType && customer.insuranceType !== 'cash') {
      const { data: insuranceProvider } = await supabase
        .from('insurance_providers')
        .select('id')
        .eq('name', customer.insuranceType)
        .eq('pharmacy_id', userPharmacy.pharmacy_id)
        .single()
      
      insuranceProviderId = insuranceProvider?.id
    }
    
    // Create sale record with proper payment breakdown
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        pharmacy_id: userPharmacy.pharmacy_id,
        cashier_id: user.id,
        customer_name: customer?.name || 'Walk-in Customer',
        customer_phone: customer?.phone || null,
        insurance_provider_id: insuranceProviderId,
        subtotal: parseFloat(subtotal) || 0,
        insurance_amount: parseFloat(insuranceCoverage) || 0,
        customer_amount: parseFloat(patientAmount) || parseFloat(subtotal) || 0,
        total_amount: parseFloat(subtotal) || 0,
        payment_method: paymentMethod || 'cash',
        status: 'completed',
        receipt_number: `RCP-${Date.now()}`,
        notes: customer?.insuranceNumber ? `Insurance: ${customer.insuranceNumber}` : null
      })
      .select()
      .single()

    if (saleError) {
      console.error('Sale creation error:', saleError)
      throw saleError
    }

    // Create sale items and update inventory
    if (items && items.length > 0) {
      const saleItems = items.map((item: any) => ({
        sale_id: sale.id,
        inventory_id: item.id,
        medication_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.quantity * item.price,
        batch_number: item.batch,
        expiry_date: item.expiryDate
      }))

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems)

      if (itemsError) {
        console.error('Sale items error:', itemsError)
        throw itemsError
      }

      // Update inventory quantities
      for (const item of items) {
        const { data: currentInventory } = await supabase
          .from('inventory')
          .select('quantity_in_stock')
          .eq('id', item.id)
          .single()
        
        if (currentInventory) {
          const newQuantity = currentInventory.quantity_in_stock - item.quantity
          await supabase
            .from('inventory')
            .update({ quantity_in_stock: newQuantity })
            .eq('id', item.id)
        }
      }
    }
    
    // Create insurance claim if applicable
    if (insuranceProviderId && insuranceCoverage > 0) {
      const { error: claimError } = await supabase
        .from('insurance_claims')
        .insert({
          pharmacy_id: userPharmacy.pharmacy_id,
          sale_id: sale.id,
          insurance_provider_id: insuranceProviderId,
          patient_name: customer?.name || 'Unknown',
          patient_id_number: customer?.insuranceNumber || null,
          claim_amount: parseFloat(insuranceCoverage),
          status: 'pending'
        })
      
      if (claimError) {
        console.error('Insurance claim error:', claimError)
      }
    }
    
    console.log('Sale processed successfully:', sale.id)
    return NextResponse.json({ 
      success: true, 
      sale,
      receiptNumber: sale.receipt_number,
      message: 'Sale processed successfully'
    })
  } catch (error) {
    console.error('Sale processing error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to process sale',
      details: error.message 
    }, { status: 500 })
  }
}