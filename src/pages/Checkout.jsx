import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../config/api'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Checkout() {
  const { cart, getCartTotal, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
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

    if (cart.length === 0) {
      toast.error('Your cart is empty')
      return
    }

    setLoading(true)
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
        customerInfo: {
          fullName: form.fullName,
          email: form.email,
          contactNumber: form.contactNumber,
        },
      }

      const response = await api.post('/orders', orderData)
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
                          src={item.image || '/placeholder-book.png'}
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
                  <div className="border-2 border-primary-200 bg-primary-50 rounded-xl p-6 text-center">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">📱</span>
                    </div>
                    <h3 className="font-semibold text-gray-900">GCash</h3>
                    <p className="text-sm text-gray-500 mt-1">Scan QR or send to our GCash account</p>
                  </div>
                  <div className="border-2 border-primary-200 bg-primary-50 rounded-xl p-6 text-center">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">🏦</span>
                    </div>
                    <h3 className="font-semibold text-gray-900">RCBC Bank Transfer</h3>
                    <p className="text-sm text-gray-500 mt-1">Transfer to our RCBC account</p>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <h4 className="font-medium text-amber-800 mb-2">Payment Instructions</h4>
                  <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
                    <li>Send the exact amount to the payment method above</li>
                    <li>Take a screenshot or photo of your payment confirmation</li>
                    <li>You will be redirected to upload your receipt after placing the order</li>
                    <li>Wait for our administrator to verify your payment</li>
                  </ol>
                </div>

                <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                  <h4 className="font-medium text-gray-800 mb-2">GCash Details</h4>
                  <p className="text-sm text-gray-600">Account Name: LCCB Bookstore</p>
                  <p className="text-sm text-gray-600">Mobile Number: 09XX-XXX-XXXX</p>
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
                      After placing your order, you'll be directed to upload your payment receipt. 
                      Your order will be prepared only after payment verification.
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
                      Place Order — ₱{getCartTotal().toLocaleString()}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
