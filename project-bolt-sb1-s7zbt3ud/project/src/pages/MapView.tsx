import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { dbHelpers } from '../lib/supabase'
import Map from '../components/Map'
import BookingForm from '../components/BookingForm'
import { Search, Filter, MapPin } from 'lucide-react'

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
  total_slots: number
  available_slots: number
  amenities?: string[]
  images?: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

interface Location {
  latitude: number
  longitude: number
}

const MapView: React.FC = () => {
  const { user } = useAuth()
  const [parkingSpaces, setParkingSpaces] = useState<ParkingSpace[]>([])
  const [userLocation, setUserLocation] = useState<Location | null>(null)
  const [selectedSpace, setSelectedSpace] = useState<ParkingSpace | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchCity, setSearchCity] = useState('')
  const [filters, setFilters] = useState({
    spaceType: 'all',
    maxPrice: '',
    amenities: [] as string[]
  })
  const [showBookingForm, setShowBookingForm] = useState(false)

  useEffect(() => {
    loadParkingSpaces()
  }, [])

  const loadParkingSpaces = async () => {
    try {
      setLoading(true)
      const spaces = await dbHelpers.getParkingSpaces()
      setParkingSpaces(spaces || [])
    } catch (error) {
      console.error('Error loading parking spaces:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLocationChange = (location: Location) => {
    setUserLocation(location)
  }

  const handleSpaceSelect = (space: ParkingSpace) => {
    setSelectedSpace(space)
    if (user && user.user_type === 'customer') {
      setShowBookingForm(true)
    }
  }

  const handleSearch = async () => {
    if (!searchCity.trim()) {
      loadParkingSpaces()
      return
    }

    try {
      setLoading(true)
      const spaces = await dbHelpers.getParkingSpaces({ city: searchCity.trim() })
      setParkingSpaces(spaces || [])
    } catch (error) {
      console.error('Error searching parking spaces:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSpaces = parkingSpaces.filter(space => {
    if (filters.spaceType !== 'all' && space.space_type !== filters.spaceType) {
      return false
    }
    
    if (filters.maxPrice && space.hourly_rate > parseFloat(filters.maxPrice)) {
      return false
    }

    return true
  })

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <div className="w-1/3 bg-white shadow-lg overflow-y-auto">
        <div className="p-4 border-b">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Find Parking</h1>
          
          {/* Search */}
          <div className="flex gap-2 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by city..."
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </div>

          {/* Filters */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Space Type
              </label>
              <select
                value={filters.spaceType}
                onChange={(e) => setFilters({ ...filters, spaceType: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="car">Car</option>
                <option value="bike">Bike</option>
                <option value="both">Both</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Price (₹/hour)
              </label>
              <input
                type="number"
                placeholder="Any price"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Parking Spaces List */}
        <div className="p-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredSpaces.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No parking spaces found</p>
              <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSpaces.map((space) => (
                <div
                  key={space.id}
                  onClick={() => handleSpaceSelect(space)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedSpace?.id === space.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">{space.title}</h3>
                    <span className="text-lg font-bold text-blue-600">
                      ₹{space.hourly_rate}/hr
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{space.address}</p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 capitalize">{space.space_type}</span>
                    <span className="text-green-600">
                      {space.available_slots} available
                    </span>
                  </div>

                  {space.amenities && space.amenities.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {space.amenities.slice(0, 3).map((amenity, index) => (
                        <span
                          key={index}
                          className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded"
                        >
                          {amenity}
                        </span>
                      ))}
                      {space.amenities.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{space.amenities.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {user && user.user_type === 'customer' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSpaceSelect(space)
                      }}
                      className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-md text-sm font-medium transition-colors"
                    >
                      Book Now
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1">
        <Map
          parkingSpaces={filteredSpaces}
          userLocation={userLocation}
          onLocationChange={handleLocationChange}
          onSpaceSelect={handleSpaceSelect}
          selectedSpace={selectedSpace}
          className="h-full"
        />
      </div>

      {/* Booking Form Modal */}
      {showBookingForm && selectedSpace && (
        <BookingForm
          parkingSpace={selectedSpace}
          onClose={() => {
            setShowBookingForm(false)
            setSelectedSpace(null)
          }}
          onBookingSuccess={(bookingId) => {
            setShowBookingForm(false)
            setSelectedSpace(null)
            // Could add success message here
            alert('Booking created successfully! Redirecting to payment...')
          }}
        />
      )}
    </div>
  )
}

export default MapView