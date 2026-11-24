import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import LccbLogo from '../assets/LCCB-Logo.jpeg'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [quickSearch, setQuickSearch] = useState('')
  const { user, logout } = useAuth()
  const { getCartCount } = useCart()
  const navigate = useNavigate()
  const location = useLocation()

  const cartCount = getCartCount()

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const navLinkClass = (path) =>
    `px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
      isActive(path)
        ? 'bg-primary-50 text-primary-700 font-semibold'
        : 'text-slate-600 hover:text-primary-700 hover:bg-slate-100/80'
    }`

  const handleQuickSearch = (e) => {
    e.preventDefault()
    const query = quickSearch.trim()
    navigate(query ? `/products?search=${encodeURIComponent(query)}` : '/products')
    setIsOpen(false)
  }

  const handleLogout = () => {
    setShowUserMenu(false)
    setShowLogoutConfirm(true)
  }

  const confirmLogout = () => {
    logout()
    setShowUserMenu(false)
    setShowLogoutConfirm(false)
    setIsOpen(false)
    navigate('/')
  }

  return (
    <>
      <nav className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-2.5 group shrink-0">
                <div className="w-9 h-9 rounded-xl overflow-hidden bg-white shadow-sm ring-2 ring-slate-100 group-hover:ring-primary-200 transition-all">
                  <img src={LccbLogo} alt="LCCB Logo" className="w-full h-full object-cover scale-125" />
                </div>
                <div className="hidden sm:block">
                  <span className="font-bold text-slate-900 text-base tracking-tight leading-none block">
                    LCCB <span className="text-primary-600">Bookstore</span>
                  </span>
                  <span className="text-slate-500 text-[11px] font-medium block mt-0.5 leading-none">
                    Campus Storefront
                  </span>
                </div>
              </Link>

              <div className="hidden md:flex items-center gap-1">
                <Link to="/" className={navLinkClass('/')}>
                  Home
                </Link>
                <Link to="/products" className={navLinkClass('/products')}>
                  Catalog
                </Link>
                {user && (
                  <Link to="/orders" className={navLinkClass('/orders')}>
                    My Orders
                  </Link>
                )}
              </div>
            </div>

            <form onSubmit={handleQuickSearch} className="hidden lg:flex flex-1 max-w-xs">
              <div className="relative w-full">
                <svg
                  className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  value={quickSearch}
                  onChange={(e) => setQuickSearch(e.target.value)}
                  placeholder="Search uniforms, supplies..."
                  className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-100/80 border border-transparent rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-500/15 focus:outline-none transition-all"
                />
              </div>
            </form>

            <div className="flex items-center gap-2">
              <Link
                to="/cart"
                aria-label={`Shopping cart with ${cartCount} item${cartCount === 1 ? '' : 's'}`}
                className={`relative inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive('/cart')
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-700 hover:text-primary-700 hover:bg-slate-100/80'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.9}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
                  />
                </svg>
                <span className="hidden sm:inline">Cart</span>
                {cartCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-primary-600 text-white text-[11px] font-bold rounded-full tabular-nums animate-scale-in">
                    {cartCount}
                  </span>
                )}
              </Link>

              {user ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-xl border border-slate-200/80 bg-white hover:border-primary-200 hover:bg-slate-50 transition-all"
                  >
                    <div className="w-7 h-7 bg-primary-600 text-white rounded-lg flex items-center justify-center font-semibold text-xs">
                      {user.fullName?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-slate-700 max-w-[110px] truncate">
                      {user.fullName?.split(' ')[0]}
                    </span>
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showUserMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                      <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-card-hover border border-slate-200/80 py-2 z-50 animate-slide-down">
                        <div className="px-4 py-2.5 border-b border-slate-100">
                          <p className="text-sm font-semibold text-slate-900 truncate">{user.fullName}</p>
                          <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                        <div className="py-1">
                          <Link
                            to="/profile"
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                            onClick={() => setShowUserMenu(false)}
                          >
                            My Profile
                          </Link>
                          <Link
                            to="/orders"
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                            onClick={() => setShowUserMenu(false)}
                          >
                            Order History
                          </Link>
                          <Link
                            to="/change-password"
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                            onClick={() => setShowUserMenu(false)}
                          >
                            Change Password
                          </Link>
                        </div>
                        <hr className="my-1 border-slate-100" />
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Logout
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-primary-700 rounded-xl hover:bg-slate-100/80 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 shadow-sm shadow-primary-600/20 transition-all"
                  >
                    Register
                  </Link>
                </div>
              )}

              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle navigation menu"
                className="md:hidden p-2 rounded-xl text-slate-600 hover:text-primary-700 hover:bg-slate-100 transition-colors"
              >
                {isOpen ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {isOpen && (
            <div className="md:hidden border-t border-slate-100 py-3 space-y-2 animate-slide-down">
              <form onSubmit={handleQuickSearch} className="pb-1">
                <input
                  type="text"
                  value={quickSearch}
                  onChange={(e) => setQuickSearch(e.target.value)}
                  placeholder="Search products..."
                  className="input-field py-2 text-sm"
                />
              </form>
              <Link
                to="/"
                className={`block ${navLinkClass('/')}`}
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/products"
                className={`block ${navLinkClass('/products')}`}
                onClick={() => setIsOpen(false)}
              >
                Catalog
              </Link>
              {user ? (
                <Link
                  to="/orders"
                  className={`block ${navLinkClass('/orders')}`}
                  onClick={() => setIsOpen(false)}
                >
                  My Orders
                </Link>
              ) : (
                <div className="pt-2 flex gap-2">
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="btn-secondary flex-1 text-center py-2"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsOpen(false)}
                    className="btn-primary flex-1 text-center py-2"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex justify-center items-center z-[60] p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-sm w-full shadow-2xl animate-scale-in">
            <h3 className="text-lg font-bold text-slate-900 mb-1.5">Confirm Logout</h3>
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to sign out of your LCCB Bookstore account?
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="btn-secondary py-2 px-4"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="btn-danger py-2 px-4"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
