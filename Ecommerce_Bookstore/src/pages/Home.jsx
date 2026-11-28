import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api, { formatCategoryLabel } from '../config/api'
import ProductCard from '../components/ProductCard'
import { ProductGridSkeleton } from '../components/Loading'
import HeroCarousel from '../components/HeroCarousel'
import { dedupeProductsByName } from '../utils/products'
import { useAuth } from '../context/AuthContext'

const CATEGORY_ICON_PATHS = {
  shirt: 'M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z',
  'school clothes': 'M12 10.5l8.5 5.3a2.2 2.2 0 0 1-1.2 4H4.7a2.2 2.2 0 0 1-1.2-4L12 10.5zM12 10.5V6m0 0a2.5 2.5 0 0 0-5 0m5 0a2.5 2.5 0 0 1 5 0',
  'foot wear': 'M4 17h16M4 17v-3a2 2 0 0 0 2-2h1l2-4h6l2 4h1a2 2 0 0 1 2 2v3M7 12V8M17 12V8',
  'school supplies': 'M17 3l4 4L8 20H4v-4L17 3zM12 10l4 4M7 17l-3 3',
  merchandise: 'M6 7V6a6 6 0 1 1 12 0v1M5 7h14l1 14H4L5 7z',
  supplies: 'M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8zM3.3 7L12 12l8.7-5M12 22V12',
}
const DEFAULT_ICON_PATH = 'M4 6h16v12H4V6zm2 2v8h12V8H6z'

const PICKUP_STEPS = [
  {
    step: '01',
    title: 'Browse & Reserve Online',
    description: 'Visitors can browse freely. Sign in to reserve items from dedicated online stock (bulk limits apply for fair student access).',
    iconPath: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z',
  },
  {
    step: '02',
    title: 'Pay Within 3 Days via GCash',
    description: 'Scan the bookstore QR code and upload your payment receipt within 3 days. Unpaid orders auto-expire after 3 days and return stock.',
    iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    step: '03',
    title: 'Claim with Pickup Code',
    description: 'Once verified, receive your 6-character Pickup Verification Code via email & order tracker and collect at the LCCB Bookstore counter.',
    iconPath: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
  },
]

const BOOKSTORE_POLICIES = [
  {
    title: 'Campus Pickup Only',
    desc: 'No delivery service. Collect your reserved items directly at the LCCB Bookstore counter (Mon–Fri, 8:00 AM – 5:00 PM).',
  },
  {
    title: '3-Day Payment Deadline',
    desc: 'Items are temporarily held when you order. Unpaid orders automatically cancel after 3 days and restore stock.',
  },
  {
    title: 'Dedicated Online Stock',
    desc: 'Online pre-order inventory is allocated separately from walk-in physical bookstore stock.',
  },
  {
    title: 'Bulk Purchase Protection',
    desc: 'Per-item quantity limits prevent stock hoarding so all students can reserve uniforms and books fairly.',
  },
]

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [newArrivals, setNewArrivals] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          api.get('/customer/products?limit=48&sort=-createdAt'),
          api.get('/customer/products/categories/list'),
        ])
        const allUnique = dedupeProductsByName(productsRes.data.products || [])

        // New arrivals: latest added items
        const latest = allUnique.slice(0, 4)
        setNewArrivals(latest)

        // Featured products: items explicitly marked featured, or top catalog items
        const markedFeatured = allUnique.filter((p) => p.isFeatured)
        const featuredList =
          markedFeatured.length >= 4
            ? markedFeatured.slice(0, 8)
            : [
                ...markedFeatured,
                ...allUnique.filter((p) => !p.isFeatured),
              ].slice(0, 8)

        setFeaturedProducts(featuredList)
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
      <HeroCarousel
        products={featuredProducts}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={(q) => {
          const trimmed = q.trim()
          navigate(trimmed ? `/products?search=${encodeURIComponent(trimmed)}` : '/products')
        }}
      />

      {/* ACCOUNT & PICKUP POLICY STRIP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {BOOKSTORE_POLICIES.map((policy) => (
            <div
              key={policy.title}
              className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-primary-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  {policy.title}
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{policy.desc}</p>
            </div>
          ))}
        </div>

        {!user && (
          <div className="mt-4 rounded-2xl bg-gradient-to-r from-primary-600 to-blue-700 text-white p-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div>
              <p className="text-sm font-bold">
                Browsing as a Visitor — Create an Account to Pre-Order
              </p>
              <p className="text-xs text-blue-100 mt-0.5">
                Anyone can browse our catalog, sizes, and real-time online stock. Sign in or register a student/customer account to reserve items for campus pickup.
              </p>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <Link
                to="/login"
                className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-xl bg-white text-primary-700 hover:bg-blue-50 text-xs font-bold transition shadow-xs"
              >
                Register Account
              </Link>
            </div>
          </div>
        )}
      </section>

      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-4">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 mb-1">
                Categories
              </p>
              <h2 className="text-2xl font-bold text-slate-900">Shop by Category</h2>
            </div>
            <Link
              to="/products"
              className="text-sm font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1 transition-colors"
            >
              All items
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
            {categories.map((cat) => {
              const catName = typeof cat === 'string' ? cat : cat.name
              const iconPath = CATEGORY_ICON_PATHS[catName.toLowerCase()] || DEFAULT_ICON_PATH
              return (
                <Link
                  key={typeof cat === 'string' ? cat : cat.id}
                  to={`/products?category=${encodeURIComponent(catName)}`}
                  className="group flex items-center gap-3.5 p-4 rounded-2xl border border-slate-200/80 bg-white shadow-soft hover:shadow-card-hover hover:border-primary-200 hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center shrink-0 group-hover:bg-primary-600 transition-colors">
                    <svg
                      className="w-5 h-5 text-primary-600 group-hover:text-white transition-colors"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d={iconPath} />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-semibold text-slate-800 group-hover:text-primary-700 transition-colors block truncate">
                      {formatCategoryLabel(catName)}
                    </span>
                    <span className="text-xs text-slate-400">Browse →</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* NEW ARRIVALS SECTION */}
      {(loading || newArrivals.length > 0) && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-4">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-1">
                Just Added to LCCB Bookstore
              </p>
              <h2 className="text-2xl font-bold text-slate-900">New Arrivals</h2>
            </div>
            <Link
              to="/products?sort=newest"
              className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:border-primary-300 hover:text-primary-700 shadow-sm transition-all"
            >
              See All New
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {loading ? (
            <ProductGridSkeleton count={4} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {newArrivals.map((product) => (
                <ProductCard key={`new-${product._id}`} product={product} badgeLabel="NEW" />
              ))}
            </div>
          )}
        </section>
      )}

      {/* FEATURED PRODUCTS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 mb-1">
              LCCB Bookstore Essentials
            </p>
            <h2 className="text-2xl font-bold text-slate-900">Featured Products</h2>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:border-primary-300 hover:text-primary-700 shadow-sm transition-all"
          >
            View Full Catalog
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {loading ? (
          <ProductGridSkeleton count={8} />
        ) : featuredProducts.length === 0 ? (
          <div className="card text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">No products available yet</h3>
            <p className="text-sm text-slate-500">Products will appear here once added by the administrator.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                badgeLabel={product.isFeatured ? 'FEATURED' : null}
              />
            ))}
          </div>
        )}
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-soft p-6 sm:p-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 mb-1">
                Campus Pickup Guide
              </p>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">How Pre-Ordering Works</h2>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold w-fit">
              No delivery · Campus pickup only · 3-day payment deadline
            </span>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {PICKUP_STEPS.map(({ step, title, description, iconPath }) => (
              <div key={step} className="p-5 rounded-2xl bg-slate-50/80 border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 bg-primary-600 text-white rounded-xl flex items-center justify-center shadow-sm shadow-primary-600/20">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
                    </svg>
                  </div>
                  <span className="text-xs font-bold tracking-wider text-slate-400 tabular-nums">
                    STEP {step}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-900 mb-1.5">{title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
