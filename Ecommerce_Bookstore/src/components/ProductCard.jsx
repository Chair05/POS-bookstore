import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { formatCategoryLabel, formatCurrency, resolveImageUrl } from '../config/api'
import toast from 'react-hot-toast'

export default function ProductCard({ product, badgeLabel = null }) {
  const { addToCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  const imageSrc = resolveImageUrl(product.image)
  const variants = Array.isArray(product.variants) ? product.variants : []
  const hasMultipleSizes = variants.length > 1
  const maxOrderQty = Number(product.maxOrderQuantity || 5)

  const priceLabel = (() => {
    if (!hasMultipleSizes) return formatCurrency(product.price)
    const prices = variants.map((v) => Number(v.price)).filter((n) => !Number.isNaN(n))
    if (prices.length === 0) return formatCurrency(product.price)
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    return min === max ? formatCurrency(min) : `${formatCurrency(min)} – ${formatCurrency(max)}`
  })()

  const handleAddToCart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      toast.error('Please sign in or register an account to reserve products')
      navigate('/login', { state: { from: `/products/${product._id}` } })
      return
    }
    if (product.stock <= 0) {
      toast.error('This product is out of online stock')
      return
    }
    const res = addToCart(product, 1, product.size || null, variants)
    if (res?.capped) {
      toast.error(`Bulk purchase limit: Maximum ${maxOrderQty} units allowed per order`)
    } else {
      toast.success(`Added to cart${product.size ? ` (${product.size})` : ''}`)
    }
  }

  const stockStatus = () => {
    if (product.stock === 0) return { text: 'Out of Stock', color: 'bg-red-50 text-red-700 ring-1 ring-red-200/80' }
    if (product.stock <= 10) return { text: `Only ${product.stock} left online`, color: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/80' }
    return { text: `${product.stock} in stock`, color: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80' }
  }

  const status = stockStatus()

  return (
    <Link to={`/products/${product._id}`} className="group block h-full">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft hover:shadow-card-hover hover:border-primary-200/90 hover:-translate-y-0.5 transition-all duration-200 h-full flex flex-col overflow-hidden">
        <div className="relative bg-slate-50/80 border-b border-slate-100 aspect-[4/3] overflow-hidden p-5 flex items-center justify-center">
          <img
            src={imageSrc}
            alt={product.name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.src = '/placeholder-book.svg'
            }}
          />
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {badgeLabel && (
              <span className="badge bg-primary-600 text-white shadow-xs">
                {badgeLabel}
              </span>
            )}
            {product.category && (
              <span className="badge bg-white/90 backdrop-blur-sm text-slate-700 ring-1 ring-slate-200/80">
                {formatCategoryLabel(product.category)}
              </span>
            )}
          </div>
          <span className={`absolute top-3 right-3 badge ${status.color}`}>
            {status.text}
          </span>
        </div>

        <div className="p-4 flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="font-semibold text-slate-900 text-[15px] leading-snug line-clamp-2 group-hover:text-primary-700 transition-colors">
              {product.name}
            </h3>
          </div>

          {product.description ? (
            <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
              {product.description}
            </p>
          ) : (
            <div className="mb-2" />
          )}

          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            {product.size && product.size.toUpperCase() !== 'N/A' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                {product.size}
              </span>
            )}
            {hasMultipleSizes && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary-50 text-primary-700 text-xs font-medium">
                {variants.length} sizes
              </span>
            )}
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[11px] font-medium">
              Max {maxOrderQty}/order
            </span>
          </div>

          <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <span className="text-lg font-bold text-slate-900 tabular-nums">
              {priceLabel}
            </span>
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              aria-label={`Add ${product.name} to cart`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 active:scale-[0.98] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}
