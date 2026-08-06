import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../config/api'
import ProductCard from '../components/ProductCard'
import SearchBar from '../components/SearchBar'
import Loading from '../components/Loading'

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [allCategories, setAllCategories] = useState([])
  const [allSizes, setAllSizes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All')
  const [selectedSize, setSelectedSize] = useState(searchParams.get('size') || 'All')
  const [sortBy, setSortBy] = useState('newest')

  useEffect(() => {
    api.get('/customer/products/categories/list')
      .then((res) => {
        const cats = res.data.categories || []
        setAllCategories(cats.map((c) => (typeof c === 'string' ? c : c.name)))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    api.get('/customer/products/sizes/list')
      .then((res) => setAllSizes(res.data.sizes || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (search) params.append('search', search)
        if (selectedCategory !== 'All') params.append('category', selectedCategory)
        if (selectedSize !== 'All') params.append('size', selectedSize)
        params.append('sort', sortBy === 'newest' ? '-createdAt' : sortBy === 'price-low' ? 'price' : sortBy === 'price-high' ? '-price' : 'name')
        params.append('limit', '50')

        const response = await api.get(`/customer/products?${params.toString()}`)
        setProducts(response.data.products || response.data || [])
      } catch (err) {
        console.error('Failed to fetch products:', err)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [search, selectedCategory, selectedSize, sortBy])

  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (selectedCategory !== 'All') params.set('category', selectedCategory)
    if (selectedSize !== 'All') params.set('size', selectedSize)
    setSearchParams(params, { replace: true })
  }, [search, selectedCategory, selectedSize, setSearchParams])

  return (
    <div className="page-container animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">All Products</h1>
          <p className="text-gray-500">Browse our complete catalog</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          <div className="flex-1">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search by name, barcode..."
            />
          </div>
          <div className="flex items-center gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option value="newest">Newest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Name: A to Z</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              selectedCategory === 'All'
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300 hover:text-primary-600'
            }`}
          >
            All
          </button>
          {allCategories.map((cat) => {
            const catName = typeof cat === 'string' ? cat : cat.name
            return (
              <button
                key={catName}
                onClick={() => setSelectedCategory(catName)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedCategory === catName
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300 hover:text-primary-600'
                }`}
              >
              {catName}
            </button>
            )
          })}
        </div>

        {allSizes.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <span className="inline-flex items-center px-2 text-sm font-medium text-gray-500">Size:</span>
            <button
              onClick={() => setSelectedSize('All')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedSize === 'All'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300 hover:text-primary-600'
              }`}
            >
              All
            </button>
            {allSizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedSize === size
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300 hover:text-primary-600'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <Loading text="Loading products..." />
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No products found</h3>
            <p className="text-gray-500">
              {search ? `No results for "${search}"` : 'No products available in this category.'}
            </p>
            {(search || selectedCategory !== 'All' || selectedSize !== 'All') && (
              <button
                onClick={() => {
                  setSearch('')
                  setSelectedCategory('All')
                  setSelectedSize('All')
                }}
                className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">{products.length} product{products.length !== 1 ? 's' : ''} found</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
