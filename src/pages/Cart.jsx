import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const resolveImageSrc = (image) => {
  if (!image) return '/placeholder-book.svg'
  if (image.startsWith('http://') || image.startsWith('https://')) return image
  if (image.startsWith('/uploads')) return image
  return image
}

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleCheckout = () => {
    if (!user) {
      toast.error('Please login to proceed to checkout')
      navigate('/login', { state: { from: '/checkout' } })
      return
    }
    navigate('/checkout')
  }

  if (cart.length === 0) {
    return (
      <div className="page-container animate-fade-in">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-6">Start adding items to your cart</p>
            <Link to="/products" className="btn-primary inline-flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
            <p className="text-gray-500">{cart.length} item{cart.length !== 1 ? 's' : ''} in cart</p>
          </div>
          <button
            onClick={() => {
              clearCart()
              toast.success('Cart cleared')
            }}
            className="text-sm text-red-500 hover:text-red-600 font-medium transition-colors"
          >
            Clear Cart
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <div key={`${item._id}-${item.selectedSize}`} className="card flex flex-col sm:flex-row gap-4 animate-slide-up">
                <div className="w-full sm:w-28 h-28 bg-gray-50 rounded-xl overflow-hidden shrink-0">
                  <img
                    src={resolveImageSrc(item.image)}
                    alt={item.name}
                    className="w-full h-full object-contain p-2"
                    onError={(e) => {
                      e.target.src = '/placeholder-book.svg'
                    }}
                  />
                </div>
                <div className="flex-1 flex flex-col">
                  <div className="flex items-start justify-between">
                    <div>
                      <Link to={`/products/${item._id}`} className="font-semibold text-gray-900 hover:text-primary-600 transition-colors">
                        {item.name}
                      </Link>
                      {item.selectedSize && (
                        <p className="text-sm text-gray-500 mt-0.5">Size: {item.selectedSize}</p>
                      )}
                      {item.category && (
                        <p className="text-xs text-gray-400 mt-0.5">{item.category}</p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        removeFromCart(item._id, item.selectedSize)
                        toast.success('Item removed')
                      }}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-3">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item._id, item.quantity - 1, item.selectedSize)}
                        className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors text-sm"
                      >
                        -
                      </button>
                      <span className="w-10 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item._id, item.quantity + 1, item.selectedSize)}
                        className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors text-sm"
                      >
                        +
                      </button>
                    </div>
                    <span className="font-bold text-primary-600">
                      ₱{(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="card sticky top-24">
              <h3 className="font-semibold text-gray-900 mb-4 pb-4 border-b border-gray-100">Order Summary</h3>
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal ({cart.reduce((a, i) => a + i.quantity, 0)} items)</span>
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
              <button onClick={handleCheckout} className="btn-primary w-full flex items-center justify-center gap-2 mb-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Proceed to Checkout
              </button>
              <Link to="/products" className="btn-secondary w-full flex items-center justify-center gap-2">
                Continue Shopping
              </Link>
              <div className="mt-4 p-3 bg-primary-50 rounded-lg">
                <p className="text-xs text-primary-700 text-center">
                  📦 Pickup only — collect your order at the LCCB Bookstore after payment verification.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
