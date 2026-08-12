import { useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../config/api'
import toast from 'react-hot-toast'

export default function UploadPayment() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [receipt, setReceipt] = useState(null)
  const [receiptPreview, setReceiptPreview] = useState(null)
  const [referenceNumber, setReferenceNumber] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB')
        return
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file')
        return
      }
      setReceipt(file)
      const reader = new FileReader()
      reader.onloadend = () => setReceiptPreview(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!receipt) {
      toast.error('Please upload your payment receipt')
      return
    }
    if (!referenceNumber.trim()) {
      toast.error('Please enter the transaction/reference number')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('receipt', receipt)
      formData.append('referenceNumber', referenceNumber)

      await api.post(`/customer/orders/${orderId}/payment`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setSubmitted(true)
      toast.success('Payment submitted successfully!')
    } catch (err) {
      console.error('Payment upload failed:', err)
      toast.error(err.response?.data?.message || 'Failed to submit payment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="page-container animate-fade-in">
        <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="card text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Submitted!</h2>
            <div className="bg-primary-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-primary-800 leading-relaxed">
                Your payment has been submitted successfully. Our administrator will verify your 
                payment before your order is prepared for pickup.
              </p>
            </div>
            <div className="space-y-3">
              <Link to={`/order-status/${orderId}`} className="btn-primary w-full block text-center">
                Track Order Status
              </Link>
              <Link to="/products" className="btn-secondary w-full block text-center">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
          <Link to="/cart" className="hover:text-primary-600 transition-colors">Cart</Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-900 font-medium">Upload Payment</span>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Payment Receipt</h1>
        <p className="text-gray-500 mb-8">Order #{orderId?.slice(-8).toUpperCase()}</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Receipt</h2>

            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                receiptPreview
                  ? 'border-primary-300 bg-primary-50'
                  : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
              }`}
            >
              {receiptPreview ? (
                <div className="space-y-3">
                  <img
                    src={receiptPreview}
                    alt="Payment receipt"
                    className="max-h-48 mx-auto rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setReceipt(null)
                      setReceiptPreview(null)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                    className="text-sm text-red-500 hover:text-red-600 font-medium"
                  >
                    Remove image
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-700">Click to upload receipt image</p>
                  <p className="text-xs text-gray-400">PNG, JPG up to 5MB</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Transaction Details</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction / Reference Number
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="input-field"
                placeholder="Enter your GCash or bank reference number"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                You can find this in your payment confirmation message or app.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Submitting...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Submit Payment
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
