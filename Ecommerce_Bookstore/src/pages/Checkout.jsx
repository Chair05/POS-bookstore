import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api, { formatCurrency, resolveImageUrl } from '../config/api'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import gcashLogo from '../assets/gcash.png'
import gcashQr from '../assets/qr.jpg'

const gcashPaymentLink = import.meta.env.VITE_GCASH_PAYMENT_LINK?.trim()
const GCASH_ACCOUNT_NUMBER = '0916-413-8090'

const CUSTOMER_FIELDS = [
  { key: 'fullName', label: 'Full Name', type: 'text' },
  { key: 'email', label: 'Email Address', type: 'email' },
  { key: 'contactNumber', label: 'Contact Number', type: 'tel', placeholder: '09XX-XXX-XXXX' },
]

export default function Checkout() {
  const { cart, selectedItems, selectedTotal, getCartTotal, removeSelectedFromCart } = useCart()
  const checkoutItems = selectedItems.length > 0 ? selectedItems : cart
  const checkoutTotal = selectedItems.length > 0 ? selectedTotal : getCartTotal()
  const { user } = useAuth()
  const navigate = useNavigate()
  const receiptInputRef = useRef(null)
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

  const handleCopyGcashNumber = async () => {
    try {
      await navigator.clipboard.writeText(GCASH_ACCOUNT_NUMBER.replace(/-/g, ''))
      toast.success('GCash number copied')
    } catch {
      toast.error('Could not copy automatically')
    }
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

    setShowGcash(true)
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
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="card text-center py-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">No items to checkout</h2>
            <p className="text-sm text-slate-500 mb-6">Select items from your cart before proceeding to checkout.</p>
            <button type="button" onClick={() => navigate('/products')} className="btn-primary">
              Browse Catalog
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 mb-1">
            Campus Pre-Order
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Checkout</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 items-start">
            <div className="lg:col-span-2 space-y-5">
              <div className="card">
                <div className="flex items-center gap-3 mb-5">
                  <span className="w-7 h-7 rounded-lg bg-primary-600 text-white text-xs font-bold flex items-center justify-center">
                    1
                  </span>
                  <h2 className="text-lg font-bold text-slate-900">Customer Information</h2>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {CUSTOMER_FIELDS.map(({ key, label, type, placeholder }) => {
                    const locked = Boolean(user?.[key])
                    const value = user?.[key] || form[key] || ''

                    return (
                      <div key={key} className={key === 'fullName' ? 'sm:col-span-2' : ''}>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                          {label}
                        </label>
                        <input
                          type={type}
                          name={key}
                          value={value}
                          onChange={handleChange}
                          readOnly={locked}
                          disabled={locked}
                          placeholder={placeholder}
                          className={
                            locked
                              ? 'input-field bg-slate-100 text-slate-500 cursor-not-allowed'
                              : 'input-field'
                          }
                        />
                      </div>
                    )
                  })}
                </div>
                {CUSTOMER_FIELDS.some(({ key }) => !user?.[key]) && (
                  <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5">
                    Some details are missing from your profile. Fill them in here or update your{' '}
                    <Link to="/profile" className="underline font-semibold">
                      profile
                    </Link>{' '}
                    before placing your order.
                  </p>
                )}
              </div>

              <div className="card">
                <div className="flex items-center gap-3 mb-5">
                  <span className="w-7 h-7 rounded-lg bg-primary-600 text-white text-xs font-bold flex items-center justify-center">
                    2
                  </span>
                  <h2 className="text-lg font-bold text-slate-900">
                    Order Items ({checkoutItems.length})
                  </h2>
                </div>
                <div className="space-y-3">
                  {checkoutItems.map((item) => (
                    <div
                      key={`${item._id}-${item.selectedSize}`}
                      className="flex items-center gap-3.5 p-3 bg-slate-50/80 border border-slate-100 rounded-xl"
                    >
                      <div className="w-12 h-12 bg-white border border-slate-200/60 rounded-lg overflow-hidden shrink-0 flex items-center justify-center p-1">
                        <img
                          src={resolveImageUrl(item.image)}
                          alt={item.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.target.src = '/placeholder-book.svg'
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">{item.name}</p>
                        <p className="text-xs text-slate-500">
                          {item.selectedSize ? `Size: ${item.selectedSize} · ` : ''}
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-slate-900 tabular-nums">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                        <p className="text-[11px] text-slate-400 tabular-nums">
                          {formatCurrency(item.price)} ea
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="flex items-center gap-3 mb-5">
                  <span className="w-7 h-7 rounded-lg bg-primary-600 text-white text-xs font-bold flex items-center justify-center">
                    3
                  </span>
                  <h2 className="text-lg font-bold text-slate-900">Payment Method</h2>
                </div>
                <div className="flex items-center gap-4 p-4 border-2 border-primary-500 bg-primary-50/50 rounded-2xl">
                  <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center p-2 shadow-sm border border-primary-100 shrink-0">
                    <img src={gcashLogo} alt="GCash" className="w-full h-full object-contain" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900">GCash</h3>
                      <span className="badge bg-primary-100 text-primary-700">Selected</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-0.5 tabular-nums">Account: {GCASH_ACCOUNT_NUMBER}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="card sticky top-24">
                <h2 className="font-bold text-slate-900 text-lg pb-4 border-b border-slate-100 mb-4">
                  Order Summary
                </h2>
                <div className="space-y-3 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-semibold text-slate-900 tabular-nums">{formatCurrency(checkoutTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pickup</span>
                    <span className="font-semibold text-emerald-600">LCCB Bookstore</span>
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-4 mb-5">
                  <div className="flex items-baseline justify-between">
                    <span className="font-semibold text-slate-900">Total</span>
                    <span className="font-extrabold text-2xl text-primary-600 tabular-nums">
                      {formatCurrency(checkoutTotal)}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-blue-50/80 border border-blue-100 rounded-xl mb-5 flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-blue-800 leading-relaxed">
                    Scan the GCash QR code in the next step and upload your payment receipt for staff verification.
                  </p>
                </div>

                <button
                  type="submit"
                  className="btn-primary w-full py-3 flex items-center justify-center gap-2 tabular-nums"
                >
                  Pay with GCash — {formatCurrency(checkoutTotal)}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {showGcash && !paidOrder && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto bg-slate-950/60 backdrop-blur-sm animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md my-auto overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-blue-700 to-blue-600 px-6 py-4 flex items-center gap-3.5">
              <div className="w-11 h-11 bg-white rounded-xl p-1.5 shadow-sm shrink-0">
                <img src={gcashLogo} alt="GCash" className="w-full h-full object-contain" />
              </div>
              <div>
                <h2 className="text-white font-bold text-base">GCash Payment</h2>
                <p className="text-blue-100 text-xs">LCCB Bookstore Checkout</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowGcash(false)
                  removeGcashReceipt()
                  setGcashError('')
                }}
                aria-label="Close GCash modal"
                className="ml-auto w-9 h-9 flex items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleGcashPay} className="p-6 space-y-4">
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Amount due</span>
                <span className="text-2xl font-extrabold text-slate-900 tabular-nums">
                  {formatCurrency(checkoutTotal)}
                </span>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-center">
                <p className="text-xs text-blue-800 mb-2.5 font-semibold">
                  Scan QR code with GCash to pay
                </p>
                <div className="w-44 h-44 mx-auto bg-white rounded-xl border border-blue-200 p-1.5 flex items-center justify-center overflow-hidden shadow-sm">
                  <img src={gcashQr} alt="GCash QR Code" className="w-full h-full object-contain" />
                </div>
                <div className="mt-3 inline-flex items-center gap-2 bg-white border border-blue-200 rounded-xl px-3 py-1.5">
                  <span className="text-xs font-semibold text-slate-700 tabular-nums">
                    {GCASH_ACCOUNT_NUMBER}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyGcashNumber}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Copy
                  </button>
                </div>
                {gcashPaymentLink && (
                  <a
                    href={gcashPaymentLink}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
                  >
                    Open GCash payment link
                  </a>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-800">Upload Payment Receipt</label>
                <div
                  onClick={() => receiptInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                    gcashReceiptPreview
                      ? 'border-primary-300 bg-primary-50/60'
                      : 'border-slate-200 hover:border-primary-300 hover:bg-slate-50'
                  }`}
                >
                  {gcashReceiptPreview ? (
                    <div className="space-y-2">
                      <img
                        src={gcashReceiptPreview}
                        alt="Payment receipt"
                        className="max-h-32 mx-auto rounded-xl shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeGcashReceipt()
                        }}
                        className="text-xs text-red-600 hover:text-red-700 font-semibold"
                      >
                        Remove image
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1 py-2">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mx-auto">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold text-slate-700">Tap to upload receipt screenshot</p>
                      <p className="text-xs text-slate-400">PNG or JPG up to 5MB</p>
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
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                  <p className="text-xs font-medium text-red-700">{gcashError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={gcashSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
              >
                {gcashSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                    Submitting Receipt...
                  </>
                ) : (
                  'Confirm & Submit Order'
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowGcash(false)
                  removeGcashReceipt()
                  setGcashError('')
                }}
                className="w-full text-xs font-medium text-slate-500 hover:text-slate-700 py-1.5"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      {paidOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-8 text-center animate-scale-in">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Payment Submitted!</h2>
            <p className="text-sm text-slate-600 mb-5 leading-relaxed">
              Your GCash receipt for <span className="font-bold text-slate-900 tabular-nums">{formatCurrency(paidOrder.amount)}</span> has been received. Our staff will verify your payment before preparing your pickup order.
            </p>
            <div className="bg-primary-50/80 border border-primary-100 rounded-2xl p-4 mb-6 text-left">
              <p className="text-xs font-bold uppercase tracking-wider text-primary-700 mb-1">
                Pickup Location
              </p>
              <p className="text-sm font-semibold text-slate-900">LCCB Bookstore Counter</p>
              <p className="text-xs text-slate-600 mt-1">
                Your pickup code will unlock once payment is verified.
              </p>
            </div>
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => navigate(`/order-status/${paidOrder.orderId}`)}
                className="btn-primary w-full py-3"
              >
                Track Order Status
              </button>
              <button
                type="button"
                onClick={() => navigate('/products')}
                className="btn-secondary w-full py-2.5"
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
