export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      pharmacies: {
        Row: {
          id: string
          name: string
          license_number: string
          owner_id: string | null
          address: string | null
          phone: string | null
          email: string | null
          city: string | null
          district: string | null
          province: string | null
          status: 'active' | 'inactive' | 'suspended' | 'trial'
          subscription_plan: 'trial' | 'standard' | 'premium'
          subscription_expires_at: string | null
          rra_tin: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          license_number: string
          owner_id?: string | null
          address?: string | null
          phone?: string | null
          email?: string | null
          city?: string | null
          district?: string | null
          province?: string | null
          status?: 'active' | 'inactive' | 'suspended' | 'trial'
          subscription_plan?: 'trial' | 'standard' | 'premium'
          subscription_expires_at?: string | null
          rra_tin?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          license_number?: string
          owner_id?: string | null
          address?: string | null
          phone?: string | null
          email?: string | null
          city?: string | null
          district?: string | null
          province?: string | null
          status?: 'active' | 'inactive' | 'suspended' | 'trial'
          subscription_plan?: 'trial' | 'standard' | 'premium'
          subscription_expires_at?: string | null
          rra_tin?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      inventory: {
        Row: {
          id: string
          pharmacy_id: string
          medication_id: string
          supplier_id: string | null
          batch_number: string
          quantity_in_stock: number
          unit_cost: number
          selling_price: number
          minimum_stock_level: number
          expiry_date: string | null
          manufacturing_date: string | null
          received_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          pharmacy_id: string
          medication_id: string
          supplier_id?: string | null
          batch_number: string
          quantity_in_stock?: number
          unit_cost?: number
          selling_price?: number
          minimum_stock_level?: number
          expiry_date?: string | null
          manufacturing_date?: string | null
          received_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          pharmacy_id?: string
          medication_id?: string
          supplier_id?: string | null
          batch_number?: string
          quantity_in_stock?: number
          unit_cost?: number
          selling_price?: number
          minimum_stock_level?: number
          expiry_date?: string | null
          manufacturing_date?: string | null
          received_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      sales: {
        Row: {
          id: string
          pharmacy_id: string
          cashier_id: string | null
          customer_name: string | null
          customer_phone: string | null
          insurance_provider_id: string | null
          subtotal: number
          insurance_amount: number
          customer_amount: number
          total_amount: number
          payment_method: 'cash' | 'card' | 'mobile_money' | 'insurance' | 'mixed'
          status: 'completed' | 'pending' | 'cancelled' | 'refunded'
          rra_invoice_number: string | null
          receipt_number: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          pharmacy_id: string
          cashier_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          insurance_provider_id?: string | null
          subtotal?: number
          insurance_amount?: number
          customer_amount?: number
          total_amount?: number
          payment_method?: 'cash' | 'card' | 'mobile_money' | 'insurance' | 'mixed'
          status?: 'completed' | 'pending' | 'cancelled' | 'refunded'
          rra_invoice_number?: string | null
          receipt_number?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          pharmacy_id?: string
          cashier_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          insurance_provider_id?: string | null
          subtotal?: number
          insurance_amount?: number
          customer_amount?: number
          total_amount?: number
          payment_method?: 'cash' | 'card' | 'mobile_money' | 'insurance' | 'mixed'
          status?: 'completed' | 'pending' | 'cancelled' | 'refunded'
          rra_invoice_number?: string | null
          receipt_number?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      pharmacy_dashboard_stats: {
        Row: {
          pharmacy_id: string
          pharmacy_name: string
          total_sales_today: number
          total_revenue_today: number
          low_stock_items: number
          expiring_items: number
          active_staff: number
        }
      }
      inventory_alerts: {
        Row: {
          pharmacy_id: string
          medication_name: string
          quantity_in_stock: number
          minimum_stock_level: number
          expiry_date: string | null
          alert_type: 'low_stock' | 'expiring_soon' | 'expired' | 'normal'
        }
      }
    }
  }
}