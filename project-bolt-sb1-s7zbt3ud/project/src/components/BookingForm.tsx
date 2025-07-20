import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { dbHelpers } from '../lib/supabase'
import { instamojoService } from '../lib/instamojo'
import { ParkingSpace, BookingFormData } from '../types'
import { Clock, Car, IndianRupee, MapPin, X, Calendar } from 'lucide-react'

interface BookingFormProps {
  parkingSpace: ParkingSpace
  onClose: () => void
  onBookingSuccess?: (bookingId: string) => void
}

const BookingForm: React.FC<BookingFormProps> = ({
  parkingSpace,
  onClose,
  onBookingSuccess
}) => {
  const { user, supabaseUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'details' | 'payment' | 'processing'>('details')
  
  const [formData, setFormData] = useState<BookingFormData>({
    parking_space_id: parkingSpace.id,
    start_time: '',
    end_time: '',
    duration_hours: 1,
    vehicle_number: '',
    vehicle_type: 'car',
    total_amount: parkingSpace.hourly_rate
  })

  const calculateAmounts = () => {
    const amounts = instamojoService.calculateAmounts(formData.total_amount)
    return amounts
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleTimeChange = () => {
    if (formData.start_time && formData.end_time) {
      const start = new Date(formData.start_time)
      const end = new Date(formData.end_time)
      
      if (end > start) {
        const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60))
        const totalAmount = duration * parkingSpace.hourly_rate
        
        setFormData(prev => ({
          ...prev,
          duration_hours: duration,
          total_amount: totalAmount
        }))
      }
    }
  }

  React.useEffect(() => {
    handleTimeChange()
  }, [formData.start_time, formData.end_time])

  const validateForm = () => {
    if (!formData.start_time || !formData.end_time) {
      setError('Please select start and end times')
      return false
    }

    if (!formData.vehicle_number.trim()) {
      setError('Please enter your vehicle number')
      return false
    }

    const start = new Date(formData.start_time)
    const end = new Date(formData.end_time)
    const now = new Date()

    if (start <= now) {
      setError('Start time must be in the future')
      return false
    }

    if (end <= start) {
      setError('End time must be after start time')
      return false
    }

    if (formData.duration_hours < 1) {
      setError('Minimum booking duration is 1 hour')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) return

    if (!user || !supabaseUser) {
      setError('Please sign in to book a parking space')
      return
    }

    setLoading(true)
    
    try {
      // Calculate commission and amounts
      const amounts = calculateAmounts()
      
      // Create booking record
      const bookingData = {
        customer_id: user.id,
        parking_space_id: formData.parking_space_id,
        booking_date: new Date(formData.start_time).toISOString().split('T')[0],
        start_time: formData.start_time,
        end_time: formData.end_time,
        duration_hours: formData.duration_hours,
        total_amount: formData.total_amount,
        admin_commission: amounts.adminCommission,
        owner_amount: amounts.ownerAmount,
        payment_gateway_fee: amounts.paymentGatewayFee,
        vehicle_number: formData.vehicle_number.toUpperCase(),
        vehicle_type: formData.vehicle_type,
        status: 'pending',
        payment_status: 'pending'
      }

      const booking = await dbHelpers.createBooking(bookingData)
      
      // Create payment record
      await dbHelpers.createPayment({
        booking_id: booking.id,
        amount: formData.total_amount,
        status: 'pending'
      })

      setStep('payment')
      
      // Create Instamojo payment request
      const paymentRequest = await instamojoService.createBookingPayment({
        bookingId: booking.id,
        amount: formData.total_amount,
        customerName: user.full_name,
        customerEmail: supabaseUser.email || '',
        customerPhone: user.phone_number || '',
        purpose: `Parking booking at ${parkingSpace.title}`
      })

      // Redirect to payment page
      window.location.href = paymentRequest.longurl
      
    } catch (error: any) {
      console.error('Booking error:', error)
      setError(error.message || 'Failed to create booking. Please try again.')
      setLoading(false)
    }
  }

  const amounts = calculateAmounts()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Book Parking Space</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Parking Space Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900">{parkingSpace.title}</h3>
          <div className="flex items-center text-sm text-gray-600 mt-1">
            <MapPin className="h-4 w-4 mr-1" />
            {parkingSpace.address}
          </div>
          <div className="flex items-center text-sm text-gray-600 mt-1">
            <IndianRupee className="h-4 w-4 mr-1" />
            ₹{parkingSpace.hourly_rate}/hour
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date and Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="datetime-local"
                name="start_time"
                value={formData.start_time}
                onChange={handleInputChange}
                min={new Date().toISOString().slice(0, 16)}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <input
                type="datetime-local"
                name="end_time"
                value={formData.end_time}
                onChange={handleInputChange}
                min={formData.start_time || new Date().toISOString().slice(0, 16)}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Duration Display */}
          {formData.duration_hours > 0 && (
            <div className="bg-blue-50 rounded-md p-3">
              <div className="flex items-center text-sm text-blue-800">
                <Clock className="h-4 w-4 mr-2" />
                Duration: {formData.duration_hours} hour{formData.duration_hours !== 1 ? 's' : ''}
              </div>
            </div>
          )}

          {/* Vehicle Details */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vehicle Type
            </label>
            <select
              name="vehicle_type"
              value={formData.vehicle_type}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="car">Car</option>
              <option value="bike">Bike</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vehicle Number
            </label>
            <input
              type="text"
              name="vehicle_number"
              value={formData.vehicle_number}
              onChange={handleInputChange}
              placeholder="e.g., DL01AB1234"
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Price Breakdown */}
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-3">Price Breakdown</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Parking Fee ({formData.duration_hours}h × ₹{parkingSpace.hourly_rate})</span>
                <span>₹{formData.total_amount}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Platform Fee (5%)</span>
                <span>₹{amounts.adminCommission}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Payment Gateway Fee</span>
                <span>₹{amounts.paymentGatewayFee}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-medium">
                <span>Total Amount</span>
                <span>₹{formData.total_amount}</span>
              </div>
              <div className="text-xs text-gray-500">
                Owner receives: ₹{amounts.ownerAmount}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !user}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Proceed to Payment'}
          </button>
        </form>

        {!user && (
          <p className="text-center text-sm text-gray-500 mt-4">
            Please sign in to book a parking space
          </p>
        )}
      </div>
    </div>
  )
}

export default BookingForm