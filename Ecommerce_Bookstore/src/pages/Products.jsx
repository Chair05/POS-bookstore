import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import api, { formatCategoryLabel } from '../config/api'
import ProductCard from '../components/ProductCard'
import SearchBar from '../components/SearchBar'
import { ProductGridSkeleton } from '../components/Loading'
import { dedupeProductsByName } from '../utils/products'

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
        params.append(
          'sort',
          sortBy === 'newest'
            ? '-createdAt'
            : sortBy === 'price-low'
              ? 'price'
              : sortBy === 'price-high'
                ? '-price'
                : 'name'
        )
        params.append('limit', '100')

        const response = await api.get(`/customer/products?${params.toString()}`)
        const rawProducts = response.data.products || response.data || []
        const shouldDedupe = selectedSize === 'All' && !search.trim()
        setProducts(shouldDedupe ? dedupeProductsByName(rawProducts) : rawProducts)
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

  const hasActiveFilters = Boolean(search || selectedCategory !== 'All' || selectedSize !== 'All')

  const clearFilters = () => {
    setSearch('')
    setSelectedCategory('All')
    setSelectedSize('All')
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 mb-1">
              LCCB Bookstore Catalog
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">All Products</h1>
            <p className="text-sm text-slate-500 mt-1">
              Browse uniforms, textbooks, shirts, and school supplies ready for pickup.
            </p>
          </div>
          {!loading && (
            <p className="text-sm font-medium text-slate-500 tabular-nums">
              {products.length} item{products.length !== 1 ? 's' : ''} shown
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-4 sm:p-5 mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search by product name or barcode..."
              />
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
              {allSizes.length > 0 && (
                <select
                  aria-label="Filter by size"
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  className="px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                >
                  <option value="All">All Sizes</option>
                  {allSizes.map((size) => (
                    <option key={size} value={size}>
                      Size: {size}
                    </option>
                  ))}
                </select>
              )}

              <select
                aria-label="Sort products"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
              </select>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-3.5 py-2.5 text-sm font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors whitespace-nowrap"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setSelectedCategory('All')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                selectedCategory === 'All'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
              }`}
            >
              All Categories
            </button>
            {allCategories.map((cat) => {
              const catName = typeof cat === 'string' ? cat : cat.name
              const active = selectedCategory === catName
              return (
                <button
                  key={catName}
                  type="button"
                  onClick={() => setSelectedCategory(catName)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    active
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                  }`}
                >
                  {formatCategoryLabel(catName)}
                </button>
              )
            })}
          </div>
        </div>

        {loading ? (
          <ProductGridSkeleton count={8} />
        ) : products.length === 0 ? (
          <div className="card text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">No products found</h3>
            <p className="text-sm text-slate-500">
              {search ? `No results for "${search}"` : 'Try selecting another category or size.'}
            </p>
            {hasActiveFilters && (
              <button type="button" onClick={clearFilters} className="btn-primary mt-5">
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
