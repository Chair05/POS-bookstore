import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { formatCategoryLabel, formatCurrency, resolveImageUrl } from '../config/api'
import { sortVariantsBySize } from '../utils/products'
import toast from 'react-hot-toast'

export default function Cart() {
  const {
    cart,
    selectedIds,
    selectedItems,
    selectedTotal,
    selectedCount,
    allSelected,
    toggleItem,
    toggleAll,
    removeFromCart,
    updateQuantity,
    changeSize,
    clearCart,
  } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleCheckout = () => {
    if (!user) {
      toast.error('Please login to proceed to checkout')
      navigate('/login', { state: { from: '/checkout' } })
      return
    }
    if (selectedItems.length === 0) {
      toast.error('Please select at least one item')
      return
    }
    navigate('/checkout')
  }

  if (cart.length === 0) {
    return (
      <div className="page-container animate-fade-in">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="card text-center py-14">
            <div className="w-20 h-20 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Your cart is empty</h2>
            <p className="text-sm text-slate-500 mb-6">
              Browse the catalog to add uniforms, textbooks, or supplies to your order.
            </p>
            <Link to="/products" className="btn-primary inline-flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Browse Catalog
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 mb-1">
              Pre-Order Bag
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Shopping Cart</h1>
            <p className="text-sm text-slate-500 mt-1">
              {cart.length} item{cart.length !== 1 ? 's' : ''} in your cart
            </p>
          </div>
          <div className="flex items-center gap-4">
            <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              Select All
            </label>
            <button
              type="button"
              onClick={() => {
                clearCart()
                toast.success('Cart cleared')
              }}
              className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
            >
              Clear Cart
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          <div className="lg:col-span-2 space-y-3.5">
            {cart.map((item) => {
              const itemKey = `${item._id}_${item.selectedSize || ''}`
              const isSelected = selectedIds.has(itemKey)
              const sortedVariants = sortVariantsBySize((item.variants || []).filter((v) => v.size))

              return (
                <div
                  key={itemKey}
                  className={`rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row gap-4 transition-all ${
                    isSelected
                      ? 'bg-white border-primary-300 shadow-soft ring-1 ring-primary-100'
                      : 'bg-white/80 border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center gap-3.5 shrink-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleItem(itemKey)}
                      aria-label={`Select ${item.name}`}
                      className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    />
                    <Link
                      to={`/products/${item._id}`}
                      className="w-24 h-24 bg-slate-50 border border-slate-100 rounded-xl overflow-hidden shrink-0 flex items-center justify-center p-2"
                    >
                      <img
                        src={resolveImageUrl(item.image)}
                        alt={item.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.src = '/placeholder-book.svg'
                        }}
                      />
                    </Link>
                  </div>

                  <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          to={`/products/${item._id}`}
                          className="font-semibold text-slate-900 hover:text-primary-700 transition-colors block truncate"
                        >
                          {item.name}
                        </Link>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {item.category && (
                            <span className="text-xs text-slate-500">
                              {formatCategoryLabel(item.category)}
                            </span>
                          )}
                          <span className="text-xs text-slate-400">·</span>
                          <span className="text-xs font-medium text-slate-600 tabular-nums">
                            {formatCurrency(item.price)} each
                          </span>
                        </div>
                        {sortedVariants.length > 1 ? (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs text-slate-500">Size:</span>
                            <select
                              aria-label={`Change size for ${item.name}`}
                              value={item._id}
                              onChange={(e) => {
                                const variant = item.variants.find((v) => v._id === Number(e.target.value))
                                if (variant) changeSize(item._id, variant.size)
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-200 bg-slate-50 text-slate-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-200"
                            >
                              {sortedVariants.map((variant) => (
                                <option key={variant._id} value={variant._id}>
                                  {variant.size}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          item.selectedSize && (
                            <span className="inline-block mt-2 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                              Size: {item.selectedSize}
                            </span>
                          )
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          removeFromCart(item._id, item.selectedSize)
                          toast.success('Item removed')
                        }}
                        aria-label={`Remove ${item.name}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                      <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5">
                        <button
                          type="button"
                          onClick={() => item.quantity > 1 && updateQuantity(item._id, item.quantity - 1, item.selectedSize)}
                          disabled={item.quantity <= 1}
                          aria-label="Decrease quantity"
                          className="w-7 h-7 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-40 text-sm transition-colors"
                        >
                          −
                        </button>
                        <span className="w-9 text-center text-sm font-semibold tabular-nums text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item._id, item.quantity + 1, item.selectedSize)}
                          aria-label="Increase quantity"
                          className="w-7 h-7 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center text-slate-700 hover:bg-slate-100 text-sm transition-colors"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-base font-bold text-slate-900 tabular-nums">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="lg:col-span-1">
            <div className="card sticky top-24">
              <h2 className="font-bold text-slate-900 text-lg pb-4 border-b border-slate-100 mb-4">
                Order Summary
              </h2>
              <div className="space-y-3 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Selected ({selectedCount} item{selectedCount === 1 ? '' : 's'})</span>
                  <span className="font-semibold text-slate-900 tabular-nums">{formatCurrency(selectedTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pickup Fee</span>
                  <span className="font-semibold text-emerald-600">Free (Campus Pickup)</span>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-4 mb-6">
                <div className="flex items-baseline justify-between">
                  <span className="font-semibold text-slate-900">Total</span>
                  <span className="font-extrabold text-2xl text-primary-600 tabular-nums">
                    {formatCurrency(selectedTotal)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCheckout}
                disabled={selectedItems.length === 0}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 mb-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Proceed to Checkout
              </button>
              <Link to="/products" className="btn-secondary w-full flex items-center justify-center py-2.5">
                Continue Shopping
              </Link>
              <div className="mt-4 p-3.5 bg-primary-50/70 border border-primary-100 rounded-xl">
                <p className="text-xs text-primary-800 leading-relaxed text-center">
                  Collect your items at the LCCB Bookstore counter once your GCash payment is verified.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
