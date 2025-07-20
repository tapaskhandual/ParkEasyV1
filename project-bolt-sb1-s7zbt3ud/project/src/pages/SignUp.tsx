import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Car, User, Phone, MapPin, CreditCard } from 'lucide-react'

const SignUp: React.FC = () => {
  const { signUp, loading } = useAuth()
  const navigate = useNavigate()
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

    try {
      await signUp(formData.email, formData.password, {
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
      navigate('/dashboard')
    } catch (error: any) {
      console.error('Sign up error:', error)
      
      // Provide more specific error messages
      let errorMessage = 'Failed to create account'
      
      if (error.message) {
        if (error.message.includes('User already registered')) {
          errorMessage = 'An account with this email already exists. Please sign in instead.'
        } else if (error.message.includes('Password should be at least')) {
          errorMessage = 'Password must be at least 6 characters long'
        } else if (error.message.includes('Invalid email')) {
          errorMessage = 'Please enter a valid email address'
        } else if (error.message.includes('phone_number')) {
          errorMessage = 'Phone number is already taken. Please use a different phone number.'
        } else {
          errorMessage = error.message
        }
      }
      
      setError(errorMessage)
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

            {/* User Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                I want to
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, user_type: 'customer' })}
                  className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                    formData.user_type === 'customer'
                      ? 'border-blue-600 bg-blue-50 text-blue-600'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <User className="h-4 w-4 mx-auto mb-1" />
                  Find Parking
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, user_type: 'owner' })}
                  className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                    formData.user_type === 'owner'
                      ? 'border-blue-600 bg-blue-50 text-blue-600'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Car className="h-4 w-4 mx-auto mb-1" />
                  List My Space
                </button>
              </div>
            </div>

            {/* Basic Information */}
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
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                Address Information (Optional)
              </h3>
              
              <div>
                <input
                  name="address"
                  type="text"
                  placeholder="Street Address"
                  value={formData.address}
                  onChange={handleChange}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  name="city"
                  type="text"
                  placeholder="City"
                  value={formData.city}
                  onChange={handleChange}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  name="state"
                  type="text"
                  placeholder="State"
                  value={formData.state}
                  onChange={handleChange}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <input
                  name="pincode"
                  type="text"
                  placeholder="PIN Code"
                  value={formData.pincode}
                  onChange={handleChange}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Payment Information for Owners */}
            {formData.user_type === 'owner' && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700 flex items-center">
                  <CreditCard className="h-4 w-4 mr-1" />
                  Payment Information (Optional)
                </h3>
                
                <div>
                  <input
                    name="upi_id"
                    type="text"
                    placeholder="UPI ID (e.g., yourname@paytm)"
                    value={formData.upi_id}
                    onChange={handleChange}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <input
                    name="bank_account_holder_name"
                    type="text"
                    placeholder="Account Holder Name"
                    value={formData.bank_account_holder_name}
                    onChange={handleChange}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <input
                    name="bank_account_number"
                    type="text"
                    placeholder="Bank Account Number"
                    value={formData.bank_account_number}
                    onChange={handleChange}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <input
                    name="bank_ifsc_code"
                    type="text"
                    placeholder="IFSC Code"
                    value={formData.bank_ifsc_code}
                    onChange={handleChange}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default SignUp