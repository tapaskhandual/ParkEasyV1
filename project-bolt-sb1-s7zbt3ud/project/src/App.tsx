import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { checkAuthIssues } from './lib/supabase'
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
      
      // Run comprehensive auth diagnostics
      const authCheck = await checkAuthIssues()
      
      console.log('🔧 Auth diagnostics results:', authCheck)
      
      // Display results
      authCheck.issues.forEach(issue => {
        if (issue.startsWith('✅')) {
          console.log(issue)
        } else {
          console.error(issue)
        }
      })
      
      if (!authCheck.success || authCheck.issues.some(i => i.includes('does not exist'))) {
        console.error('❌ CRITICAL: Database setup issues detected!')
        
        const missingTables = authCheck.issues.filter(i => i.includes('does not exist')).length
        
        alert(`❌ CRITICAL DATABASE ISSUE DETECTED!\n\n` +
              `Missing ${missingTables} required database tables.\n\n` +
              `This is why signup fails with "Database error saving new user".\n\n` +
              `IMMEDIATE FIX REQUIRED:\n` +
              `1. Go to: https://supabase.com/dashboard/project/qbgjencsmwemxxqhsjlg/sql/new\n` +
              `2. Copy the COMPLETE setup-database.sql script\n` +
              `3. Paste and RUN it in SQL Editor\n` +
              `4. Wait for all queries to complete\n` +
              `5. Refresh this page\n\n` +
              `Recommendation: ${authCheck.recommendation}`)
      } else {
        console.log('✅ Basic database structure appears correct')
        console.log('ℹ️ If signup still fails, there may be trigger/constraint issues')
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
