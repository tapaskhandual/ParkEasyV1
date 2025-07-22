import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { testDatabaseConnection, diagnoseAuthIssues } from './lib/supabase'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import SignUp from './pages/SignUp'
import SignIn from './pages/SignIn'
import Dashboard from './pages/Dashboard'
import MapView from './pages/MapView'
import PaymentSuccess from './pages/PaymentSuccess'

function App() {
  // Test database connection and diagnose auth issues on app startup
  React.useEffect(() => {
    const runDiagnostics = async () => {
      try {
        console.log('🔍 Running Supabase diagnostics...')
        
        // Test basic connectivity
        await testDatabaseConnection()
        console.log('✅ Database connectivity check passed')
        
        // Diagnose auth configuration
        const authDiag = await diagnoseAuthIssues()
        console.log('🔧 Auth diagnosis:', authDiag)
        
        if (!authDiag.databaseAccessible) {
          console.error('❌ Database setup issue detected')
          alert(`Database Setup Required!\n\n${authDiag.recommendation}\n\nCheck the console for details.`)
        }
        
      } catch (error) {
        console.error('❌ Supabase setup issue:', error.message)
        
        // Provide specific guidance based on error
        if (error.message.includes('setup-database.sql')) {
          alert('Database Setup Required!\n\n1. Go to your Supabase dashboard\n2. Open SQL Editor\n3. Run the setup-database.sql script\n4. Refresh this page')
        } else if (error.message.includes('VITE_SUPABASE')) {
          alert('Environment Variables Missing!\n\nCheck that your .env file contains:\n- VITE_SUPABASE_URL\n- VITE_SUPABASE_ANON_KEY')
        } else {
          alert('Supabase Connection Issue!\n\nCheck your Supabase project status and credentials.\n\nSee console for details.')
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
