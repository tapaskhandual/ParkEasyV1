import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { dbHelpers } from '../lib/supabase'
import ParkingSpaceForm from '../components/ParkingSpaceForm'
import { Car, MapPin, Calendar, IndianRupee, Users, TrendingUp, Plus } from 'lucide-react'

// Define types directly here
interface ParkingSpace {
  id: string
  owner_id: string
  title: string
  description?: string
  address: string
  city: string
  state: string
  pincode: string
  latitude: number
  longitude: number
  hourly_rate: number
  space_type?: string
  total_slots: number
  available_slots: number
  amenities?: string[]
  images?: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

interface Booking {
  id: string
  customer_id: string
  parking_space_id: string
  start_time: string
  end_time: string
  vehicle_number: string
  vehicle_type: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  payment_status?: 'pending' | 'paid' | 'failed'
  total_amount: number
  platform_fee: number
  owner_amount: number
  special_requests?: string
  created_at: string
  updated_at: string
  parking_space?: {
    title: string
    address: string
    city: string
  }
}

const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const [parkingSpaces, setParkingSpaces] = useState<ParkingSpace[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalSpaces: 0,
    totalBookings: 0,
    totalRevenue: 0,
    activeBookings: 0
  })
  const [showAddSpaceForm, setShowAddSpaceForm] = useState(false)

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    if (!user) return

    try {
      setLoading(true)

      if (user.user_type === 'owner') {
        // Load owner's parking spaces and bookings
        const [spacesData, bookingsData] = await Promise.all([
          dbHelpers.getOwnerParkingSpaces(user.id),
          dbHelpers.getOwnerBookings(user.id)
        ])

        setParkingSpaces(spacesData || [])
        setBookings(bookingsData || [])

        // Calculate stats
        const totalRevenue = bookingsData?.reduce((sum, booking) => 
          sum + (booking.payment_status === 'paid' ? booking.owner_amount : 0), 0) || 0
        const activeBookings = bookingsData?.filter(booking => 
          booking.status === 'confirmed' || booking.status === 'pending').length || 0

        setStats({
          totalSpaces: spacesData?.length || 0,
          totalBookings: bookingsData?.length || 0,
          totalRevenue,
          activeBookings
        })
      } else {
        // Load customer's bookings
        const bookingsData = await dbHelpers.getUserBookings(user.id)
        setBookings(bookingsData || [])

        const totalSpent = bookingsData?.reduce((sum, booking) => 
          sum + (booking.payment_status === 'paid' ? booking.total_amount : 0), 0) || 0
        const activeBookings = bookingsData?.filter(booking => 
          booking.status === 'confirmed' || booking.status === 'pending').length || 0

        setStats({
          totalSpaces: 0,
          totalBookings: bookingsData?.length || 0,
          totalRevenue: totalSpent,
          activeBookings
        })
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSpaceAdded = () => {
    // Refresh dashboard data after adding a new space
    loadDashboardData()
    setShowAddSpaceForm(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.full_name}!
        </h1>
        <p className="text-gray-600 mt-2">
          {user?.user_type === 'owner' 
            ? 'Manage your parking spaces and track your earnings'
            : 'View your bookings and find new parking spots'
          }
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {user?.user_type === 'owner' ? (
          <>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Car className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Spaces</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalSpaces}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <IndianRupee className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                  <p className="text-2xl font-bold text-gray-900">₹{stats.totalRevenue.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeBookings}</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <IndianRupee className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-900">₹{stats.totalRevenue.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeBookings}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <MapPin className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Cities Visited</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {new Set(bookings.map(b => b.parking_space?.city).filter(Boolean)).size}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Bookings */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Recent Bookings</h2>
          </div>
          <div className="p-6">
            {bookings.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No bookings yet</p>
            ) : (
              <div className="space-y-4">
                {bookings.slice(0, 5).map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        {booking.parking_space?.title || 'Parking Space'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {booking.parking_space?.address}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(booking.start_time).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">₹{booking.total_amount}</p>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          {/* Parking Spaces (for owners) or Quick Actions (for customers) */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  {user?.user_type === 'owner' ? 'Your Parking Spaces' : 'Quick Actions'}
                </h2>
                {user?.user_type === 'owner' && (
                  <button
                    onClick={() => setShowAddSpaceForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Space
                  </button>
                )}
              </div>
            </div>
            <div className="p-6">
              {user?.user_type === 'owner' ? (
                parkingSpaces.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No parking spaces listed yet</p>
                ) : (
                  <div className="space-y-4">
                    {parkingSpaces.slice(0, 5).map((space) => (
                      <div key={space.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{space.title}</p>
                          <p className="text-sm text-gray-600">{space.address}</p>
                          <p className="text-xs text-gray-500">
                            {space.available_slots}/{space.total_slots} available
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">₹{space.hourly_rate}/hr</p>
                          <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                            space.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {space.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div className="space-y-4">
                  <a
                    href="/map"
                    className="block p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <div className="flex items-center">
                      <MapPin className="h-6 w-6 text-blue-600 mr-3" />
                      <div>
                        <p className="font-medium text-blue-900">Find Parking</p>
                        <p className="text-sm text-blue-600">Search for available parking spaces</p>
                      </div>
                    </div>
                  </a>
                  
                  <a
                    href="/bookings"
                    className="block p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <div className="flex items-center">
                      <Calendar className="h-6 w-6 text-green-600 mr-3" />
                      <div>
                        <p className="font-medium text-green-900">My Bookings</p>
                        <p className="text-sm text-green-600">View and manage your bookings</p>
                      </div>
                    </div>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add Parking Space Form Modal */}
        {showAddSpaceForm && (
          <ParkingSpaceForm
            onClose={() => setShowAddSpaceForm(false)}
            onSuccess={handleSpaceAdded}
          />
        )}
      </div>
    )
  }

  export default Dashboard