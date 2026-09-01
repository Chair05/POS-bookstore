import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../config/api'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import gcashLogo from '../assets/gcash.png'
import rcbcLogo from '../assets/rcbc.png'
import gcashQr from '../assets/qr.jpg'


const resolveImageSrc = (image) => {
  if (!image) return '/placeholder-book.svg'
  if (image.startsWith('http://') || image.startsWith('https://')) return image
  if (image.startsWith('/uploads')) return image
  return image
}

export default function Checkout() {
  const { cart, selectedItems, selectedTotal, getCartTotal, removeSelectedFromCart } = useCart()
  const checkoutItems = selectedItems.length > 0 ? selectedItems : cart
  const checkoutTotal = selectedItems.length > 0 ? selectedTotal : getCartTotal()
  const { user } = useAuth()
  const navigate = useNavigate()
  const receiptInputRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('GCash')
  const [showGcash, setShowGcash] = useState(false)
  const [gcashReceipt, setGcashReceipt] = useState(null)
  const [gcashReceiptPreview, setGcashReceiptPreview] = useState(null)
  const [gcashSubmitting, setGcashSubmitting] = useState(false)
  const [gcashError, setGcashError] = useState('')
  const [paidOrder, setPaidOrder] = useState(null)
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    contactNumber: user?.contactNumber || '',
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.fullName || !form.email || !form.contactNumber) {
      toast.error('Please fill in all fields')
      return
    }

    if (cart.length === 0 && !paidOrder) {
      toast.error('Your cart is empty')
      return
    }

    setLoading(true)
    try {
      if (paymentMethod === 'GCash') {
        setLoading(false)
        setShowGcash(true)
        return
      }

      const orderData = {
        items: checkoutItems.map((item) => ({
          product: item._id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          selectedSize: item.selectedSize,
        })),
        totalAmount: checkoutTotal,
        paymentMethod,
        customerInfo: {
          fullName: form.fullName,
          email: form.email,
          contactNumber: form.contactNumber,
        },
      }

      const response = await api.post('/customer/orders', orderData)
      const orderId = response.data.order?._id || response.data._id || response.data.orderId

      removeSelectedFromCart()
      toast.success('Order placed successfully!')
      navigate(`/upload-payment/${orderId}`)
    } catch (err) {
      console.error('Order failed:', err)
      toast.error(err.response?.data?.message || 'Failed to place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGcashReceiptChange = (e) => {
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
      setGcashReceipt(file)
      const reader = new FileReader()
      reader.onloadend = () => setGcashReceiptPreview(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const removeGcashReceipt = () => {
    setGcashReceipt(null)
    setGcashReceiptPreview(null)
    if (receiptInputRef.current) receiptInputRef.current.value = ''
  }

  const handleGcashPay = async (e) => {
    e.preventDefault()
    setGcashError('')

    if (!gcashReceipt) {
      setGcashError('Please upload your GCash payment receipt')
      return
    }

    setGcashSubmitting(true)
    try {
      const orderData = {
        items: checkoutItems.map((item) => ({
          product: item._id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          selectedSize: item.selectedSize,
        })),
        totalAmount: checkoutTotal,
        paymentMethod: 'GCash',
        customerInfo: {
          fullName: form.fullName,
          email: form.email,
          contactNumber: form.contactNumber,
        },
      }
      const orderResponse = await api.post('/customer/orders', orderData)
      const orderId = orderResponse.data.order?._id || orderResponse.data._id || orderResponse.data.orderId

      const formData = new FormData()
      formData.append('receipt', gcashReceipt)
      formData.append('paymentMethod', 'GCash')

      await api.post(`/customer/orders/${orderId}/payment`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const paidAmount = checkoutTotal
      removeSelectedFromCart()
      setPaidOrder({ orderId, amount: paidAmount })
    } catch (err) {
      console.error('GCash payment failed:', err)
      setGcashError(err.response?.data?.message || 'Payment failed. Please try again.')
    } finally {
      setGcashSubmitting(false)
    }
  }

  if (checkoutItems.length === 0 && !paidOrder) {
    return (
      <div className="page-container animate-fade-in">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No items to checkout</h2>
          <p className="text-gray-500 mb-4">Select items from your cart to checkout.</p>
          <button onClick={() => navigate('/products')} className="btn-primary">
            Browse Products
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      value={user?.fullName || form.fullName}
                      readOnly
                      disabled
                      className="input-field bg-gray-100 text-gray-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={user?.email || form.email}
                      readOnly
                      disabled
                      className="input-field bg-gray-100 text-gray-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                    <input
                      type="tel"
                      name="contactNumber"
                      value={user?.contactNumber || form.contactNumber}
                      readOnly
                      disabled
                      className="input-field bg-gray-100 text-gray-500 cursor-not-allowed"
                      placeholder="09XX-XXX-XXXX"
                    />
                  </div>
                </div>
              </div>

              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
                <div className="space-y-3">
                  {checkoutItems.map((item) => (
                    <div key={`${item._id}-${item.selectedSize}`} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-12 h-12 bg-white rounded-lg overflow-hidden shrink-0">
                        <img
                          src={resolveImageSrc(item.image)}
                          alt={item.name}
                          className="w-full h-full object-contain p-1"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{item.name}</p>
                        {item.selectedSize && <p className="text-xs text-gray-500">Size: {item.selectedSize}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium text-gray-900">₱{item.price.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('GCash')}
                    className={`border-2 rounded-xl p-6 text-center transition-all ${
                      paymentMethod === 'GCash'
                        ? 'border-primary-500 bg-primary-50 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-primary-200'
                    }`}
                  >
                    <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center mx-auto mb-3 p-2 shadow-sm">
                      <img src={gcashLogo} alt="GCash" className="w-full h-full object-contain" />
                    </div>
                    <h3 className="font-semibold text-gray-900">GCash</h3>
                    <p className="text-sm text-gray-500 mt-1">Pay to 0916-413-8090</p>
                    <span className={`mt-2 inline-flex items-center gap-1 text-xs font-medium ${paymentMethod === 'GCash' ? 'text-primary-600' : 'text-gray-400'}`}>
                      <span className={`w-3 h-3 rounded-full border-2 ${paymentMethod === 'GCash' ? 'border-primary-600 bg-primary-600' : 'border-gray-300'}`}></span>
                      {paymentMethod === 'GCash' ? 'Selected' : 'Select'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('RCBC')}
                    className={`border-2 rounded-xl p-6 text-center transition-all ${
                      paymentMethod === 'RCBC'
                        ? 'border-primary-500 bg-primary-50 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-primary-200'
                    }`}
                  >
                    <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center mx-auto mb-3 p-2 shadow-sm">
                      <img src={rcbcLogo} alt="RCBC" className="w-full h-full object-contain" />
                    </div>
                    <h3 className="font-semibold text-gray-900">RCBC Bank Transfer</h3>
                    <p className="text-sm text-gray-500 mt-1">Transfer to our RCBC account</p>
                    <span className={`mt-2 inline-flex items-center gap-1 text-xs font-medium ${paymentMethod === 'RCBC' ? 'text-primary-600' : 'text-gray-400'}`}>
                      <span className={`w-3 h-3 rounded-full border-2 ${paymentMethod === 'RCBC' ? 'border-primary-600 bg-primary-600' : 'border-gray-300'}`}></span>
                      {paymentMethod === 'RCBC' ? 'Selected' : 'Select'}
                    </span>
                  </button>
                </div>

                </div>
            </div>

            <div className="lg:col-span-1">
              <div className="card sticky top-24">
                <h3 className="font-semibold text-gray-900 mb-4 pb-4 border-b border-gray-100">Order Summary</h3>
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-medium">₱{checkoutTotal.toLocaleString()}</span>
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-4 mb-6">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="font-bold text-xl text-primary-600">₱{checkoutTotal.toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg mb-4">
                  <div className="flex items-start space-x-2">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-blue-700">
                      {paymentMethod === 'GCash'
                        ? 'After placing your order, you will upload your GCash receipt. Your order will be prepared after payment verification.'
                        : "After placing your order, you'll be directed to upload your payment receipt. Your order will be prepared only after payment verification."}
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
                      Placing Order...
                    </>
                  ) : (
                    <>
                      {paymentMethod === 'GCash' ? 'Pay with GCash — ₱' : 'Place Order — ₱'}{checkoutTotal.toLocaleString()}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {showGcash && !paidOrder && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto bg-black/50" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md my-auto overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-blue-600 px-6 py-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-lg p-1.5">
                <img src={gcashLogo} alt="GCash" className="w-full h-full object-contain" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">GCash Secure Checkout</h2>
                <p className="text-blue-100 text-xs">LCCB Bookstore</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowGcash(false)
                  removeGcashReceipt()
                  setGcashError('')
                }}
                aria-label="Back to checkout"
                className="ml-auto w-9 h-9 flex items-center justify-center rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleGcashPay} className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                <span className="text-sm text-gray-600">Amount to pay</span>
                <span className="text-2xl font-bold text-gray-900">₱{checkoutTotal.toLocaleString()}</span>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-center">
                <p className="text-xs text-blue-700 mb-2 font-medium">Scan this QR code with GCash to pay</p>
                <div className="w-48 h-48 mx-auto bg-white rounded-lg border border-blue-200 flex items-center justify-center overflow-hidden">
                  <img
                    src={gcashQr}
                    alt="GCash QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-xs text-blue-700 mt-2">Account: 0916-413-8090 (LCCB Bookstore)</p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Payment Receipt</label>
                <div
                  onClick={() => receiptInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                    gcashReceiptPreview
                      ? 'border-primary-300 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                  }`}
                >
                  {gcashReceiptPreview ? (
                    <div className="space-y-2">
                      <img
                        src={gcashReceiptPreview}
                        alt="Payment receipt"
                        className="max-h-32 mx-auto rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeGcashReceipt()
                        }}
                        className="text-sm text-red-500 hover:text-red-600 font-medium"
                      >
                        Remove image
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-gray-700">Tap to upload receipt</p>
                      <p className="text-xs text-gray-400">PNG, JPG up to 5MB</p>
                    </div>
                  )}
                </div>
                <input
                  ref={receiptInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleGcashReceiptChange}
                  className="hidden"
                />
              </div>

              {gcashError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <p className="text-sm text-red-600">{gcashError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={gcashSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
              >
                {gcashSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processing Payment...
                  </>
                ) : (
                  <>
                    Submit Payment — ₱{checkoutTotal.toLocaleString()}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowGcash(false)
                  removeGcashReceipt()
                  setGcashError('')
                }}
                className="w-full text-sm text-gray-500 hover:text-gray-700 py-2"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      {paidOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Submitted!</h2>
            <p className="text-gray-500 mb-4">
              Your GCash payment receipt for ₱{paidOrder.amount.toLocaleString()} has been submitted.
              Our administrator will verify your payment before your order is prepared for pickup.
            </p>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-center gap-2 mb-1">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-sm font-bold text-blue-800">Pickup Location</p>
              </div>
              <p className="text-sm font-semibold text-blue-900">LCCB Bookstore</p>
              <p className="text-xs text-blue-600 mt-0.5">Bring your pickup code when you claim your order</p>
            </div>
            <div className="bg-primary-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-primary-800 leading-relaxed">
                You will receive a pickup code once your payment is verified. You can track your order status in the meantime.
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => navigate(`/order-status/${paidOrder.orderId}`)}
                className="btn-primary w-full"
              >
                Track Order Status
              </button>
              <button
                onClick={() => navigate('/products')}
                className="btn-secondary w-full"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
