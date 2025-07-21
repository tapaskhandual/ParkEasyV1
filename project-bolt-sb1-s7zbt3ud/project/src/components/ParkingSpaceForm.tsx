import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { dbHelpers } from '../lib/supabase'
import { MapPin, Upload, X, Plus, Trash2, Car, IndianRupee } from 'lucide-react'

// Define types directly here
interface ParkingSpaceFormData {
  title: string
  description: string
  address: string
  city: string
  state: string
  pincode: string
  latitude: number
  longitude: number
  hourly_rate: number
  total_slots: number
  amenities: string[]
  images: string[]
}

interface ParkingSpaceFormProps {
  onClose: () => void
  onSuccess?: (spaceId: string) => void
  editSpace?: any // For editing existing spaces
}

const AMENITIES_OPTIONS = [
  'CCTV Security',
  'Covered Parking',
  'EV Charging',
  'Car Wash',
  'Valet Service',
  'Security Guard',
  '24/7 Access',
  'Well Lit',
  'Easy Access',
  'Near Metro',
  'Near Mall',
  'Near Hospital'
]

const ParkingSpaceForm: React.FC<ParkingSpaceFormProps> = ({
  onClose,
  onSuccess,
  editSpace
}) => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'details' | 'location' | 'amenities'>('details')
  
  const [formData, setFormData] = useState<ParkingSpaceFormData>({
    title: editSpace?.title || '',
    description: editSpace?.description || '',
    address: editSpace?.address || '',
    city: editSpace?.city || '',
    state: editSpace?.state || '',
    pincode: editSpace?.pincode || '',
    latitude: editSpace?.latitude || 0,
    longitude: editSpace?.longitude || 0,
    hourly_rate: editSpace?.hourly_rate || 0,
    space_type: editSpace?.space_type || 'car',
    total_slots: editSpace?.total_slots || 1,
    amenities: editSpace?.amenities || [],
    images: editSpace?.images || []
  })

  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    editSpace?.amenities || []
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'hourly_rate' || name === 'total_slots' || name === 'latitude' || name === 'longitude' 
        ? parseFloat(value) || 0 
        : value
    }))
  }

  const handleAmenityToggle = (amenity: string) => {
    setSelectedAmenities(prev => {
      const updated = prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
      
      setFormData(prevForm => ({
        ...prevForm,
        amenities: updated
      }))
      
      return updated
    })
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }))
        },
        (error) => {
          console.error('Error getting location:', error)
          setError('Unable to get current location. Please enter coordinates manually.')
        }
      )
    } else {
      setError('Geolocation is not supported by this browser.')
    }
  }

  const geocodeAddress = async () => {
    if (!formData.address || !formData.city) {
      setError('Please enter complete address to get coordinates')
      return
    }

    try {
      const address = `${formData.address}, ${formData.city}, ${formData.state}`
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      )
      const data = await response.json()
      
      if (data && data.length > 0) {
        setFormData(prev => ({
          ...prev,
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon)
        }))
        setError('')
      } else {
        setError('Unable to find coordinates for this address. Please enter manually.')
      }
    } catch (error) {
      setError('Error finding location. Please try again or enter coordinates manually.')
    }
  }

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Title is required')
      return false
    }

    if (!formData.address.trim() || !formData.city.trim() || !formData.state.trim()) {
      setError('Complete address is required')
      return false
    }

    if (formData.hourly_rate <= 0) {
      setError('Hourly rate must be greater than 0')
      return false
    }

    if (formData.total_slots <= 0) {
      setError('Total slots must be greater than 0')
      return false
    }

    if (formData.latitude === 0 || formData.longitude === 0) {
      setError('Location coordinates are required. Please get current location or geocode the address.')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) return

    if (!user) {
      setError('Please sign in to list a parking space')
      return
    }

    setLoading(true)
    
    try {
      const spaceData = {
        ...formData,
        owner_id: user.id,
        available_slots: formData.total_slots,
        is_active: true
      }

      const space = await dbHelpers.createParkingSpace(spaceData)
      
      if (onSuccess) {
        onSuccess(space.id)
      }
      
      onClose()
    } catch (error: any) {
      console.error('Error creating parking space:', error)
      setError(error.message || 'Failed to create parking space. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (step === 'details') {
      if (!formData.title.trim() || !formData.address.trim() || !formData.city.trim()) {
        setError('Please fill in all required fields')
        return
      }
      setStep('location')
    } else if (step === 'location') {
      setStep('amenities')
    }
    setError('')
  }

  const prevStep = () => {
    if (step === 'amenities') setStep('location')
    else if (step === 'location') setStep('details')
    setError('')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {editSpace ? 'Edit Parking Space' : 'List Your Parking Space'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center mb-6">
          <div className={`flex-1 h-2 rounded-l-full ${step === 'details' || step === 'location' || step === 'amenities' ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          <div className={`flex-1 h-2 ${step === 'location' || step === 'amenities' ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          <div className={`flex-1 h-2 rounded-r-full ${step === 'amenities' ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
        </div>

        <div className="flex justify-center mb-6 text-sm text-gray-600">
          <span className={step === 'details' ? 'font-medium text-blue-600' : ''}>Details</span>
          <span className="mx-4">→</span>
          <span className={step === 'location' ? 'font-medium text-blue-600' : ''}>Location</span>
          <span className="mx-4">→</span>
          <span className={step === 'amenities' ? 'font-medium text-blue-600' : ''}>Amenities</span>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Step 1: Basic Details */}
          {step === 'details' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Secure Parking near Metro Station"
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your parking space, accessibility, nearby landmarks..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Space Type *
                  </label>
                  <select
                    name="space_type"
                    value={formData.space_type}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="car">Car Only</option>
                    <option value="bike">Bike Only</option>
                    <option value="both">Both Car & Bike</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Slots *
                  </label>
                  <input
                    type="number"
                    name="total_slots"
                    value={formData.total_slots}
                    onChange={handleInputChange}
                    min="1"
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hourly Rate (₹) *
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    name="hourly_rate"
                    value={formData.hourly_rate}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    required
                    className="w-full pl-10 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Street address"
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {step === 'location' && (
            <div className="space-y-4">
              <div className="text-center">
                <MapPin className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Set Location</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Help customers find your parking space by setting accurate coordinates
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleInputChange}
                    step="any"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleInputChange}
                    step="any"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors"
                >
                  Use Current Location
                </button>
                <button
                  type="button"
                  onClick={geocodeAddress}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md transition-colors"
                >
                  Get from Address
                </button>
              </div>

              {formData.latitude !== 0 && formData.longitude !== 0 && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <p className="text-green-800 text-sm">
                    ✓ Location set: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Amenities */}
          {step === 'amenities' && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <Car className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Select Amenities</h3>
                <p className="text-sm text-gray-600">
                  Choose amenities available at your parking space
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {AMENITIES_OPTIONS.map((amenity) => (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => handleAmenityToggle(amenity)}
                    className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                      selectedAmenities.includes(amenity)
                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {amenity}
                  </button>
                ))}
              </div>

              {selectedAmenities.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-blue-800 text-sm font-medium mb-2">
                    Selected Amenities:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedAmenities.map((amenity) => (
                      <span
                        key={amenity}
                        className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={step === 'details' ? onClose : prevStep}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              {step === 'details' ? 'Cancel' : 'Previous'}
            </button>

            {step !== 'amenities' ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'List Parking Space'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default ParkingSpaceForm