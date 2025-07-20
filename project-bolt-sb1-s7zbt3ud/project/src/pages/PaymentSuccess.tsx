import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { dbHelpers } from '../lib/supabase'
import { instamojoService } from '../lib/instamojo'
import { CheckCircle, XCircle, Clock } from 'lucide-react'

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const [status, setStatus] = useState<'processing' | 'success' | 'failed'>('processing')
  const [message, setMessage] = useState('Processing your payment...')
  const [bookingDetails, setBookingDetails] = useState<any>(null)

  useEffect(() => {
    const processPayment = async () => {
      try {
        const paymentId = searchParams.get('payment_id')
        const paymentRequestId = searchParams.get('payment_request_id')
        const bookingId = searchParams.get('booking_id')

        if (!paymentId || !paymentRequestId || !bookingId) {
          throw new Error('Missing payment parameters')
        }

        // Get payment details from Instamojo
        const paymentDetails = await instamojoService.getPaymentDetails(paymentRequestId, paymentId)
        
        if (paymentDetails.status === 'Credit') {
          // Payment successful - update booking and payment records
          
          // Update payment record
          const payments = await dbHelpers.getPaymentsByBookingId(bookingId)
          if (payments.length > 0) {
            await dbHelpers.updatePayment(payments[0].id, {
              payment_id: paymentId,
              payment_request_id: paymentRequestId,
              status: 'success',
              payment_method: 'instamojo',
              gateway_response: paymentDetails
            })
          }

          // Update booking status
          await dbHelpers.updateBooking(bookingId, {
            status: 'confirmed',
            payment_status: 'paid'
          })

          // Get booking details to show to user
          const booking = await dbHelpers.getBookingById(bookingId)
          setBookingDetails(booking)

          setStatus('success')
          setMessage('Payment successful! Your parking space has been booked.')
        } else {
          // Payment failed
          await dbHelpers.updatePayment(payments[0].id, {
            payment_id: paymentId,
            payment_request_id: paymentRequestId,
            status: 'failed',
            gateway_response: paymentDetails
          })

          setStatus('failed')
          setMessage('Payment failed. Please try again.')
        }
      } catch (error) {
        console.error('Payment processing error:', error)
        setStatus('failed')
        setMessage('Error processing payment. Please contact support.')
      }
    }

    processPayment()
  }, [searchParams])

  const handleContinue = () => {
    if (status === 'success') {
      navigate('/dashboard')
    } else {
      navigate('/map')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === 'processing' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing Payment</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            
            {bookingDetails && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-medium text-green-900 mb-2">Booking Details:</h3>
                <div className="text-sm text-green-800 space-y-1">
                  <p><strong>Booking ID:</strong> {bookingDetails.id.slice(0, 8)}...</p>
                  <p><strong>Amount:</strong> ₹{bookingDetails.total_amount}</p>
                  <p><strong>Vehicle:</strong> {bookingDetails.vehicle_number}</p>
                  <p><strong>Duration:</strong> {bookingDetails.duration_hours} hours</p>
                  <p><strong>Start:</strong> {new Date(bookingDetails.start_time).toLocaleString()}</p>
                  <p><strong>End:</strong> {new Date(bookingDetails.end_time).toLocaleString()}</p>
                </div>
              </div>
            )}

            <button
              onClick={handleContinue}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md font-medium transition-colors"
            >
              Go to Dashboard
            </button>
          </>
        )}

        {status === 'failed' && (
          <>
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Failed</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            
            <div className="space-y-3">
              <button
                onClick={handleContinue}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md font-medium transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-md font-medium transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default PaymentSuccess