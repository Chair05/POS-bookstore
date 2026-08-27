import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../config/api'
import { useCart } from '../context/CartContext'
import Loading from '../components/Loading'
import toast from 'react-hot-toast'

const resolveImageSrc = (image) => {
  if (!image) return '/placeholder-book.svg'
  if (image.startsWith('http://') || image.startsWith('https://')) return image
  if (image.startsWith('/uploads')) return image
  return image
}

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
          setSelectedVariant(p.variants[0])
        } else {
          setSelectedVariant({
            _id: p._id,
            id: p.id,
            size: null,
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
    toast.success(`Added ${quantity} item(s) to cart!`)
  }

  const handleBuyNow = () => {
    handleAddToCart()
    navigate('/cart')
  }

  if (loading) return <Loading text="Loading product..." />
  if (!product) return null

  const current = selectedVariant || product
  const hasVariants = product.hasVariants && product.variants && product.variants.length > 1

  return (
    <div className="page-container animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-primary-600 transition-colors">Home</Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link to="/products" className="hover:text-primary-600 transition-colors">Products</Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-900 font-medium truncate">{product.name}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          <div className="bg-white rounded-2xl p-8 shadow-soft">
            <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden">
              <img
                src={resolveImageSrc(current.image)}
                alt={product.name}
                className="w-full h-full object-contain p-6"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48cmVjdCBmaWxsPSIjZjFmNWY5IiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIvPjx0ZXh0IGZpbGw9IiM5NGEzYjgiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='
                }}
              />
            </div>
          </div>

          <div className="flex flex-col">
            {product.category && (
              <span className="inline-block w-fit badge bg-primary-100 text-primary-700 mb-3">
                {product.category}
              </span>
            )}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>

            <div className="mb-4">
              <span className="text-3xl font-bold text-primary-600">
                ₱{current.price?.toLocaleString()}
              </span>
            </div>

            <div className="mb-4">
              {current.stock > 0 ? (
                <span className={`badge ${current.stock <= 5 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                  {current.stock <= 5 ? `Only ${current.stock} left in stock` : `${current.stock} in stock`}
                </span>
              ) : (
                <span className="badge bg-red-100 text-red-700">Out of Stock</span>
              )}
            </div>

            {product.description && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
              </div>
            )}

            {hasVariants && (
              <div className="mb-6">
                <label className="block font-semibold text-gray-900 mb-2">
                  Size
                </label>
                <select
                  value={selectedVariant?.id || ''}
                  onChange={(e) => {
                    const variant = product.variants.find(
                      (v) => v.id === Number(e.target.value) || v._id === Number(e.target.value)
                    )
                    if (variant && variant.stock > 0) handleSizeChange(variant)
                  }}
                  className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors cursor-pointer"
                >
                  {product.variants.map((variant) => (
                    <option
                      key={variant.id}
                      value={variant.id}
                      disabled={variant.stock <= 0}
                    >
                      {variant.size}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Quantity</h3>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <span className="w-12 text-center font-medium text-lg">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(current.stock, quantity + 1))}
                  className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-auto">
              <button
                onClick={handleAddToCart}
                disabled={current.stock === 0}
                className="btn-secondary flex-1 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
                Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                disabled={current.stock === 0}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                Buy Now
              </button>
            </div>

            <div className="mt-6 p-4 bg-primary-50 rounded-xl">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-primary-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-primary-800">
                  <p className="font-medium">Pickup Only</p>
                  <p>Order online, pay via GCash or bank transfer, then pick up at the LCCB Bookstore.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
