export interface User {
  id: string
  email: string
  user_type: 'customer' | 'owner' | 'admin'
  full_name: string
  phone_number?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  upi_id?: string
  bank_account_number?: string
  bank_ifsc_code?: string
  bank_account_holder_name?: string
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface ParkingSpace {
  id: string
  owner_id: string
  title: string
  description?: string
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
  owner?: {
    full_name: string
    phone_number: string
  }
}

export interface Booking {
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
  parking_space?: {
    title: string
    address: string
    city: string
  }
  customer?: {
    full_name: string
    phone_number: string
  }
}

export interface Payment {
  id: string
  booking_id: string
  payment_id?: string
  payment_request_id?: string
  amount: number
  status: 'pending' | 'paid' | 'failed' | 'refunded'
  payment_method?: string
  gateway_response: any
  created_at: string
  updated_at: string
}

export interface AdminSetting {
  id: string
  setting_key: string
  setting_value: string
  description?: string
  updated_by?: string
  created_at: string
  updated_at: string
}

export interface PlatformStatistics {
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

export interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}

export interface Location {
  latitude: number
  longitude: number
}

export interface BookingFormData {
  parking_space_id: string
  start_time: string
  end_time: string
  duration_hours: number
  vehicle_number: string
  vehicle_type: 'car' | 'bike'
  total_amount: number
}

export interface ParkingSpaceFormData {
  title: string
  description: string
  address: string
  city: string
  state: string
  pincode: string
  latitude: number
  longitude: number
  hourly_rate: number
  space_type: 'car' | 'bike' | 'both'
  total_slots: number
  amenities: string[]
  images: string[]
}