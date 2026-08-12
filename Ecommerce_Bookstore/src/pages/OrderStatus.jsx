import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../config/api'
import OrderStatusBadge, { StatusTimeline } from '../components/OrderStatusBadge'
import Loading from '../components/Loading'

const resolveImageSrc = (image) => {
  if (!image) return '/placeholder-book.svg'
  if (image.startsWith('http://') || image.startsWith('https://')) return image
  if (image.startsWith('/uploads')) return image
  return image
}

export default function OrderStatus() {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await api.get(`/customer/orders/${orderId}`)
        setOrder(response.data.order || response.data)
      } catch (err) {
        console.error('Failed to fetch order:', err)
        setError('Order not found or you do not have permission to view it.')
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()
  }, [orderId])

  if (loading) return <Loading text="Loading order details..." />

  if (error) {
    return (
      <div className="page-container animate-fade-in">
        <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <Link to="/products" className="btn-primary">Browse Products</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
          <Link to="/products" className="hover:text-primary-600 transition-colors">Products</Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-900 font-medium">Order Status</span>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Details</h1>
        <p className="text-gray-500 mb-8">Order #{orderId?.slice(-8).toUpperCase()}</p>

        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Status</h2>
            <OrderStatusBadge status={order.status || 'Pending Payment Verification'} />
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Progress</h2>
            <StatusTimeline
              statuses={order.statuses}
              currentStatus={order.status || 'Pending Payment Verification'}
            />
          </div>

          {order.items && order.items.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 bg-white rounded-lg overflow-hidden shrink-0">
                      <img
                        src={resolveImageSrc(item.product?.image || item.image)}
                        alt={item.name}
                        className="w-full h-full object-contain p-1"
                        onError={(e) => {
                          e.target.src = '/placeholder-book.svg'
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{item.name}</p>
                      {item.selectedSize && <p className="text-xs text-gray-500">Size: {item.selectedSize}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium text-gray-900">₱{(item.price || item.amount || 0).toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {order.customerInfo && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium">{order.customerInfo.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{order.customerInfo.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Contact Number</p>
                  <p className="font-medium">{order.customerInfo.contactNumber}</p>
                </div>
                {order.referenceNumber && (
                  <div>
                    <p className="text-sm text-gray-500">Reference Number</p>
                    <p className="font-medium">{order.referenceNumber}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="card">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-900">Total Amount</span>
              <span className="font-bold text-xl text-primary-600">
                ₱{(order.totalAmount || 0).toLocaleString()}
              </span>
            </div>
          </div>

          {order.status === 'Rejected' && (
            <div className="card border-2 border-red-200 bg-red-50">
              <h3 className="font-semibold text-red-800 mb-2">Payment Rejected</h3>
              <p className="text-sm text-red-700">
                Your payment could not be verified. Please visit the LCCB Bookstore or contact 
                the administrator for assistance.
              </p>
            </div>
          )}

          {order.status === 'Payment Verified' && (
            <div className="card border-2 border-blue-200 bg-blue-50">
              <h3 className="font-semibold text-blue-800 mb-2">Payment Verified</h3>
              <p className="text-sm text-blue-700 mb-4">
                Your payment has been confirmed. Your order is being prepared for pickup.
              </p>
              {order.pickupCode && (
                <div className="bg-white rounded-xl p-4 border border-blue-200 text-center">
                  <p className="text-xs text-gray-500 mb-1">Your Pickup Code</p>
                  <p className="text-3xl font-mono font-bold tracking-[0.3em] text-blue-700">{order.pickupCode}</p>
                  <p className="text-xs text-gray-500 mt-2">Save this code — show it to the seller when collecting your order</p>
                </div>
              )}
            </div>
          )}

          {order.status === 'Preparing' && order.pickupCode && (
            <div className="card border-2 border-amber-200 bg-amber-50">
              <h3 className="font-semibold text-amber-800 mb-2">Preparing Your Order</h3>
              <p className="text-sm text-amber-700 mb-4">
                Your order is being prepared. We'll notify you when it's ready.
              </p>
              <div className="bg-white rounded-xl p-4 border border-amber-200 text-center">
                <p className="text-xs text-gray-500 mb-1">Your Pickup Code</p>
                <p className="text-3xl font-mono font-bold tracking-[0.3em] text-amber-700">{order.pickupCode}</p>
                <p className="text-xs text-gray-500 mt-2">Show this code to the seller when collecting your order</p>
              </div>
            </div>
          )}

          {order.status === 'Ready for Pickup' && (
            <div className="card border-2 border-green-200 bg-green-50">
              <h3 className="font-semibold text-green-800 mb-2">Ready for Pickup!</h3>
              <p className="text-sm text-green-700 mb-4">
                Please pick up your order at the LCCB Bookstore during operating hours 
                (Mon-Fri, 8:00 AM - 5:00 PM).
              </p>
              {order.pickupCode && (
                <div className="bg-white rounded-xl p-4 border border-green-200 text-center">
                  <p className="text-xs text-gray-500 mb-1">Your Pickup Code</p>
                  <p className="text-3xl font-mono font-bold tracking-[0.3em] text-green-700">{order.pickupCode}</p>
                  <p className="text-xs text-gray-500 mt-2">Show this code to the seller when collecting your order</p>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/products" className="btn-secondary flex-1 text-center">
              Continue Shopping
            </Link>
            <Link to="/orders" className="btn-primary flex-1 text-center">
              View All Orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
