import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { simpleDbTest } from './lib/supabase'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import SignUp from './pages/SignUp'
import SignIn from './pages/SignIn'
import Dashboard from './pages/Dashboard'
import MapView from './pages/MapView'
import PaymentSuccess from './pages/PaymentSuccess'

function App() {
  // Test database connection on app startup
  React.useEffect(() => {
    const runDiagnostics = async () => {
      console.log('🔍 Testing Supabase database connection...')
      
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
      
      const dbTest = await simpleDbTest()
      
      if (dbTest.success) {
        console.log('✅ Database connection successful')
      } else {
        console.error('❌ Database issue detected:', dbTest.message)
        
        // Provide specific guidance based on error code
        if (dbTest.code === 'TABLES_MISSING') {
          console.error('Database tables are missing!')
          alert('❌ CRITICAL: Database Setup Required!\n\n' +
                'Your Supabase database is missing the required tables.\n\n' +
                'STEPS TO FIX:\n' +
                '1. Go to your Supabase dashboard\n' +
                '2. Navigate to SQL Editor\n' +
                '3. Create a new query\n' +
                '4. Copy the ENTIRE setup-database.sql content\n' +
                '5. Paste and RUN the script\n' +
                '6. Refresh this page\n\n' +
                'Without these tables, user signup will fail.')
        } else if (dbTest.code === 'DB_ERROR') {
          alert('❌ Database Configuration Error!\n\n' +
                'There\'s an issue with your Supabase database.\n\n' +
                'POSSIBLE CAUSES:\n' +
                '- RLS policies not set correctly\n' +
                '- Database permissions issues\n' +
                '- Corrupted database schema\n\n' +
                'Check the console for detailed error messages.')
        } else {
          alert('❌ Connection Error!\n\n' +
                'Cannot connect to your Supabase project.\n\n' +
                'POSSIBLE CAUSES:\n' +
                '- Wrong Supabase URL/Key\n' +
                '- Project is paused or deleted\n' +
                '- Network connectivity issues\n\n' +
                'Verify your Supabase project status.')
        }
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
