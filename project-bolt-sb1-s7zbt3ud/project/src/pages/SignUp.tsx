import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Car, User, Phone, MapPin, CreditCard } from 'lucide-react'

const SignUp: React.FC = () => {
  const { signUp, loading } = useAuth()
  const navigate = useNavigate()
  const [localLoading, setLocalLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone_number: '',
    user_type: 'customer' as 'customer' | 'owner',
    address: '',
    city: '',
    state: '',
    pincode: '',
    upi_id: '',
    bank_account_number: '',
    bank_ifsc_code: '',
    bank_account_holder_name: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (!formData.full_name.trim()) {
      setError('Full name is required')
      return
    }

    if (!formData.phone_number.trim()) {
      setError('Phone number is required')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address')
      return
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^[+]?[\d\s\-\(\)]{10,}$/
    if (!phoneRegex.test(formData.phone_number.trim())) {
      setError('Please enter a valid phone number')
      return
    }

    let timeoutId: NodeJS.Timeout | null = null
    
    try {
      setLocalLoading(true)
      console.log('🔄 SignUp: Starting signup process...')
      
      // Add a timeout to prevent infinite loading
      timeoutId = setTimeout(() => {
        setLocalLoading(false)
        setError('Request timed out. Please try again.')
      }, 30000) // 30 second timeout
      
      const result = await signUp(formData.email, formData.password, {
        user_type: formData.user_type,
        full_name: formData.full_name.trim(),
        phone_number: formData.phone_number.trim(),
        address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        state: formData.state.trim() || null,
        pincode: formData.pincode.trim() || null,
        upi_id: formData.user_type === 'owner' ? formData.upi_id.trim() || null : null,
        bank_account_number: formData.user_type === 'owner' ? formData.bank_account_number.trim() || null : null,
        bank_ifsc_code: formData.user_type === 'owner' ? formData.bank_ifsc_code.trim() || null : null,
        bank_account_holder_name: formData.user_type === 'owner' ? formData.bank_account_holder_name.trim() || null : null,
      })
      
      if (timeoutId) clearTimeout(timeoutId) // Clear the timeout if signup completes
      console.log('✅ SignUp: Signup completed successfully')
      
      // Handle different signup outcomes
      if (result && result.needsEmailConfirmation) {
        setSuccess('Account created! Please check your email to verify your account before signing in.')
        // Don't navigate yet - user needs to confirm email first
      } else {
        setSuccess('Account created successfully!')
        setTimeout(() => {
          navigate('/dashboard')
        }, 2000)
      }
      
    } catch (error: any) {
      console.error('Sign up error:', error)
      
      // Provide more specific error messages
      let errorMessage = 'Failed to create account'
      
      if (error.message) {
        if (error.message.includes('Database configuration issue')) {
          errorMessage = 'Database setup issue detected. Please contact support or try again later.'
        } else if (error.message.includes('Database error saving new user')) {
          errorMessage = 'Server configuration issue. Please contact support or try again later.'
        } else if (error.message.includes('User already registered') || error.message.includes('already exists')) {
          errorMessage = 'An account with this email already exists. Please sign in instead.'
        } else if (error.message.includes('Password should be at least')) {
          errorMessage = 'Password must be at least 6 characters long'
        } else if (error.message.includes('Invalid email')) {
          errorMessage = 'Please enter a valid email address'
        } else if (error.message.includes('phone_number') || error.message.includes('Phone number')) {
          errorMessage = 'Phone number is already registered. Please use a different phone number.'
        } else if (error.message.includes('Signup is disabled')) {
          errorMessage = 'New user registration is currently disabled. Please contact support.'
        } else if (error.message.includes('Missing required information')) {
          errorMessage = 'Please fill in all required fields'
        } else if (error.message.includes('Invalid data format')) {
          errorMessage = 'Please check your inputs and try again'
        } else if (error.message.includes('confirmation email could not be sent')) {
          // This is actually a success case - account was created
          setSuccess('Account created successfully! You can now try signing in.')
          setTimeout(() => {
            navigate('/signin')
          }, 3000)
          return
        } else if (error.message.includes('Authentication error')) {
          errorMessage = error.message
        } else {
          errorMessage = error.message
        }
      }
      
      setError(errorMessage)
    } finally {
      if (timeoutId) clearTimeout(timeoutId) // Ensure timeout is cleared
      setLocalLoading(false)
      console.log('🏁 SignUp: Process completed, local loading reset')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Car className="h-12 w-12 text-blue-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link to="/signin" className="font-medium text-blue-600 hover:text-blue-500">
            sign in to your existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm">
                {success}
              </div>
            )}

            {/* User Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                I want to
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="user_type"
                    value="customer"
                    checked={formData.user_type === 'customer'}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Find parking spaces</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="user_type"
                    value="owner"
                    checked={formData.user_type === 'owner'}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">List my parking space</span>
                </label>
              </div>
            </div>

            {/* Basic Information */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <User className="h-4 w-4" />
                <span>Basic Information</span>
              </div>

              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                  Full Name *
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">
                  Phone Number *
                </label>
                <input
                  id="phone_number"
                  name="phone_number"
                  type="tel"
                  required
                  value={formData.phone_number}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password *
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <MapPin className="h-4 w-4" />
                <span>Address (Optional)</span>
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Street Address
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  value={formData.address}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                    City
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    value={formData.city}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                    State
                  </label>
                  <input
                    id="state"
                    name="state"
                    type="text"
                    value={formData.state}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="pincode" className="block text-sm font-medium text-gray-700">
                  Pincode
                </label>
                <input
                  id="pincode"
                  name="pincode"
                  type="text"
                  value={formData.pincode}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Banking Information for Owners */}
            {formData.user_type === 'owner' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                  <CreditCard className="h-4 w-4" />
                  <span>Payment Information (Optional)</span>
                </div>

                <div>
                  <label htmlFor="upi_id" className="block text-sm font-medium text-gray-700">
                    UPI ID
                  </label>
                  <input
                    id="upi_id"
                    name="upi_id"
                    type="text"
                    placeholder="your-upi@bank"
                    value={formData.upi_id}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="bank_account_number" className="block text-sm font-medium text-gray-700">
                    Bank Account Number
                  </label>
                  <input
                    id="bank_account_number"
                    name="bank_account_number"
                    type="text"
                    value={formData.bank_account_number}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="bank_ifsc_code" className="block text-sm font-medium text-gray-700">
                    IFSC Code
                  </label>
                  <input
                    id="bank_ifsc_code"
                    name="bank_ifsc_code"
                    type="text"
                    value={formData.bank_ifsc_code}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="bank_account_holder_name" className="block text-sm font-medium text-gray-700">
                    Account Holder Name
                  </label>
                  <input
                    id="bank_account_holder_name"
                    name="bank_account_holder_name"
                    type="text"
                    value={formData.bank_account_holder_name}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading || localLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {(loading || localLoading) ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>

            {/* Debug Information */}
            {error && error.includes('Database configuration issue') && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <h5 className="text-sm font-medium text-yellow-800 mb-2">⚠️ Database Setup Issue Detected</h5>
                <p className="text-xs text-yellow-700 mb-2">
                  Your Supabase database is not properly configured. This is preventing user signup.
                </p>
                <div className="text-xs text-yellow-700">
                  <strong>Required Actions:</strong>
                  <ol className="list-decimal list-inside mt-1 space-y-1">
                    <li>Go to your Supabase Dashboard</li>
                    <li>Open SQL Editor</li>
                    <li>Run the setup-database.sql script</li>
                    <li>Ensure all tables are created</li>
                    <li>Verify RLS policies are enabled</li>
                  </ol>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
                    if (supabaseUrl) {
                      const projectId = supabaseUrl.split('//')[1].split('.')[0]
                      window.open(`https://supabase.com/dashboard/project/${projectId}/sql`, '_blank')
                    }
                  }}
                  className="mt-2 text-xs bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded"
                >
                  Open Supabase SQL Editor
                </button>
              </div>
            )}

            {/* Debug Information */}
            <div className="mt-6 p-4 bg-gray-50 rounded-md">
              <h4 className="text-sm font-medium text-gray-900 mb-2">🔧 Debug Information</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <p><strong>Supabase URL:</strong> {import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</p>
                <p><strong>Supabase Key:</strong> {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</p>
                <p><strong>Environment:</strong> {import.meta.env.MODE}</p>
                <p><strong>Loading State:</strong> {loading || localLoading ? '🔄 Active' : '✅ Ready'}</p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default SignUp