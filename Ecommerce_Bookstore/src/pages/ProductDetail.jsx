import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api, { formatCategoryLabel, formatCurrency, resolveImageUrl } from '../config/api'
import { useCart } from '../context/CartContext'
import Loading from '../components/Loading'
import { sortVariantsBySize } from '../utils/products'
import toast from 'react-hot-toast'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState(null)

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true)
      try {
        const response = await api.get(`/customer/products/${id}`)
        const p = response.data.product || response.data
        setProduct(p)
        if (p.variants && p.variants.length > 0) {
          const sorted = sortVariantsBySize(p.variants)
          const initial = sorted.find((v) => v._id === p._id) || sorted.find((v) => v.stock > 0) || sorted[0]
          setSelectedVariant(initial)
        } else {
          setSelectedVariant({
            _id: p._id,
            id: p.id,
            size: p.size || null,
            name: p.name,
            price: p.price,
            stock: p.stock,
            image: p.image,
          })
        }
      } catch (err) {
        console.error('Failed to fetch product:', err)
        toast.error('Product not found')
        navigate('/products')
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [id, navigate])

  const handleSizeChange = (variant) => {
    if (variant.stock <= 0) return
    setSelectedVariant(variant)
    setQuantity(1)
  }

  const handleAddToCart = () => {
    if (!selectedVariant || selectedVariant.stock <= 0) return
    const sizeVal = selectedVariant.size || null
    addToCart(selectedVariant, quantity, sizeVal, product?.variants || [])
    toast.success(`Added ${quantity} item${quantity > 1 ? 's' : ''} to cart`)
  }

  const handleBuyNow = () => {
    if (!selectedVariant || selectedVariant.stock <= 0) return
    const sizeVal = selectedVariant.size || null
    addToCart(selectedVariant, quantity, sizeVal, product?.variants || [])
    navigate('/cart')
  }

  if (loading) return <Loading text="Loading product..." />
  if (!product) return null

  const current = selectedVariant || product
  const sortedVariants = sortVariantsBySize(product.variants || [])
  const hasVariants = product.hasVariants && sortedVariants.length > 1

  return (
    <div className="page-container animate-fade-in">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link to="/" className="hover:text-primary-600 transition-colors">Home</Link>
          <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link to="/products" className="hover:text-primary-600 transition-colors">Catalog</Link>
          <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-slate-900 font-medium truncate">{product.name}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-soft p-6 sm:p-8">
            <div className="aspect-square bg-slate-50/80 rounded-2xl overflow-hidden flex items-center justify-center p-6">
              <img
                src={resolveImageUrl(current.image)}
                alt={product.name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.src = '/placeholder-book.svg'
                }}
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-soft p-6 sm:p-8 flex flex-col">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {product.category && (
                <span className="badge bg-primary-50 text-primary-700 ring-1 ring-primary-200/80">
                  {formatCategoryLabel(product.category)}
                </span>
              )}
              {product.department && (
                <span className="badge bg-slate-100 text-slate-700">
                  {product.department}
                </span>
              )}
              {current.stock > 0 ? (
                <span className={`badge ${current.stock <= 5 ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'}`}>
                  {current.stock <= 5 ? `Only ${current.stock} left` : `${current.stock} in stock`}
                </span>
              ) : (
                <span className="badge bg-red-50 text-red-700 ring-1 ring-red-200">Out of Stock</span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
              {product.name}
            </h1>

            <p className="text-3xl font-extrabold text-primary-600 tabular-nums mb-5">
              {formatCurrency(current.price)}
            </p>

            {product.description && (
              <div className="mb-6 pb-6 border-b border-slate-100">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Description
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">{product.description}</p>
              </div>
            )}

            {hasVariants && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-sm font-semibold text-slate-900">Select Size</span>
                  {current.size && (
                    <span className="text-xs font-medium text-slate-500">Selected: {current.size}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {sortedVariants.map((variant) => {
                    const isSelected = variant.id === current.id || variant._id === current._id
                    const outOfStock = variant.stock <= 0
                    return (
                      <button
                        key={variant.id || variant._id}
                        type="button"
                        disabled={outOfStock}
                        onClick={() => handleSizeChange(variant)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                          isSelected
                            ? 'bg-primary-600 text-white border-primary-600 shadow-sm shadow-primary-600/20'
                            : outOfStock
                              ? 'bg-slate-50 text-slate-300 border-slate-200 line-through cursor-not-allowed'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-primary-400 hover:text-primary-700'
                        }`}
                      >
                        {variant.size || 'Standard'}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="mb-6">
              <span className="block text-sm font-semibold text-slate-900 mb-2.5">Quantity</span>
              <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  aria-label="Decrease quantity"
                  className="w-9 h-9 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <span className="w-12 text-center font-semibold text-base tabular-nums text-slate-900">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(Math.max(1, current.stock), quantity + 1))}
                  disabled={current.stock <= 0 || quantity >= current.stock}
                  aria-label="Increase quantity"
                  className="w-9 h-9 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={current.stock === 0}
                className="btn-secondary flex-1 flex items-center justify-center gap-2 py-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
                Add to Cart
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={current.stock === 0}
                className="btn-primary flex-1 flex items-center justify-center gap-2 py-3"
              >
                Pre-Order Now
              </button>
            </div>

            <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="text-xs text-slate-600 leading-relaxed">
                <p className="font-semibold text-slate-900 mb-0.5">Campus Pickup Only</p>
                <p>Pay via GCash online, then collect your order at the LCCB Bookstore counter (Mon–Fri, 8:00 AM – 5:00 PM).</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
