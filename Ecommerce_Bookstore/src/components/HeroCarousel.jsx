import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { formatCategoryLabel, formatCurrency, resolveImageUrl } from '../config/api'

const BACKDROPS = [
  'from-slate-950 via-[#152f59] to-primary-700',
  'from-slate-950 via-[#173668] to-blue-800',
  'from-[#0b1930] via-[#1a3a6b] to-primary-700',
  'from-slate-950 via-primary-900 to-[#1e40af]',
]

const DEFAULT_TEXT =
  'Pre-order textbooks, school uniforms, and supplies online. Pay via GCash, then claim your order at the LCCB Bookstore.'

function buildSlides(products) {
  if (!products || products.length === 0) {
    return [
      {
        id: null,
        name: 'LCCB Campus Bookstore',
        isBrand: true,
        sub: 'La Consolacion College Bacolod',
        desc: DEFAULT_TEXT,
        backdrop: BACKDROPS[0],
      },
    ]
  }

  const seenNames = new Set()
  const uniqueProducts = products.filter((product) => {
    const key = String(product.name || product._id).trim().toLowerCase()
    if (seenNames.has(key)) return false
    seenNames.add(key)
    return true
  })

  return uniqueProducts.slice(0, 5).map((product, i) => ({
    id: product._id,
    name: product.name,
    category: product.category,
    price: product.price,
    stock: product.stock,
    variantsCount: product.variants?.length || 0,
    desc: product.description,
    image: resolveImageUrl(product.image),
    backdrop: BACKDROPS[i % BACKDROPS.length],
  }))
}

export default function HeroCarousel({ products, searchValue, onSearchChange, onSearchSubmit }) {
  const slides = useMemo(() => buildSlides(products), [products])
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (current >= slides.length) setCurrent(0)
  }, [current, slides.length])

  useEffect(() => {
    if (paused || slides.length <= 1) return
    const id = setTimeout(() => setCurrent((c) => (c + 1) % slides.length), 5500)
    return () => clearTimeout(id)
  }, [current, paused, slides.length])

  const goTo = (dir) => setCurrent((c) => (c + dir + slides.length) % slides.length)
  const currentSlide = slides[current]
  const shortDesc = (d) => (d && d.length > 130 ? `${d.slice(0, 130).trim()}…` : d)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (onSearchSubmit) onSearchSubmit(searchValue)
  }

  return (
    <section
      className="relative overflow-hidden bg-slate-950"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${currentSlide.backdrop} transition-colors duration-700`} />
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10 md:pt-16 md:pb-12">
        <div key={current} className="grid md:grid-cols-[1.2fr_0.8fr] items-center gap-8 lg:gap-12">
          <div className="min-h-[260px] flex flex-col justify-center">
            <div className="flex flex-wrap items-center gap-2 mb-4 animate-fade-in">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 text-white text-xs font-semibold rounded-full border border-white/15 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {currentSlide.isBrand
                  ? currentSlide.sub
                  : `Featured${currentSlide.category ? ` · ${formatCategoryLabel(currentSlide.category)}` : ''}`}
              </span>
              {currentSlide.variantsCount > 1 && (
                <span className="inline-flex items-center px-2.5 py-1 bg-white/10 text-primary-100 text-xs font-medium rounded-full">
                  {currentSlide.variantsCount} sizes available
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.12] mb-3 animate-slide-up">
              {currentSlide.name}
            </h1>

            {currentSlide.price != null && (
              <div className="flex items-baseline gap-3 mb-3 animate-slide-up">
                <span className="text-2xl md:text-3xl font-bold text-primary-200 tabular-nums">
                  {formatCurrency(currentSlide.price)}
                </span>
                {currentSlide.stock > 0 && (
                  <span className="text-xs font-medium text-emerald-300">
                    In stock · Ready for pre-order
                  </span>
                )}
              </div>
            )}

            <p className="text-base md:text-lg text-slate-200/90 mb-7 leading-relaxed max-w-xl">
              {shortDesc(currentSlide.desc) || DEFAULT_TEXT}
            </p>

            <div className="flex flex-wrap gap-3">
              {currentSlide.id && (
                <Link
                  to={`/products/${currentSlide.id}`}
                  className="inline-flex items-center justify-center px-6 py-3 bg-white text-slate-900 font-semibold text-sm rounded-xl hover:bg-primary-50 transition-all shadow-lg shadow-slate-950/25"
                >
                  View Product
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              )}
              <Link
                to="/products"
                className="inline-flex items-center justify-center px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/25 text-white font-semibold text-sm rounded-xl hover:bg-white/20 transition-all"
              >
                Browse Catalog
              </Link>
            </div>
          </div>

          {currentSlide.image && (
            <div className="hidden md:flex justify-center animate-fade-in">
              <Link
                to={`/products/${currentSlide.id}`}
                className="group relative w-full max-w-[340px] rounded-3xl bg-white/95 p-6 shadow-2xl ring-1 ring-white/30 hover:scale-[1.015] transition-transform duration-300"
              >
                <div className="aspect-square rounded-2xl bg-slate-50 flex items-center justify-center overflow-hidden p-4">
                  <img
                    src={currentSlide.image}
                    alt={currentSlide.name}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.src = '/placeholder-book.svg'
                    }}
                  />
                </div>
                <div className="mt-4 flex items-center justify-between gap-2 px-1">
                  <span className="text-xs font-medium text-slate-500 truncate">
                    {formatCategoryLabel(currentSlide.category || 'Bookstore Item')}
                  </span>
                  <span className="text-sm font-bold text-primary-700 tabular-nums">
                    {formatCurrency(currentSlide.price)}
                  </span>
                </div>
              </Link>
            </div>
          )}
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <form onSubmit={handleSubmit} className="w-full sm:max-w-md">
            <div className="relative flex items-center">
              <svg
                className="absolute left-3.5 w-4 h-4 text-slate-300 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search uniforms, shirts, supplies..."
                className="w-full pl-10 pr-24 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm placeholder-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/15 transition-all"
              />
              <button
                type="submit"
                className="absolute right-1.5 px-3.5 py-1.5 rounded-lg bg-white text-slate-900 text-xs font-semibold hover:bg-primary-50 transition-colors"
              >
                Search
              </button>
            </div>
          </form>

          {slides.length > 1 && (
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => goTo(-1)}
                aria-label="Previous slide"
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 border border-white/15 text-white hover:bg-white/20 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center gap-1.5">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrent(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === current ? 'w-7 bg-white' : 'w-2 bg-white/35 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => goTo(1)}
                aria-label="Next slide"
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 border border-white/15 text-white hover:bg-white/20 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
