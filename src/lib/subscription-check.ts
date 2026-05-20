import { createClient } from '../../supabase/server'

export async function checkSubscriptionAccess(userId: string) {
  const supabase = await createClient()
  
  // Get user's pharmacy
  const { data: userPharmacy } = await supabase
    .from('pharmacy_users')
    .select('pharmacy_id, role')
    .eq('user_id', userId)
    .single()

  if (!userPharmacy) {
    return { hasAccess: false, reason: 'No pharmacy found', status: null }
  }

  // Get pharmacy subscription status
  const { data: pharmacy } = await supabase
    .from('pharmacies')
    .select('id, name, status, subscription_plan, subscription_expires_at')
    .eq('id', userPharmacy.pharmacy_id)
    .single()

  if (!pharmacy) {
    return { hasAccess: false, reason: 'Pharmacy not found', status: null }
  }

  // Check if pharmacy is suspended
  if (pharmacy.status === 'suspended') {
    return { 
      hasAccess: false, 
      reason: 'Subscription expired', 
      status: 'suspended',
      pharmacy 
    }
  }

  // Check if subscription has expired
  if (pharmacy.subscription_expires_at) {
    const expiryDate = new Date(pharmacy.subscription_expires_at)
    const today = new Date()
    
    if (expiryDate < today) {
      // Auto-suspend the pharmacy
      await supabase
        .from('pharmacies')
        .update({ status: 'suspended' })
        .eq('id', pharmacy.id)
      
      return { 
        hasAccess: false, 
        reason: 'Subscription expired', 
        status: 'expired',
        expiryDate: pharmacy.subscription_expires_at,
        pharmacy 
      }
    }

    // Calculate days remaining
    const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    return { 
      hasAccess: true, 
      status: 'active',
      daysLeft,
      isExpiringSoon: daysLeft <= 7,
      pharmacy 
    }
  }

  return { hasAccess: true, status: 'active', pharmacy }
}
