export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      insurance_claims: {
        Row: {
          approved_amount: number | null
          claim_amount: number
          claim_number: string | null
          created_at: string | null
          id: string
          insurance_provider_id: string | null
          notes: string | null
          patient_id_number: string | null
          patient_name: string
          pharmacy_id: string | null
          processed_at: string | null
          sale_id: string | null
          status: Database["public"]["Enums"]["insurance_claim_status"] | null
          submitted_at: string | null
          updated_at: string | null
        }
        Insert: {
          approved_amount?: number | null
          claim_amount: number
          claim_number?: string | null
          created_at?: string | null
          id?: string
          insurance_provider_id?: string | null
          notes?: string | null
          patient_id_number?: string | null
          patient_name: string
          pharmacy_id?: string | null
          processed_at?: string | null
          sale_id?: string | null
          status?: Database["public"]["Enums"]["insurance_claim_status"] | null
          submitted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          approved_amount?: number | null
          claim_amount?: number
          claim_number?: string | null
          created_at?: string | null
          id?: string
          insurance_provider_id?: string | null
          notes?: string | null
          patient_id_number?: string | null
          patient_name?: string
          pharmacy_id?: string | null
          processed_at?: string | null
          sale_id?: string | null
          status?: Database["public"]["Enums"]["insurance_claim_status"] | null
          submitted_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insurance_claims_insurance_provider_id_fkey"
            columns: ["insurance_provider_id"]
            isOneToOne: false
            referencedRelation: "insurance_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_claims_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_claims_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "user_roles_view"
            referencedColumns: ["pharmacy_id"]
          },
          {
            foreignKeyName: "insurance_claims_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_providers: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          coverage_percentage: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          pharmacy_id: string | null
          policy_number: string | null
          updated_at: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          coverage_percentage?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          pharmacy_id?: string | null
          policy_number?: string | null
          updated_at?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          coverage_percentage?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          pharmacy_id?: string | null
          policy_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insurance_providers_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_providers_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "user_roles_view"
            referencedColumns: ["pharmacy_id"]
          },
        ]
      }
      inventory: {
        Row: {
          batch_number: string
          created_at: string | null
          expiry_date: string | null
          id: string
          manufacturing_date: string | null
          medication_id: string | null
          minimum_stock_level: number | null
          pharmacy_id: string | null
          quantity_in_stock: number | null
          received_date: string | null
          selling_price: number | null
          supplier_id: string | null
          unit_cost: number | null
          updated_at: string | null
        }
        Insert: {
          batch_number: string
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          manufacturing_date?: string | null
          medication_id?: string | null
          minimum_stock_level?: number | null
          pharmacy_id?: string | null
          quantity_in_stock?: number | null
          received_date?: string | null
          selling_price?: number | null
          supplier_id?: string | null
          unit_cost?: number | null
          updated_at?: string | null
        }
        Update: {
          batch_number?: string
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          manufacturing_date?: string | null
          medication_id?: string | null
          minimum_stock_level?: number | null
          pharmacy_id?: string | null
          quantity_in_stock?: number | null
          received_date?: string | null
          selling_price?: number | null
          supplier_id?: string | null
          unit_cost?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "user_roles_view"
            referencedColumns: ["pharmacy_id"]
          },
          {
            foreignKeyName: "inventory_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          barcode: string | null
          brand_name: string | null
          category: Database["public"]["Enums"]["medication_category"] | null
          created_at: string | null
          description: string | null
          dosage_form: string | null
          generic_name: string | null
          id: string
          is_active: boolean | null
          manufacturer: string | null
          name: string
          pharmacy_id: string | null
          requires_prescription: boolean | null
          strength: string | null
          updated_at: string | null
        }
        Insert: {
          barcode?: string | null
          brand_name?: string | null
          category?: Database["public"]["Enums"]["medication_category"] | null
          created_at?: string | null
          description?: string | null
          dosage_form?: string | null
          generic_name?: string | null
          id?: string
          is_active?: boolean | null
          manufacturer?: string | null
          name: string
          pharmacy_id?: string | null
          requires_prescription?: boolean | null
          strength?: string | null
          updated_at?: string | null
        }
        Update: {
          barcode?: string | null
          brand_name?: string | null
          category?: Database["public"]["Enums"]["medication_category"] | null
          created_at?: string | null
          description?: string | null
          dosage_form?: string | null
          generic_name?: string | null
          id?: string
          is_active?: boolean | null
          manufacturer?: string | null
          name?: string
          pharmacy_id?: string | null
          requires_prescription?: boolean | null
          strength?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medications_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medications_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "user_roles_view"
            referencedColumns: ["pharmacy_id"]
          },
        ]
      }
      pharmacies: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          district: string | null
          email: string | null
          id: string
          license_number: string
          name: string
          owner_id: string | null
          phone: string | null
          province: string | null
          rra_tin: string | null
          status: Database["public"]["Enums"]["pharmacy_status"] | null
          subscription_expires_at: string | null
          subscription_plan:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          district?: string | null
          email?: string | null
          id?: string
          license_number: string
          name: string
          owner_id?: string | null
          phone?: string | null
          province?: string | null
          rra_tin?: string | null
          status?: Database["public"]["Enums"]["pharmacy_status"] | null
          subscription_expires_at?: string | null
          subscription_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          district?: string | null
          email?: string | null
          id?: string
          license_number?: string
          name?: string
          owner_id?: string | null
          phone?: string | null
          province?: string | null
          rra_tin?: string | null
          status?: Database["public"]["Enums"]["pharmacy_status"] | null
          subscription_expires_at?: string | null
          subscription_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pharmacy_users: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          pharmacy_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          pharmacy_id?: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          pharmacy_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_users_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_users_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "user_roles_view"
            referencedColumns: ["pharmacy_id"]
          },
        ]
      }
      sale_items: {
        Row: {
          batch_number: string | null
          created_at: string | null
          expiry_date: string | null
          id: string
          inventory_id: string | null
          medication_name: string
          quantity: number
          sale_id: string | null
          total_price: number
          unit_price: number
        }
        Insert: {
          batch_number?: string | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          inventory_id?: string | null
          medication_name: string
          quantity: number
          sale_id?: string | null
          total_price: number
          unit_price: number
        }
        Update: {
          batch_number?: string | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          inventory_id?: string | null
          medication_name?: string
          quantity?: number
          sale_id?: string | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          cashier_id: string | null
          created_at: string | null
          customer_amount: number | null
          customer_name: string | null
          customer_phone: string | null
          id: string
          insurance_amount: number | null
          insurance_provider_id: string | null
          notes: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          pharmacy_id: string | null
          receipt_number: string | null
          rra_invoice_number: string | null
          status: Database["public"]["Enums"]["sale_status"] | null
          subtotal: number | null
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          cashier_id?: string | null
          created_at?: string | null
          customer_amount?: number | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          insurance_amount?: number | null
          insurance_provider_id?: string | null
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          pharmacy_id?: string | null
          receipt_number?: string | null
          rra_invoice_number?: string | null
          status?: Database["public"]["Enums"]["sale_status"] | null
          subtotal?: number | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          cashier_id?: string | null
          created_at?: string | null
          customer_amount?: number | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          insurance_amount?: number | null
          insurance_provider_id?: string | null
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          pharmacy_id?: string | null
          receipt_number?: string | null
          rra_invoice_number?: string | null
          status?: Database["public"]["Enums"]["sale_status"] | null
          subtotal?: number | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_insurance_provider_id_fkey"
            columns: ["insurance_provider_id"]
            isOneToOne: false
            referencedRelation: "insurance_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "user_roles_view"
            referencedColumns: ["pharmacy_id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          inventory_id: string | null
          movement_type: string
          notes: string | null
          pharmacy_id: string | null
          quantity: number
          reference_id: string | null
          reference_type: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          inventory_id?: string | null
          movement_type: string
          notes?: string | null
          pharmacy_id?: string | null
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          inventory_id?: string | null
          movement_type?: string
          notes?: string | null
          pharmacy_id?: string | null
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "user_roles_view"
            referencedColumns: ["pharmacy_id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number | null
          created_at: string | null
          currency: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          payment_reference: string | null
          pharmacy_id: string | null
          plan: Database["public"]["Enums"]["subscription_plan"]
          start_date: string | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          payment_reference?: string | null
          pharmacy_id?: string | null
          plan: Database["public"]["Enums"]["subscription_plan"]
          start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          payment_reference?: string | null
          pharmacy_id?: string | null
          plan?: Database["public"]["Enums"]["subscription_plan"]
          start_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "user_roles_view"
            referencedColumns: ["pharmacy_id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          pharmacy_id: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          pharmacy_id?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          pharmacy_id?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suppliers_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "user_roles_view"
            referencedColumns: ["pharmacy_id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          image: string | null
          name: string | null
          token_identifier: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          image?: string | null
          name?: string | null
          token_identifier: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          image?: string | null
          name?: string | null
          token_identifier?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      user_roles_view: {
        Row: {
          effective_role: string | null
          email: string | null
          full_name: string | null
          is_active: boolean | null
          pharmacy_id: string | null
          pharmacy_name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      assign_user_to_pharmacy: {
        Args: {
          pharmacy_name: string
          user_email: string
          user_role: Database["public"]["Enums"]["user_role"]
        }
        Returns: boolean
      }
      check_user_permission: {
        Args: { pharmacy_id?: string; required_role: string; user_id: string }
        Returns: boolean
      }
      get_user_pharmacies: {
        Args: { user_id: string }
        Returns: {
          pharmacy_id: string
          pharmacy_name: string
          user_role: string
        }[]
      }
      setup_test_user_roles: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      insurance_claim_status: "pending" | "approved" | "rejected" | "processing"
      medication_category:
        | "prescription"
        | "otc"
        | "controlled"
        | "supplement"
        | "medical_device"
      payment_method: "cash" | "card" | "mobile_money" | "insurance" | "mixed"
      pharmacy_status: "active" | "inactive" | "suspended" | "trial"
      sale_status: "completed" | "pending" | "cancelled" | "refunded"
      subscription_plan: "trial" | "standard" | "premium"
      user_role: "admin" | "pharmacy_owner" | "pharmacist" | "cashier" | "staff"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      insurance_claim_status: ["pending", "approved", "rejected", "processing"],
      medication_category: [
        "prescription",
        "otc",
        "controlled",
        "supplement",
        "medical_device",
      ],
      payment_method: ["cash", "card", "mobile_money", "insurance", "mixed"],
      pharmacy_status: ["active", "inactive", "suspended", "trial"],
      sale_status: ["completed", "pending", "cancelled", "refunded"],
      subscription_plan: ["trial", "standard", "premium"],
      user_role: ["admin", "pharmacy_owner", "pharmacist", "cashier", "staff"],
    },
  },
} as const
