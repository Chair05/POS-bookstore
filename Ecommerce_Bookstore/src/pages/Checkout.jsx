import { useState } from 'react'
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
  const { cart, getCartTotal, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('GCash')
  const [showGcash, setShowGcash] = useState(false)
  const [gcashLoading, setGcashLoading] = useState(false)
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
        items: cart.map((item) => ({
          product: item._id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          selectedSize: item.selectedSize,
        })),
        totalAmount: getCartTotal(),
        paymentMethod,
        customerInfo: {
          fullName: form.fullName,
          email: form.email,
          contactNumber: form.contactNumber,
        },
      }

      const response = await api.post('/customer/orders', orderData)
      const orderId = response.data.order?._id || response.data._id || response.data.orderId

      clearCart()
      toast.success('Order placed successfully!')
      navigate(`/upload-payment/${orderId}`)
    } catch (err) {
      console.error('Order failed:', err)
      toast.error(err.response?.data?.message || 'Failed to place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGcashPay = async (e) => {
    e.preventDefault()
    setGcashError('')

    setGcashLoading(true)
    try {
      const orderData = {
        items: cart.map((item) => ({
          product: item._id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          selectedSize: item.selectedSize,
        })),
        totalAmount: getCartTotal(),
        paymentMethod,
        customerInfo: {
          fullName: form.fullName,
          email: form.email,
          contactNumber: form.contactNumber,
        },
      }
      const response = await api.post('/customer/orders', orderData)
      const orderId = response.data.order?._id || response.data._id || response.data.orderId

      const payRes = await api.post(`/customer/orders/${orderId}/gcash-pay`)
      const paidAmount = getCartTotal()
      clearCart()
      setPaidOrder({ orderId, pickupCode: payRes.data.pickupCode, amount: paidAmount })
    } catch (err) {
      console.error('GCash payment failed:', err)
      setGcashError(err.response?.data?.message || 'Payment failed. Please try again.')
    } finally {
      setGcashLoading(false)
    }
  }

  if (cart.length === 0) {
    return (
      <div className="page-container animate-fade-in">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No items to checkout</h2>
          <p className="text-gray-500 mb-4">Add some products to your cart first.</p>
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
                      value={form.fullName}
                      onChange={handleChange}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                    <input
                      type="tel"
                      name="contactNumber"
                      value={form.contactNumber}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="09XX-XXX-XXXX"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
                <div className="space-y-3">
                  {cart.map((item) => (
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

                {paymentMethod === 'GCash' ? (
                  <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-2">GCash Payment</h4>
                    <p className="text-sm text-blue-700 mb-4">
                      Scan the QR code or send the exact amount to <b>0916-413-8090</b> (LCCB Bookstore) using the
                      GCash app. After paying, upload your receipt to complete the order.
                    </p>
                    <img
                      src={gcashQr}
                      alt="GCash QR Code"
                      className="w-48 h-48 mx-auto rounded-lg border border-blue-200 bg-white object-contain shadow-sm"
                    />
                  </div>
                ) : (
                  <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <h4 className="font-medium text-amber-800 mb-2">Payment Instructions</h4>
                    <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
                      <li>Transfer the exact amount to the RCBC account below</li>
                      <li>Take a screenshot or photo of your payment confirmation</li>
                      <li>You will be redirected to upload your receipt after placing the order</li>
                      <li>Wait for our administrator to verify your payment</li>
                    </ol>
                  </div>
                )}

                <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                  <h4 className="font-medium text-gray-800 mb-2">GCash Details</h4>
                  <p className="text-sm text-gray-600">Account Name: LCCB Bookstore</p>
                  <p className="text-sm text-gray-600">Mobile Number: 0916-413-8090</p>
                  <h4 className="font-medium text-gray-800 mt-3 mb-2">RCBC Bank Account</h4>
                  <p className="text-sm text-gray-600">Account Name: La Consolacion College Bacolod</p>
                  <p className="text-sm text-gray-600">Account Number: XXXX-XXXX-XXXX</p>
                  <p className="text-sm text-gray-600">Bank: RCBC (Rizal Commercial Banking Corp)</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="card sticky top-24">
                <h3 className="font-semibold text-gray-900 mb-4 pb-4 border-b border-gray-100">Order Summary</h3>
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-medium">₱{getCartTotal().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Shipping</span>
                    <span className="font-medium text-green-600">Free (Pickup)</span>
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-4 mb-6">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="font-bold text-xl text-primary-600">₱{getCartTotal().toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg mb-4">
                  <div className="flex items-start space-x-2">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-blue-700">
                      {paymentMethod === 'GCash'
                        ? 'After placing your order, you will complete payment in the GCash window. Your order is verified instantly and a pickup code is issued.'
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
                      {paymentMethod === 'GCash' ? 'Pay with GCash — ₱' : 'Place Order — ₱'}{getCartTotal().toLocaleString()}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {showGcash && !paidOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-blue-600 px-6 py-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-lg p-1.5">
                <img src={gcashLogo} alt="GCash" className="w-full h-full object-contain" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">GCash Secure Checkout</h2>
                <p className="text-blue-100 text-xs">LCCB Bookstore</p>
              </div>
            </div>

            <form onSubmit={handleGcashPay} className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                <span className="text-sm text-gray-600">Amount to pay</span>
                <span className="text-2xl font-bold text-gray-900">₱{getCartTotal().toLocaleString()}</span>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-center">
                <img
                  src={gcashQr}
                  alt="GCash QR Code"
                  className="w-40 h-40 mx-auto rounded-lg bg-white object-contain border border-blue-100"
                />
                <p className="text-xs text-blue-700 mt-2">Scan this QR code with GCash to pay</p>
                <p className="text-xs text-blue-700">Account: 0916-413-8090 (LCCB Bookstore)</p>
              </div>

              {gcashError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <p className="text-sm text-red-600">{gcashError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={gcashLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
              >
                {gcashLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processing Payment...
                  </>
                ) : (
                  <>
                    Pay ₱{getCartTotal().toLocaleString()}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowGcash(false)}
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-500 mb-4">Your GCash payment of ₱{paidOrder.amount.toLocaleString()} was received.</p>
            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">Your Pickup Code</p>
              <p className="text-3xl font-bold text-blue-700 tracking-widest">{paidOrder.pickupCode}</p>
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
