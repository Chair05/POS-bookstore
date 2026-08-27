import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../config/api'
import ProductCard from '../components/ProductCard'
import Loading from '../components/Loading'

const iconPaths = {
  'Shirt': 'M9 3l-1 4h2v13h4V7h2l-1-4c-1-1-4-1-4 0zM8 7h8M10 7v2M14 7v2M10 12h4',
  'School Supplies': 'M4 19V5a2 2 0 012-2h12a2 2 0 012 2v14M9 3v18M15 3v18M4 12h16M4 19h16',
  'School Clothes': 'M12 2L4 6v5a8 8 0 0016 0V6l-8-4zM8 21h8M10 17v4M14 17v4',
  'Foot Wear': 'M4 17h16M4 17v-3a2 2 0 012-2h1l2-4h6l2 4h1a2 2 0 012 2v3M7 12V8M17 12V8',
  'Textbooks': 'M4 4h16v16H4zM4 4c0 0 4-2 8 0s8 0 8 0M12 4v16',
  'Stationery': 'M17 3l4 4L8 20H4v-4L17 3zM12 10l4 4M7 17l-3 3',
  'Accessories': 'M12 2a8 8 0 100 16 8 8 0 000-16zM8 12h8M12 8v8',
}
const defaultIcon = 'M4 6h16v12H4V6zm2 2v8h12V8H6z'

const categoryMeta = {
  'Shirt': { image: '/icons/polo-shirt.svg' },
  'School Supplies': { image: '/icons/school-supplies.svg' },
  'School Clothes': { icon: iconPaths['School Clothes'] },
  'Foot Wear': { icon: iconPaths['Foot Wear'] },
  'Textbooks': { icon: iconPaths['Textbooks'] },
  'Stationery': { icon: iconPaths['Stationery'] },
  'Accessories': { icon: iconPaths['Accessories'] },
  'Merchandise': { image: '/icons/merchandise.svg' },
}
const defaultMeta = { icon: defaultIcon }

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          api.get('/customer/products?limit=8&sort=-createdAt'),
          api.get('/customer/products/categories/list'),
        ])
        setFeaturedProducts(productsRes.data.products || [])
        setCategories(categoriesRes.data.categories || [])
      } catch (err) {
        console.error('Failed to fetch data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="animate-fade-in">
      <section className="relative bg-gradient-to-br from-lccb-blue via-primary-700 to-primary-900 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary-300 rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative">
          <div className="max-w-2xl">
            <span className="inline-block px-3 py-1 bg-white/20 text-white text-sm font-medium rounded-full mb-4 backdrop-blur-sm">
              La Consolacion College Bacolod
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
              LCCB <span className="text-primary-200">Bookstore</span>
            </h1>
            <p className="text-lg text-primary-100 mb-8 leading-relaxed">
              Pre-order your textbooks, uniforms, and school supplies online. 
              Pay via GCash or bank transfer, then pick up at the bookstore.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/products"
                className="inline-flex items-center justify-center px-8 py-3.5 bg-white text-primary-700 font-semibold rounded-xl hover:bg-primary-50 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Browse Products
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      window.location.href = `/products?search=${encodeURIComponent(searchQuery)}`
                    }
                  }}
                  placeholder="Search for books, supplies..."
                  className="w-full px-5 py-3.5 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                />
                <button
                  onClick={() => {
                    if (searchQuery.trim()) {
                      window.location.href = `/products?search=${encodeURIComponent(searchQuery)}`
                    }
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Shop by Category</h2>
            <p className="text-gray-500">Find exactly what you need</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map((cat) => {
              const catName = typeof cat === 'string' ? cat : cat.name
              const meta = categoryMeta[catName] || defaultMeta
              return (
                <Link
                  key={typeof cat === 'string' ? cat : cat.id}
                  to={`/products?category=${encodeURIComponent(catName)}`}
                  className="group flex flex-col items-center p-6 rounded-2xl border border-gray-100 bg-white shadow-soft hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 hover:border-primary-100"
                >
                  <div className="w-14 h-14 rounded-xl bg-primary-50 flex items-center justify-center mb-3 group-hover:bg-primary-100 group-hover:scale-110 transition-all duration-300 ring-1 ring-primary-100">
                    {meta.image ? (
                      <img src={meta.image} alt={catName} className="w-8 h-8 object-contain" />
                    ) : (
                      <svg className="w-7 h-7 text-primary-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                        <path d={meta.icon} />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-primary-600 transition-colors text-center">
                    {catName}
                  </span>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Featured Products</h2>
            <p className="text-gray-500">Latest additions to our bookstore</p>
          </div>
          <Link
            to="/products"
            className="hidden sm:inline-flex items-center text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            View All
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {loading ? (
          <Loading text="Loading products..." />
        ) : featuredProducts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No products available yet</h3>
            <p className="text-gray-500">Products will appear here once added by the administrator.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}

        <div className="sm:hidden mt-8 text-center">
          <Link
            to="/products"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
          >
            View All Products
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-2xl p-8 md:p-12">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Pre-Order Online</h3>
                <p className="text-sm text-gray-600">Browse and select your items from our catalog</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Pay & Verify</h3>
                <p className="text-sm text-gray-600">Pay via GCash or bank transfer and upload receipt</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Pick Up</h3>
                <p className="text-sm text-gray-600">Collect your order at the LCCB Bookstore</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
