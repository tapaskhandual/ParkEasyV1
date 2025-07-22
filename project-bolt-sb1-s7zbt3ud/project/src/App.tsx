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
      
      const dbTest = await simpleDbTest()
      
      if (dbTest.success) {
        console.log('✅ Database connection successful')
      } else {
        console.error('❌ Database issue detected:', dbTest.message)
        
        // Provide specific guidance based on error code
        if (dbTest.code === 'TABLES_MISSING') {
          alert('Database Setup Required!\n\n1. Go to your Supabase dashboard\n2. Open SQL Editor\n3. Copy and paste the setup-database.sql script\n4. Run the script\n5. Refresh this page\n\nThe database tables are missing.')
        } else if (dbTest.code === 'DB_ERROR') {
          alert('Database Error!\n\nThere\'s an issue with your database configuration.\n\nCheck the console for details and verify your Supabase project status.')
        } else {
          alert('Connection Error!\n\nCannot connect to Supabase.\n\nCheck your environment variables and Supabase project status.')
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
