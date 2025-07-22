import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { supabase } from './lib/supabase'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import SignUp from './pages/SignUp'
import SignIn from './pages/SignIn'
import Dashboard from './pages/Dashboard'
import MapView from './pages/MapView'
import PaymentSuccess from './pages/PaymentSuccess'

function App() {
  // Test database and auth setup on app startup
  React.useEffect(() => {
    const runDiagnostics = async () => {
      console.log('🔍 Running comprehensive Supabase diagnostics...')
      
      // Check environment variables first
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      
      console.log('Environment check:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey,
        urlSample: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'missing'
      })
      
      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('❌ Missing environment variables')
        alert('Environment Variables Missing!\n\nMake sure your .env file contains:\n- VITE_SUPABASE_URL\n- VITE_SUPABASE_ANON_KEY\n\nCheck your Supabase project dashboard for these values.')
        return
      }

      // Check for orphaned sessions on app startup
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          console.log('🔍 Found existing session on startup:', session.user.id)
          
          // Test if user profile exists
          try {
            const { error: profileError } = await supabase
              .from('user_profiles')
              .select('id')
              .eq('id', session.user.id)
              .single()
            
            if (profileError && profileError.code === 'PGRST116') {
              console.log('⚠️ Orphaned session detected - user profile missing. Clearing...')
              await supabase.auth.signOut()
              localStorage.clear()
              sessionStorage.clear()
              console.log('✅ Orphaned session cleared on startup')
            }
          } catch (profileCheckError) {
            console.warn('Profile check failed:', profileCheckError)
          }
        }
      } catch (sessionError) {
        console.warn('Session check failed:', sessionError)
      }
      
      // Quick database check
      try {
        const { error: dbError } = await supabase
          .from('user_profiles')
          .select('id')
          .limit(1)
        
        if (dbError) {
          if (dbError.code === '42P01') {
            console.error('❌ CRITICAL: Database tables missing!')
            alert(`❌ CRITICAL DATABASE ISSUE DETECTED!\n\n` +
                  `The user_profiles table does not exist.\n\n` +
                  `This is why signup fails with "Database error saving new user".\n\n` +
                  `IMMEDIATE FIX REQUIRED:\n` +
                  `1. Go to: https://supabase.com/dashboard/project/qbgjencsmwemxxqhsjlg/sql/new\n` +
                  `2. Copy the COMPLETE database-fix.sql script\n` +
                  `3. Paste and RUN it in SQL Editor\n` +
                  `4. Wait for all queries to complete\n` +
                  `5. Refresh this page\n\n` +
                  `The script will create all required tables and fix auth issues.`)
          } else {
            console.error('❌ Database error:', dbError.message)
          }
        } else {
          console.log('✅ user_profiles table exists - database looks good!')
        }
      } catch (checkError) {
        console.error('❌ Database check failed:', checkError.message)
      }
    }
    
    runDiagnostics()
  }, [])

  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  )
}

export default App;
