import React, { createContext, useContext, useEffect, useState } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase, dbHelpers } from '../lib/supabase'

// Define and export User interface
export interface User {
  id: string
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

interface AuthContextType {
  user: User | null
  supabaseUser: SupabaseUser | null
  loading: boolean
  signUp: (email: string, password: string, userData: any) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSupabaseUser(session?.user ?? null)
      if (session?.user) {
        loadUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSupabaseUser(session?.user ?? null)
      
      if (session?.user) {
        await loadUserProfile(session.user.id)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadUserProfile = async (userId: string) => {
    try {
      const profile = await dbHelpers.getUserProfile(userId)
      if (profile) {
        setUser(profile)
      } else {
        // Profile doesn't exist - user might have been created in auth but profile creation failed
        console.warn('User profile not found for authenticated user:', userId)
        setUser(null)
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, userData: any) => {
    setLoading(true)
    console.log('🚀 Starting signup process...', { email, userType: userData.user_type })
    
    try {
      // Use basic signup without metadata and disable email confirmation for development
      console.log('📧 Attempting Supabase auth signup...')
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined // Disable email confirmation
        }
      })
      
      console.log('📧 Supabase auth response:', { data: !!data, error: !!error, errorMessage: error?.message })

      if (error) {
        // Handle specific Supabase auth errors
        console.error('Supabase Auth Error:', error)
        
        if (error.message.includes('Database error saving new user')) {
          throw new Error('Database configuration issue. Please ensure the database is properly set up and try again.')
        } else if (error.message.includes('User already registered')) {
          throw new Error('An account with this email already exists. Please sign in instead.')
        } else if (error.message.includes('Signup is disabled')) {
          throw new Error('New user registration is currently disabled.')
        } else if (error.message.includes('Invalid email')) {
          throw new Error('Please enter a valid email address.')
        } else if (error.message.includes('Error sending confirmation email')) {
          throw new Error('Account created successfully! However, the confirmation email could not be sent. You can try signing in directly or contact support.')
        } else {
          throw new Error(`Authentication error: ${error.message}`)
        }
      }

      // Check if user was created successfully
      if (data.user) {
        console.log('User created in auth system:', data.user.id)
        
        // For email confirmation flow, don't create profile immediately
        if (!data.user.email_confirmed_at) {
          console.log('Email confirmation required')
          return {
            user: data.user,
            needsEmailConfirmation: true
          }
        }

        // If user is immediately confirmed, try to create profile
        try {
          const cleanUserData = {
            user_type: userData.user_type || 'customer',
            full_name: userData.full_name?.trim() || '',
            phone_number: userData.phone_number?.trim() || null,
            address: userData.address?.trim() || null,
            city: userData.city?.trim() || null,
            state: userData.state?.trim() || null,
            pincode: userData.pincode?.trim() || null,
            upi_id: userData.user_type === 'owner' ? userData.upi_id?.trim() || null : null,
            bank_account_number: userData.user_type === 'owner' ? userData.bank_account_number?.trim() || null : null,
            bank_ifsc_code: userData.user_type === 'owner' ? userData.bank_ifsc_code?.trim() || null : null,
            bank_account_holder_name: userData.user_type === 'owner' ? userData.bank_account_holder_name?.trim() || null : null,
            is_verified: false
          }

          if (!cleanUserData.full_name) {
            throw new Error('Full name is required')
          }

          await dbHelpers.createUserProfile(data.user.id, cleanUserData)
          console.log('User profile created successfully')
          
        } catch (profileError) {
          console.warn('Profile creation failed, but auth user exists. Profile can be created on next sign in:', profileError)
          // Don't throw - auth was successful, profile creation can be retried
        }
      }

      return data
      
    } catch (error) {
      console.error('❌ Error signing up:', error)
      throw error
    } finally {
      console.log('🏁 Signup process completed, resetting loading state')
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
    } catch (error) {
      console.error('Error signing in:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) throw new Error('No user logged in')
    
    try {
      const updatedProfile = await dbHelpers.updateUserProfile(user.id, updates)
      setUser(updatedProfile)
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  }

  const value = {
    user,
    supabaseUser,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}