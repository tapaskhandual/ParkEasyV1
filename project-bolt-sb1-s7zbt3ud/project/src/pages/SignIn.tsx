import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Car } from 'lucide-react'

const SignIn: React.FC = () => {
  const { signIn, loading, clearSession } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [localLoading, setLocalLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const from = location.state?.from?.pathname || '/dashboard'

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address')
      return
    }

    // Check if there's ANY active session first and clear it
    console.log('🔍 Checking for existing sessions before signin...')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        console.log('⚠️ Active session detected before signin:', { 
          sessionEmail: session.user.email, 
          attemptingEmail: formData.email,
          userId: session.user.id 
        })
        
        // Always clear any existing session before signin
        setSuccess('Existing session detected. Clearing it for clean signin...')
        setLocalLoading(true)
        
        // Immediate session cleanup
        try {
          await supabase.auth.signOut()
          localStorage.clear()
          sessionStorage.clear()
          console.log('✅ Session cleared successfully')
        } catch (clearError) {
          console.warn('Error clearing session:', clearError)
        }
        
        // Wait for cleanup and reload
        setTimeout(() => {
          console.log('🔄 Reloading page for clean state...')
          window.location.reload()
        }, 1500)
        return
      }
    } catch (checkError) {
      console.log('Session check failed, continuing with signin:', checkError)
    }

    let timeoutId: NodeJS.Timeout | null = null

    try {
      setLocalLoading(true)
      console.log('🔄 SignIn: Starting signin process...', { email: formData.email })

      // Add a timeout to prevent infinite loading
      timeoutId = setTimeout(() => {
        setLocalLoading(false)
        setError('Request timed out. Please try again.')
      }, 30000) // 30 second timeout

      await signIn(formData.email, formData.password)
      
      if (timeoutId) clearTimeout(timeoutId)
      console.log('✅ SignIn: Signin completed successfully')
      
      setSuccess('Sign in successful! Redirecting...')
      setTimeout(() => {
        navigate(from, { replace: true })
      }, 1000)

    } catch (error: any) {
      console.error('Sign in error:', error)
      
      // Provide more specific error messages
      let errorMessage = 'Failed to sign in'
      
      if (error.message) {
        if (error.message.includes('Invalid login credentials') || error.message.includes('invalid_credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.'
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and confirm your account before signing in.'
        } else if (error.message.includes('Too many requests') || error.message.includes('rate_limit')) {
          errorMessage = 'Too many login attempts. Please wait a few minutes and try again.'
        } else if (error.message.includes('User not found')) {
          errorMessage = 'No account found with this email address. Please sign up first.'
        } else if (error.message.includes('Password')) {
          errorMessage = 'Incorrect password. Please try again.'
        } else if (error.message.includes('Network')) {
          errorMessage = 'Network error. Please check your connection and try again.'
        } else if (error.message.includes('Database')) {
          errorMessage = 'Server issue. Please try again in a moment.'
        } else {
          errorMessage = error.message
        }
      }
      
      setError(errorMessage)
    } finally {
      if (timeoutId) clearTimeout(timeoutId)
      setLocalLoading(false)
      console.log('🏁 SignIn: Process completed, local loading reset')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Emergency Session Clear - Always visible */}
      <div className="fixed top-4 right-4 z-50">
        <button
          type="button"
          onClick={clearSession}
          className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded shadow-lg"
          title="Clear any stuck sessions"
        >
          🚨 Emergency Clear
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Car className="h-12 w-12 text-blue-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-500">
            create a new account
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

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
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
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your password"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                  Forgot your password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || localLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {(loading || localLoading) ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Demo Accounts</span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={() => setFormData({ email: 'customer@demo.com', password: 'demo123' })}
                disabled={loading || localLoading}
                className="w-full text-left px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Customer Demo: customer@demo.com
              </button>
              <button
                type="button"
                onClick={() => setFormData({ email: 'owner@demo.com', password: 'demo123' })}
                disabled={loading || localLoading}
                className="w-full text-left px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Owner Demo: owner@demo.com
              </button>
            </div>
          </div>

          {/* Debug Information */}
          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h4 className="text-sm font-medium text-gray-900 mb-2">🔧 Debug Information</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <p><strong>Supabase URL:</strong> {import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</p>
              <p><strong>Supabase Key:</strong> {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</p>
              <p><strong>Environment:</strong> {import.meta.env.MODE}</p>
              <p><strong>Loading State:</strong> {(loading || localLoading) ? '🔄 Active' : '✅ Ready'}</p>
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-600 mb-2">If you manually deleted a user while logged in:</p>
              <button
                type="button"
                onClick={clearSession}
                className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded"
              >
                🧹 Clear Session & Reload
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignIn