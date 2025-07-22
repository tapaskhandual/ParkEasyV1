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

// Test database connection and auth setup
export const testDatabaseConnection = async () => {
  try {
    // Test 1: Check if user_profiles table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from('user_profiles')
      .select('count(*)')
      .limit(1)
    
    if (tableError) {
      console.error('Database table check failed:', tableError)
      if (tableError.code === '42P01') {
        throw new Error('Database tables not found. Please run the setup-database.sql script in your Supabase SQL editor.')
      }
      throw new Error(`Database error: ${tableError.message}`)
    }
    
    // Test 2: Check auth configuration
    const { data: authUser } = await supabase.auth.getUser()
    console.log('Auth service accessible:', !!authUser)
    
    // Test 3: Check RLS policies
    const { data: rlsCheck, error: rlsError } = await supabase
      .rpc('has_table_privilege', { 
        table_name: 'user_profiles', 
        privilege: 'INSERT' 
      })
      .single()
    
    console.log('Database connection successful', {
      tablesExist: true,
      authAccessible: !!authUser,
      insertPrivileges: !rlsError
    })
    
    return true
  } catch (error) {
    console.error('Database connection test error:', error)
    throw error
  }
}

// Diagnose auth issues
export const diagnoseAuthIssues = async () => {
  try {
    // Check if we can access auth metadata
    const { data, error } = await supabase.auth.getSession()
    console.log('Auth session check:', { hasSession: !!data.session, error })
    
    // Test basic database connectivity
    const { data: basicTest, error: basicError } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1)
    
    console.log('Basic database test:', { success: !basicError, error: basicError })
    
    return {
      authAccessible: !error,
      databaseAccessible: !basicError,
      recommendation: basicError?.code === '42P01' 
        ? 'Run setup-database.sql in Supabase SQL editor'
        : 'Check Supabase project status and credentials'
    }
  } catch (error) {
    console.error('Auth diagnosis failed:', error)
    return {
      authAccessible: false,
      databaseAccessible: false,
      recommendation: 'Check Supabase project status and credentials'
    }
  }
}

// Helper functions for database operations
export const dbHelpers = {
  // User Profile Operations
  async createUserProfile(userId: string, profileData: any) {
    try {
      // Validate required fields
      if (!userId) {
        throw new Error('User ID is required')
      }
      
      if (!profileData.full_name || !profileData.full_name.trim()) {
        throw new Error('Full name is required')
      }

      // Ensure user_type is valid
      const validUserTypes = ['customer', 'owner', 'admin']
      if (!validUserTypes.includes(profileData.user_type)) {
        throw new Error('Invalid user type')
      }

      // Clean the data
      const cleanData = {
        id: userId,
        user_type: profileData.user_type,
        full_name: profileData.full_name.trim(),
        phone_number: profileData.phone_number || null,
        address: profileData.address || null,
        city: profileData.city || null,
        state: profileData.state || null,
        pincode: profileData.pincode || null,
        upi_id: profileData.upi_id || null,
        bank_account_number: profileData.bank_account_number || null,
        bank_ifsc_code: profileData.bank_ifsc_code || null,
        bank_account_holder_name: profileData.bank_account_holder_name || null,
        is_verified: profileData.is_verified || false
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .insert([cleanData])
        .select()
        .single()
      
      if (error) {
        console.error('Database error creating user profile:', error)
        
        // Handle specific database errors
        if (error.code === '23505') {
          if (error.message.includes('phone_number')) {
            throw new Error('Phone number is already registered. Please use a different phone number.')
          } else {
            throw new Error('A user with this information already exists.')
          }
        } else if (error.code === '23502') {
          throw new Error('Missing required information. Please fill in all required fields.')
        } else if (error.code === '23514') {
          throw new Error('Invalid data format. Please check your inputs.')
        } else {
          throw new Error(`Database error: ${error.message}`)
        }
      }
      
      return data
    } catch (error) {
      console.error('Error in createUserProfile:', error)
      throw error
    }
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