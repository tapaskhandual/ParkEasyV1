import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Helper functions for database operations
export const dbHelpers = {
  // User Profile Operations
  async createUserProfile(userId: string, profileData: any) {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert([{ id: userId, ...profileData }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) {
      // If profile doesn't exist, return null instead of throwing
      if (error.code === 'PGRST116') {
        return null
      }
      throw error
    }
    return data
  },

  async updateUserProfile(userId: string, updates: any) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Parking Space Operations
  async createParkingSpace(spaceData: any) {
    const { data, error } = await supabase
      .from('parking_spaces')
      .insert([spaceData])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getParkingSpaces(filters: any = {}) {
    let query = supabase
      .from('parking_spaces')
      .select(`
        *,
        owner:user_profiles(full_name, phone_number)
      `)
      .eq('is_active', true)

    if (filters.city) {
      query = query.eq('city', filters.city)
    }

    if (filters.bounds) {
      const { north, south, east, west } = filters.bounds
      query = query
        .gte('latitude', south)
        .lte('latitude', north)
        .gte('longitude', west)
        .lte('longitude', east)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  },

  async getOwnerParkingSpaces(ownerId: string) {
    const { data, error } = await supabase
      .from('parking_spaces')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Booking Operations
  async createBooking(bookingData: any) {
    const { data, error } = await supabase
      .from('bookings')
      .insert([bookingData])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getUserBookings(userId: string) {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        parking_space:parking_spaces(title, address, city),
        customer:user_profiles(full_name, phone_number)
      `)
      .eq('customer_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async getOwnerBookings(ownerId: string) {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        parking_space:parking_spaces!inner(title, address, city),
        customer:user_profiles(full_name, phone_number)
      `)
      .eq('parking_spaces.owner_id', ownerId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Payment Operations
  async createPayment(paymentData: any) {
    const { data, error } = await supabase
      .from('payments')
      .insert([paymentData])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updatePayment(paymentId: string, updates: any) {
    const { data, error } = await supabase
      .from('payments')
      .update(updates)
      .eq('id', paymentId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Admin Operations
  async getAdminSettings() {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('*')
    
    if (error) throw error
    return data
  },

  async updateAdminSetting(key: string, value: string, updatedBy: string) {
    const { data, error } = await supabase
      .from('admin_settings')
      .update({ setting_value: value, updated_by: updatedBy })
      .eq('setting_key', key)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getPlatformStatistics() {
    const { data, error } = await supabase
      .from('platform_statistics')
      .select('*')
      .order('date', { ascending: false })
      .limit(30)
    
    if (error) throw error
    return data
  },

  async updatePlatformStatistics() {
    const { error } = await supabase.rpc('update_platform_statistics')
    if (error) throw error
  },

  // Additional helper functions for payment processing
  async getPaymentsByBookingId(bookingId: string) {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('booking_id', bookingId)
    
    if (error) throw error
    return data || []
  },

  async getBookingById(bookingId: string) {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        parking_space:parking_spaces(title, address, city),
        customer:user_profiles(full_name, phone_number)
      `)
      .eq('id', bookingId)
      .single()
    
    if (error) throw error
    return data
  },

  async updateBooking(bookingId: string, updates: any) {
    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', bookingId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}