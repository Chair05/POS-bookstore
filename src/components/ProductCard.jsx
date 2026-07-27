import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import toast from 'react-hot-toast'

export default function ProductCard({ product }) {
  const { addToCart } = useCart()

  const handleAddToCart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (product.stock <= 0) {
      toast.error('This product is out of stock')
      return
    }
    addToCart(product, 1)
    toast.success('Added to cart!')
  }

  const stockStatus = () => {
    if (product.stock === 0) return { text: 'Out of Stock', color: 'bg-red-100 text-red-700' }
    if (product.stock <= 5) return { text: `Only ${product.stock} left`, color: 'bg-amber-100 text-amber-700' }
    return { text: 'In Stock', color: 'bg-green-100 text-green-700' }
  }

  const status = stockStatus()

  return (
    <Link to={`/products/${product._id}`} className="group block">
      <div className="card card-hover h-full flex flex-col">
        <div className="relative overflow-hidden rounded-lg bg-gray-50 aspect-square mb-4">
          <img
            src={product.image || '/placeholder-book.png'}
            alt={product.name}
            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48cmVjdCBmaWxsPSIjZjFmNWY5IiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIvPjx0ZXh0IGZpbGw9IiM5NGEzYjgiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='
            }}
          />
          <span className={`absolute top-2 right-2 badge ${status.color}`}>
            {status.text}
          </span>
          {product.category && (
            <span className="absolute top-2 left-2 badge bg-primary-100 text-primary-700">
              {product.category}
            </span>
          )}
        </div>

        <div className="flex-1 flex flex-col">
          <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors mb-1">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-sm text-gray-500 line-clamp-2 mb-3">
              {product.description}
            </p>
          )}
          <div className="mt-auto">
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold text-primary-600">
                ₱{product.price?.toLocaleString()}
              </span>
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="p-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 
                           disabled:bg-gray-300 disabled:cursor-not-allowed
                           transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
            {product.sizes && product.sizes.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {product.sizes.map((size) => (
                  <span key={size} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                    {size}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
