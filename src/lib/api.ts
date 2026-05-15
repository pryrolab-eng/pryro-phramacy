import { createClient } from '../../supabase/client'
import { Database } from './database.types'

type Tables = Database['public']['Tables']
type Views = Database['public']['Views']

function supabase() {
  return createClient()
}

// Dashboard API
export const dashboardApi = {
  async getStats(pharmacyId: string) {
    const { data, error } = await supabase()
      .from('pharmacy_dashboard_stats')
      .select('*')
      .eq('pharmacy_id', pharmacyId)
      .single()
    
    if (error) throw error
    return data
  },

  async getInventoryAlerts(pharmacyId: string) {
    const { data, error } = await supabase()
      .from('inventory_alerts')
      .select('*')
      .eq('pharmacy_id', pharmacyId)
      .limit(10)
    
    if (error) throw error
    return data
  },

  async getRecentSales(pharmacyId: string, limit = 5) {
    const { data, error } = await supabase()
      .from('sales')
      .select(`
        *,
        sale_items (
          medication_name,
          quantity,
          total_price
        )
      `)
      .eq('pharmacy_id', pharmacyId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data
  }
}

// Inventory API
export const inventoryApi = {
  async getAll(pharmacyId: string) {
    const { data, error } = await supabase()
      .from('inventory')
      .select(`
        *,
        medications (name, generic_name, category),
        suppliers (name)
      `)
      .eq('pharmacy_id', pharmacyId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async create(inventory: Tables['inventory']['Insert']) {
    const { data, error } = await supabase()
      .from('inventory')
      .insert(inventory)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Tables['inventory']['Update']) {
    const { data, error } = await supabase()
      .from('inventory')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Sales API
export const salesApi = {
  async create(sale: Tables['sales']['Insert'], items: Array<{
    inventory_id: string
    medication_name: string
    quantity: number
    unit_price: number
    total_price: number
    batch_number?: string
    expiry_date?: string
  }>) {
    const { data: saleData, error: saleError } = await supabase
      .from('sales')
      .insert(sale)
      .select()
      .single()
    
    if (saleError) throw saleError

    const saleItems = items.map(item => ({
      ...item,
      sale_id: saleData.id
    }))

    const { error: itemsError } = await supabase
      .from('sale_items')
      .insert(saleItems)
    
    if (itemsError) throw itemsError
    
    return saleData
  },

  async getAll(pharmacyId: string, limit = 50) {
    const { data, error } = await supabase()
      .from('sales')
      .select(`
        *,
        sale_items (
          medication_name,
          quantity,
          unit_price,
          total_price
        )
      `)
      .eq('pharmacy_id', pharmacyId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data
  }
}

// Customers API
export const customersApi = {
  async getAll(pharmacyId: string) {
    const { data, error } = await supabase()
      .from('customers')
      .select('*')
      .eq('pharmacy_id', pharmacyId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async create(customer: Tables['customers']['Insert']) {
    const { data, error } = await supabase()
      .from('customers')
      .insert(customer)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Tables['customers']['Update']) {
    const { data, error } = await supabase()
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

// Pharmacy API
export const pharmacyApi = {
  async getCurrent() {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) throw new Error('Not authenticated')

    const { data, error } = await supabase()
      .from('pharmacy_users')
      .select(`
        pharmacy_id,
        role,
        pharmacies (*)
      `)
      .eq('user_id', user.user.id)
      .eq('is_active', true)
      .single()
    
    if (error) throw error
    return data
  },

  async getSettings(pharmacyId: string) {
    const { data, error } = await supabase()
      .from('pharmacy_settings')
      .select('*')
      .eq('pharmacy_id', pharmacyId)
    
    if (error) throw error
    
    // Convert to key-value object
    const settings: Record<string, any> = {}
    data.forEach(setting => {
      settings[setting.setting_key] = setting.setting_value
    })
    
    return settings
  },

  async updateSetting(pharmacyId: string, key: string, value: any) {
    const { data, error } = await supabase()
      .from('pharmacy_settings')
      .upsert({
        pharmacy_id: pharmacyId,
        setting_key: key,
        setting_value: value
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

// Notifications API
export const notificationsApi = {
  async getAll(pharmacyId: string) {
    const { data, error } = await supabase()
      .from('notifications')
      .select('*')
      .eq('pharmacy_id', pharmacyId)
      .order('created_at', { ascending: false })
      .limit(20)
    
    if (error) throw error
    return data
  },

  async markAsRead(id: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
    
    if (error) throw error
  }
}