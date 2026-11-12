import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'

const GRADIENTS = [
  'from-lccb-blue via-primary-700 to-primary-900',
  'from-primary-900 via-primary-600 to-lccb-dark',
  'from-lccb-dark via-lccb-blue to-primary-800',
  'from-primary-800 via-lccb-blue to-lccb-blue',
  'from-lccb-blue via-primary-800 to-primary-900',
]

const DEFAULT_TEXT =
  'Pre-order your textbooks, uniforms, and school supplies online. Pay via GCash, then pick up at the bookstore.'

function resolveImage(product) {
  if (!product || !product.image) return '/placeholder-book.svg'
  return product.image
}

function buildSlides(products) {
  if (!products || products.length === 0) {
    return [
      {
        id: null,
        name: 'LCCB Bookstore',
        isBrand: true,
        sub: 'La Consolacion College Bacolod',
        desc: DEFAULT_TEXT,
        gradient: GRADIENTS[0],
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
    desc: product.description,
    image: resolveImage(product),
    gradient: GRADIENTS[i % GRADIENTS.length],
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
    const id = setTimeout(() => setCurrent((c) => (c + 1) % slides.length), 5000)
    return () => clearTimeout(id)
  }, [current, paused, slides.length])

  useEffect(() => {
    if (slides.length <= 1) return
    const goTo = (dir) => setCurrent((c) => (c + dir + slides.length) % slides.length)
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') goTo(-1)
      if (e.key === 'ArrowRight') goTo(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [slides.length])

  const goTo = (dir) => setCurrent((c) => (c + dir + slides.length) % slides.length)
  const currentSlide = slides[current]
  const shortDesc = (d) =>
    d && d.length > 120 ? `${d.slice(0, 120).trim()}…` : d

  const handleSubmit = (e) => {
    e.preventDefault()
    if (onSearchSubmit) onSearchSubmit(searchValue)
  }

  return (
    <section
      className="relative overflow-hidden bg-lccb-dark"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((slide, i) => {
        const active = i === current
        return (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-1000 ease-out ${
              active ? 'opacity-100' : 'opacity-0'
            }`}
            aria-hidden={!active}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${slide.gradient}`} />
            <div className={`absolute inset-0 ${active ? 'animate-kenburns' : ''}`}>
              <div className="absolute -top-16 -left-16 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute top-1/3 right-0 w-[28rem] h-[28rem] bg-primary-300/15 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-lccb-lightblue/20 rounded-full blur-3xl" />
              <div className="absolute top-10 right-[12%] w-40 h-40 border border-white/10 rounded-full" />
              <div className="absolute top-16 right-[16%] w-24 h-24 border border-white/10 rounded-full" />
              <div className="absolute -bottom-20 -right-10 w-72 h-72 border border-white/10 rounded-full" />
              <div className="absolute bottom-24 left-10 w-4 h-4 bg-white/20 rounded-full blur-[1px]" />
              <div className="absolute top-24 left-[16%] w-2 h-2 bg-white/20 rounded-full" />
              <div className="absolute top-1/2 right-10 w-3 h-3 bg-white/15 rounded-full" />
            </div>
          </div>
        )
      })}

      <div key={current} className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-36 md:pt-24 md:pb-28">
        <div className="grid md:grid-cols-[1.15fr_0.85fr] items-center gap-10">
          <div>
            <span
              className="inline-block px-3 py-1 bg-white/20 text-white text-sm font-medium rounded-full mb-4 backdrop-blur-sm animate-slide-up"
              style={{ animationDelay: '0s', animationFillMode: 'both' }}
            >
              {currentSlide.isBrand ? currentSlide.sub : `New Arrival${currentSlide.category ? ` · ${currentSlide.category}` : ''}`}
            </span>
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 leading-tight animate-slide-up"
              style={{ animationDelay: '0.1s', animationFillMode: 'both' }}
            >
              {currentSlide.name}
            </h1>
            {currentSlide.price != null && (
              <p
                className="text-2xl md:text-3xl font-bold text-primary-200 mb-3 animate-slide-up"
                style={{ animationDelay: '0.18s', animationFillMode: 'both' }}
              >
                ₱{currentSlide.price.toLocaleString()}
              </p>
            )}
            <p
              className="text-lg text-primary-100 mb-8 leading-relaxed max-w-xl animate-slide-up"
              style={{ animationDelay: '0.24s', animationFillMode: 'both' }}
            >
              {shortDesc(currentSlide.desc) || DEFAULT_TEXT}
            </p>
            <div
              className="flex flex-col sm:flex-row gap-3 animate-slide-up"
              style={{ animationDelay: '0.32s', animationFillMode: 'both' }}
            >
              {currentSlide.id && (
                <Link
                  to={`/products/${currentSlide.id}`}
                  className="inline-flex items-center justify-center px-8 py-3.5 bg-white text-primary-700 font-semibold rounded-xl hover:bg-primary-50 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  View Product
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              )}
              <Link
                to="/products"
                className="inline-flex items-center justify-center px-8 py-3.5 bg-white/10 backdrop-blur-sm border border-white/25 text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-200"
              >
                Browse Products
              </Link>
            </div>
          </div>

          {currentSlide.image && (
            <div
              className="hidden md:block relative animate-slide-up"
              style={{ animationDelay: '0.18s', animationFillMode: 'both' }}
            >
              <div className="absolute inset-0 translate-x-6 translate-y-6 rounded-3xl bg-white/10" />
              <div className="relative rounded-3xl bg-white shadow-2xl p-8 aspect-square flex items-center justify-center">
                <img
                  src={currentSlide.image}
                  alt={currentSlide.name}
                  className="w-full h-full object-contain animate-float drop-shadow-2xl"
                  onError={(e) => {
                    e.target.src = '/placeholder-book.svg'
                    e.target.className = 'w-full h-full object-contain animate-float drop-shadow-2xl'
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {slides.length > 1 && (
        <>
          <button
            onClick={() => goTo(-1)}
            aria-label="Previous slide"
            className="hidden md:flex absolute left-5 top-1/2 -translate-y-1/2 w-11 h-11 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/25 transition-all z-30"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => goTo(1)}
            aria-label="Next slide"
            className="hidden md:flex absolute right-5 top-1/2 -translate-y-1/2 w-11 h-11 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/25 transition-all z-30"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      <form
        onSubmit={handleSubmit}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-30"
      >
        <div className="relative">
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search for books, supplies..."
            className="w-full px-5 py-3.5 pl-11 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
          />
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-white/15 text-white text-sm font-medium hover:bg-white/25 transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-30">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                i === current
                  ? 'w-8 bg-white'
                  : 'w-2.5 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  )
}