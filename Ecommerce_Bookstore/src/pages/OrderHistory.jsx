import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api, { formatCurrency, resolveImageUrl } from '../config/api'
import OrderStatusBadge from '../components/OrderStatusBadge'
import Loading from '../components/Loading'

const getOrderId = (order) => order._id ?? order.id
const formatOrderId = (order) => String(getOrderId(order) ?? '').slice(-8).toUpperCase() || '—'
const formatDate = (value) => {
  const date = new Date(value)
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
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
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 mb-1">
            Account Activity
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Order History</h1>
          <p className="text-sm text-slate-500 mt-1">Track your pre-orders and pickup codes</p>
        </div>

        {orders.length === 0 ? (
          <div className="card text-center py-14">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">No orders yet</h3>
            <p className="text-sm text-slate-500 mb-5">Start browsing the catalog to place your first pre-order.</p>
            <Link to="/products" className="btn-primary inline-block">
              Browse Catalog
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link
                key={getOrderId(order)}
                to={`/order-status/${getOrderId(order)}`}
                className="card card-hover block p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2 mb-3.5">
                  <div>
                    <p className="text-sm font-bold text-slate-900 tabular-nums">
                      Order #{formatOrderId(order)}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatDate(order.createdAt)}</p>
                  </div>
                  <OrderStatusBadge status={order.status} showDescription={false} />
                </div>

                {order.items && order.items.length > 0 && (
                  <div className="flex items-center gap-2 mb-3.5">
                    {order.items.slice(0, 4).map((item, idx) => (
                      <div
                        key={idx}
                        className="w-11 h-11 bg-slate-50 border border-slate-100 rounded-xl overflow-hidden shrink-0 flex items-center justify-center p-1"
                      >
                        <img
                          src={resolveImageUrl(item.product?.image || item.image)}
                          alt={item.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.target.src = '/placeholder-book.svg'
                          }}
                        />
                      </div>
                    ))}
                    {order.items.length > 4 && (
                      <span className="text-xs font-semibold text-slate-500 px-2">
                        +{order.items.length - 4} more
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-sm">
                  <span className="text-slate-500">
                    {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                    {order.pickupCode ? ` · Pickup Code: ${order.pickupCode}` : ''}
                  </span>
                  <span className="font-bold text-primary-600 tabular-nums">
                    {formatCurrency(order.totalAmount || 0)}
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
