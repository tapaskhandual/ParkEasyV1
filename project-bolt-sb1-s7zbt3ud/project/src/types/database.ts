export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          user_type: 'customer' | 'owner' | 'admin'
          full_name: string
          phone_number: string | null
          address: string | null
          city: string | null
          state: string | null
          pincode: string | null
          upi_id: string | null
          bank_account_number: string | null
          bank_ifsc_code: string | null
          bank_account_holder_name: string | null
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          user_type?: 'customer' | 'owner' | 'admin'
          full_name: string
          phone_number?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          pincode?: string | null
          upi_id?: string | null
          bank_account_number?: string | null
          bank_ifsc_code?: string | null
          bank_account_holder_name?: string | null
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_type?: 'customer' | 'owner' | 'admin'
          full_name?: string
          phone_number?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          pincode?: string | null
          upi_id?: string | null
          bank_account_number?: string | null
          bank_ifsc_code?: string | null
          bank_account_holder_name?: string | null
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      parking_spaces: {
        Row: {
          id: string
          owner_id: string
          title: string
          description: string | null
          address: string
          city: string
          state: string
          pincode: string
          latitude: number
          longitude: number
          hourly_rate: number
          space_type: 'car' | 'bike' | 'both'
          total_slots: number
          available_slots: number
          amenities: string[]
          images: string[]
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          title: string
          description?: string | null
          address: string
          city: string
          state: string
          pincode: string
          latitude: number
          longitude: number
          hourly_rate: number
          space_type?: 'car' | 'bike' | 'both'
          total_slots?: number
          available_slots?: number
          amenities?: string[]
          images?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          title?: string
          description?: string | null
          address?: string
          city?: string
          state?: string
          pincode?: string
          latitude?: number
          longitude?: number
          hourly_rate?: number
          space_type?: 'car' | 'bike' | 'both'
          total_slots?: number
          available_slots?: number
          amenities?: string[]
          images?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          customer_id: string
          parking_space_id: string
          booking_date: string
          start_time: string
          end_time: string
          duration_hours: number
          total_amount: number
          admin_commission: number
          owner_amount: number
          payment_gateway_fee: number
          vehicle_number: string
          vehicle_type: 'car' | 'bike'
          status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          parking_space_id: string
          booking_date: string
          start_time: string
          end_time: string
          duration_hours: number
          total_amount: number
          admin_commission?: number
          owner_amount?: number
          payment_gateway_fee?: number
          vehicle_number: string
          vehicle_type: 'car' | 'bike'
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          parking_space_id?: string
          booking_date?: string
          start_time?: string
          end_time?: string
          duration_hours?: number
          total_amount?: number
          admin_commission?: number
          owner_amount?: number
          payment_gateway_fee?: number
          vehicle_number?: string
          vehicle_type?: 'car' | 'bike'
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          booking_id: string
          payment_id: string | null
          payment_request_id: string | null
          amount: number
          status: 'pending' | 'paid' | 'failed' | 'refunded'
          payment_method: string | null
          gateway_response: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          payment_id?: string | null
          payment_request_id?: string | null
          amount: number
          status?: 'pending' | 'paid' | 'failed' | 'refunded'
          payment_method?: string | null
          gateway_response?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          payment_id?: string | null
          payment_request_id?: string | null
          amount?: number
          status?: 'pending' | 'paid' | 'failed' | 'refunded'
          payment_method?: string | null
          gateway_response?: any
          created_at?: string
          updated_at?: string
        }
      }
      admin_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: string
          description: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value: string
          description?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: string
          description?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      platform_statistics: {
        Row: {
          id: string
          total_users: number
          total_owners: number
          total_customers: number
          total_parking_spaces: number
          total_bookings: number
          total_revenue: number
          total_commission: number
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          total_users?: number
          total_owners?: number
          total_customers?: number
          total_parking_spaces?: number
          total_bookings?: number
          total_revenue?: number
          total_commission?: number
          date?: string
          created_at?: string
        }
        Update: {
          id?: string
          total_users?: number
          total_owners?: number
          total_customers?: number
          total_parking_spaces?: number
          total_bookings?: number
          total_revenue?: number
          total_commission?: number
          date?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_platform_statistics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      user_type_enum: 'customer' | 'owner' | 'admin'
      space_type_enum: 'car' | 'bike' | 'both'
      booking_status_enum: 'pending' | 'confirmed' | 'completed' | 'cancelled'
      payment_status_enum: 'pending' | 'paid' | 'failed' | 'refunded'
      vehicle_type_enum: 'car' | 'bike'
      transaction_status_enum: 'pending' | 'processed' | 'failed'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}