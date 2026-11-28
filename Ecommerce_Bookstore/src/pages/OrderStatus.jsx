import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import api, { formatCurrency, resolveImageUrl } from '../config/api'
import OrderStatusBadge, { StatusTimeline } from '../components/OrderStatusBadge'
import Loading from '../components/Loading'

const TERMINAL_STATUSES = ['Completed', 'Rejected', 'Cancelled']
const POLL_INTERVAL_MS = 4000

const PICKUP_CALLOUT = {
  'Payment Verified': {
    box: 'border-blue-200 bg-blue-50/70',
    title: 'text-blue-900',
    copy: 'text-blue-700',
    codeBorder: 'border-blue-200',
    codeText: 'text-blue-700',
    heading: 'Payment Verified',
    message: 'Your payment has been confirmed. Your order is queued for preparation.',
  },
  Preparing: {
    box: 'border-indigo-200 bg-indigo-50/70',
    title: 'text-indigo-900',
    copy: 'text-indigo-700',
    codeBorder: 'border-indigo-200',
    codeText: 'text-indigo-700',
    heading: 'Preparing Your Order',
    message: 'Our bookstore staff is gathering your items for campus pickup.',
  },
  'Ready for Pickup': {
    box: 'border-emerald-200 bg-emerald-50/70',
    title: 'text-emerald-900',
    copy: 'text-emerald-700',
    codeBorder: 'border-emerald-200',
    codeText: 'text-emerald-700',
    heading: 'Ready for Campus Pickup!',
    message: 'Please collect your order at the LCCB Bookstore counter (Mon–Fri, 8:00 AM – 5:00 PM).',
  },
}

export default function OrderStatus() {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState(null)
  const prevStatusRef = useRef(null)

  const fetchOrder = useCallback(async ({ silent = false } = {}) => {
    try {
      const response = await api.get(`/customer/orders/${orderId}`, {
        params: { _t: Date.now() },
      })
      const nextOrder = response.data.order || response.data
      if (nextOrder) {
        if (
          prevStatusRef.current &&
          nextOrder.status &&
          prevStatusRef.current !== nextOrder.status
        ) {
          if (nextOrder.status === 'Rejected' || nextOrder.status === 'Cancelled') {
            toast.error(`Order status updated: ${nextOrder.status}`)
          } else {
            toast.success(`Order status updated: ${nextOrder.status}`)
          }
        }
        prevStatusRef.current = nextOrder.status
        setOrder(nextOrder)
        setError(null)
      }
    } catch (err) {
      if (!silent) {
        console.error('Failed to fetch order:', err)
        setError('Order not found or you do not have permission to view it.')
      }
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [orderId])

  useEffect(() => {
    setLoading(true)
    prevStatusRef.current = null
    fetchOrder({ silent: false })
  }, [fetchOrder])

  useEffect(() => {
    if (!order || TERMINAL_STATUSES.includes(order.status)) return undefined

    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchOrder({ silent: true })
      }
    }, POLL_INTERVAL_MS)

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchOrder({ silent: true })
      }
    }

    window.addEventListener('focus', handleVisibilityOrFocus)
    document.addEventListener('visibilitychange', handleVisibilityOrFocus)

    return () => {
      clearInterval(intervalId)
      window.removeEventListener('focus', handleVisibilityOrFocus)
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus)
    }
  }, [order, fetchOrder])

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order? Reserved online stock will be returned to inventory.')) {
      return
    }
    setCancelling(true)
    try {
      await api.post(`/customer/orders/${orderId}/cancel`)
      toast.success('Order cancelled and reserved stock restored')
      await fetchOrder({ silent: true })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) return <Loading text="Loading order details..." />

  if (error) {
    return (
      <div className="page-container animate-fade-in">
        <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="card text-center py-12">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Order Not Found</h2>
            <p className="text-sm text-slate-500 mb-6">{error}</p>
            <Link to="/products" className="btn-primary inline-block">Browse Catalog</Link>
          </div>
        </div>
      </div>
    )
  }

  const callout = PICKUP_CALLOUT[order.status]
  const formattedDeadline = order.expiresAt
    ? new Date(order.expiresAt).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : null

  return (
    <div className="page-container animate-fade-in">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link to="/orders" className="hover:text-primary-600 transition-colors">Orders</Link>
          <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-slate-900 font-medium">Order #{String(orderId).slice(-8).toUpperCase()}</span>
        </nav>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Order Details</h1>
            <p className="text-sm text-slate-500 mt-1 tabular-nums">
              Order #{String(orderId).slice(-8).toUpperCase()} · Campus Pickup Only
            </p>
          </div>
          <OrderStatusBadge status={order.status || 'Pending Payment Verification'} showDescription={false} />
        </div>

        <div className="space-y-5">
          {/* 3-DAY PAYMENT DEADLINE & RESERVATION CARD */}
          {order.status === 'Pending Payment Verification' && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 mb-2">
                    Online Stock Reserved · 3-Day Payment Hold
                  </span>
                  <h2 className="font-bold text-amber-950 text-base">
                    {order.receiptImage
                      ? 'Payment Receipt Uploaded — Awaiting Admin Verification'
                      : 'Action Required: Upload GCash Payment Receipt Within 3 Days'}
                  </h2>
                  {formattedDeadline && (
                    <p className="text-xs text-amber-800 mt-1">
                      Payment Verification Deadline: <strong>{formattedDeadline}</strong>. Unpaid orders automatically expire after 3 days and return reserved stock to inventory.
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to={`/upload-payment/${order._id || order.id}`}
                    className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition"
                  >
                    {order.receiptImage ? 'Re-upload Receipt' : 'Upload GCash Receipt'}
                  </Link>
                  <button
                    type="button"
                    disabled={cancelling}
                    onClick={handleCancelOrder}
                    className="px-3.5 py-2 rounded-xl border border-amber-300 bg-white hover:bg-amber-100 text-amber-900 text-xs font-semibold transition"
                  >
                    {cancelling ? 'Cancelling...' : 'Cancel Order'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {callout && (order.pickupCode || order.status === 'Ready for Pickup' || order.status === 'Payment Verified') && (
            <div className={`rounded-2xl border p-6 ${callout.box}`}>
              <h2 className={`font-bold text-base mb-1 ${callout.title}`}>{callout.heading}</h2>
              <p className={`text-sm mb-4 ${callout.copy}`}>{callout.message}</p>
              {order.pickupCode && (
                <div className={`bg-white rounded-2xl p-4 border text-center ${callout.codeBorder}`}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Your Pickup Verification Code
                  </p>
                  <p className={`text-3xl font-mono font-extrabold tracking-[0.28em] ${callout.codeText}`}>
                    {order.pickupCode}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    Present this code at the LCCB Bookstore counter to confirm your identity when collecting your items.
                  </p>
                </div>
              )}
            </div>
          )}

          {(order.status === 'Rejected' || order.status === 'Cancelled') && (
            <div className="rounded-2xl border border-red-200 bg-red-50/80 p-6">
              <h2 className="font-bold text-red-900 mb-1">Order {order.status}</h2>
              <p className="text-sm text-red-700">
                {order.cancelledReason ||
                  'This order was cancelled or its payment could not be verified. Any reserved stock has been returned to bookstore inventory.'}
              </p>
            </div>
          )}

          <div className="card">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="text-base font-bold text-slate-900">Order Progress</h2>
              {!TERMINAL_STATUSES.includes(order.status) && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live updates
                </span>
              )}
            </div>
            <StatusTimeline
              statuses={order.statuses}
              currentStatus={order.status || 'Pending Payment Verification'}
            />
          </div>

          {order.items && order.items.length > 0 && (
            <div className="card">
              <h2 className="text-base font-bold text-slate-900 mb-4">Order Items</h2>
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-3.5 p-3 bg-slate-50/80 border border-slate-100 rounded-xl">
                    <div className="w-12 h-12 bg-white border border-slate-200/60 rounded-lg overflow-hidden shrink-0 flex items-center justify-center p-1">
                      <img
                        src={resolveImageUrl(item.product?.image || item.image)}
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
                        {formatCurrency(item.price || item.amount || 0)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                <span className="font-semibold text-slate-900">Total Amount</span>
                <span className="font-extrabold text-xl text-primary-600 tabular-nums">
                  {formatCurrency(order.totalAmount || 0)}
                </span>
              </div>
            </div>
          )}

          {order.customerInfo && (
            <div className="card">
              <h2 className="text-base font-bold text-slate-900 mb-4">Customer Information</h2>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Full Name</p>
                  <p className="font-semibold text-slate-900 mt-0.5">{order.customerInfo.fullName}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Email</p>
                  <p className="font-semibold text-slate-900 mt-0.5">{order.customerInfo.email}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Contact Number</p>
                  <p className="font-semibold text-slate-900 mt-0.5">{order.customerInfo.contactNumber}</p>
                </div>
                {order.referenceNumber && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Reference Number</p>
                    <p className="font-semibold text-slate-900 mt-0.5 tabular-nums">{order.referenceNumber}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/products" className="btn-secondary flex-1 text-center py-2.5">
              Continue Shopping
            </Link>
            <Link to="/orders" className="btn-primary flex-1 text-center py-2.5">
              View All Orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
