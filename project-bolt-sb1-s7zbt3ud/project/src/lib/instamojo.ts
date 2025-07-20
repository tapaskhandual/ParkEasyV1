const INSTAMOJO_API_KEY = import.meta.env.VITE_INSTAMOJO_API_KEY
const INSTAMOJO_AUTH_TOKEN = import.meta.env.VITE_INSTAMOJO_AUTH_TOKEN
const INSTAMOJO_ENDPOINT = import.meta.env.VITE_INSTAMOJO_ENDPOINT || 'https://test.instamojo.com/api/1.1/'

interface PaymentRequestData {
  purpose: string
  amount: number
  buyer_name: string
  email: string
  phone: string
  redirect_url: string
  webhook_url?: string
  allow_repeated_payments?: boolean
}

interface PaymentRequest {
  id: string
  longurl: string
  shorturl: string
  status: string
  purpose: string
  amount: string
}

interface PaymentDetails {
  payment_id: string
  payment_request_id: string
  status: string
  amount: string
  buyer_name: string
  buyer_email: string
  buyer_phone: string
  currency: string
  fees: string
  mac: string
  payment_date: string
  shorturl: string
  longurl: string
}

class InstamojoService {
  private apiKey: string
  private authToken: string
  private baseUrl: string

  constructor() {
    this.apiKey = INSTAMOJO_API_KEY
    this.authToken = INSTAMOJO_AUTH_TOKEN
    this.baseUrl = INSTAMOJO_ENDPOINT

    if (!this.apiKey || !this.authToken) {
      throw new Error('Instamojo API credentials are required')
    }
  }

  private getHeaders() {
    return {
      'X-Api-Key': this.apiKey,
      'X-Auth-Token': this.authToken,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }

  async createPaymentRequest(data: PaymentRequestData): Promise<PaymentRequest> {
    try {
      const formData = new URLSearchParams()
      formData.append('purpose', data.purpose)
      formData.append('amount', data.amount.toString())
      formData.append('buyer_name', data.buyer_name)
      formData.append('email', data.email)
      formData.append('phone', data.phone)
      formData.append('redirect_url', data.redirect_url)
      
      if (data.webhook_url) {
        formData.append('webhook_url', data.webhook_url)
      }
      
      if (data.allow_repeated_payments) {
        formData.append('allow_repeated_payments', 'true')
      }

      const response = await fetch(`${this.baseUrl}payment-requests/`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create payment request')
      }

      if (!result.success) {
        throw new Error(result.message || 'Payment request creation failed')
      }

      return result.payment_request
    } catch (error) {
      console.error('Error creating payment request:', error)
      throw error
    }
  }

  async getPaymentDetails(paymentRequestId: string, paymentId: string): Promise<PaymentDetails> {
    try {
      const response = await fetch(
        `${this.baseUrl}payment-requests/${paymentRequestId}/${paymentId}/`,
        {
          method: 'GET',
          headers: this.getHeaders()
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to get payment details')
      }

      if (!result.success) {
        throw new Error(result.message || 'Failed to retrieve payment details')
      }

      return result.payment_request
    } catch (error) {
      console.error('Error getting payment details:', error)
      throw error
    }
  }

  async getAllPayments() {
    try {
      const response = await fetch(`${this.baseUrl}payments/`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to get payments')
      }

      return result.payments || []
    } catch (error) {
      console.error('Error getting payments:', error)
      throw error
    }
  }

  async refundPayment(paymentId: string, amount: number, reason: string) {
    try {
      const formData = new URLSearchParams()
      formData.append('payment_id', paymentId)
      formData.append('type', 'RFD') // Refund type
      formData.append('body', reason)
      formData.append('refund_amount', amount.toString())

      const response = await fetch(`${this.baseUrl}refunds/`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to process refund')
      }

      if (!result.success) {
        throw new Error(result.message || 'Refund processing failed')
      }

      return result.refund
    } catch (error) {
      console.error('Error processing refund:', error)
      throw error
    }
  }

  // Calculate commission and amounts
  calculateAmounts(totalAmount: number, commissionRate: number = 0.05) {
    const instamojoFee = totalAmount * 0.029 + 3 // 2.9% + ₹3 (approximate)
    const adminCommission = totalAmount * commissionRate
    const ownerAmount = totalAmount - adminCommission - instamojoFee

    return {
      totalAmount,
      adminCommission: Math.round(adminCommission * 100) / 100,
      ownerAmount: Math.round(ownerAmount * 100) / 100,
      paymentGatewayFee: Math.round(instamojoFee * 100) / 100
    }
  }

  // Generate payment URL for booking
  async createBookingPayment(bookingData: {
    bookingId: string
    amount: number
    customerName: string
    customerEmail: string
    customerPhone: string
    purpose: string
  }) {
    const redirectUrl = `${window.location.origin}/payment-success?booking_id=${bookingData.bookingId}`
    const webhookUrl = `${window.location.origin}/api/payment-webhook`

    return await this.createPaymentRequest({
      purpose: bookingData.purpose,
      amount: bookingData.amount,
      buyer_name: bookingData.customerName,
      email: bookingData.customerEmail,
      phone: bookingData.customerPhone,
      redirect_url: redirectUrl,
      webhook_url: webhookUrl,
      allow_repeated_payments: false
    })
  }
}

export const instamojoService = new InstamojoService()
export default instamojoService