import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../config/api'
import OrderStatusBadge from '../components/OrderStatusBadge'
import Loading from '../components/Loading'

const resolveImageSrc = (image) => {
  if (!image) return '/placeholder-book.svg'
  if (image.startsWith('http://') || image.startsWith('https://')) return image
  if (image.startsWith('/uploads')) return image
  return image
}

export default function OrderHistory() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.get('/customer/orders/my-orders')
        setOrders(response.data.orders || response.data || [])
      } catch (err) {
        console.error('Failed to fetch orders:', err)
        setOrders([])
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [])

  if (loading) return <Loading text="Loading orders..." />

  return (
    <div className="page-container animate-fade-in">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Order History</h1>
        <p className="text-gray-500 mb-8">View all your past and current orders</p>

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No orders yet</h3>
            <p className="text-gray-500 mb-4">Start shopping to see your orders here.</p>
            <Link to="/products" className="btn-primary">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link
                key={order._id}
                to={`/order-status/${order._id}`}
                className="card hover:shadow-card-hover transition-all block"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm text-gray-500">
                      Order #{order._id?.slice(-8).toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <OrderStatusBadge status={order.status} showDescription={false} />
                </div>
                {order.items && (
                  <div className="flex items-center space-x-2 mb-3">
                    {order.items.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="w-10 h-10 bg-gray-50 rounded-lg overflow-hidden shrink-0">
                        <img
                          src={resolveImageSrc(item.product?.image || item.image)}
                          alt={item.name}
                          className="w-full h-full object-contain p-0.5"
                          onError={(e) => {
                            e.target.src = '/placeholder-book.svg'
                          }}
                        />
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <span className="text-sm text-gray-500">+{order.items.length - 3} more</span>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-sm text-gray-500">
                    {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                  </span>
                  <span className="font-bold text-primary-600">
                    ₱{(order.totalAmount || 0).toLocaleString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
