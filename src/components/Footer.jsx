import { Link } from 'react-router-dom'
import LccbLogo from '../assets/LCCB-Logo.jpeg'

export default function Footer() {
  return (
    <footer className="bg-lccb-dark text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-white shadow-sm">
                <img src={LccbLogo} alt="LCCB Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="font-bold text-lg">LCCB Bookstore</span>
                <span className="block text-sm text-gray-400">La Consolacion College Bacolod</span>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-md">
              Your one-stop campus bookstore for textbooks, uniforms, school supplies, and more. 
              Pre-order online and pick up at the bookstore.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-300 mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/products" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Products
                </Link>
              </li>
              <li>
                <Link to="/cart" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Cart
                </Link>
              </li>
              <li>
                <Link to="/orders" className="text-gray-400 hover:text-white text-sm transition-colors">
                  My Orders
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-300 mb-4">
              Pickup Info
            </h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 mt-0.5 text-primary-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>LCCB Campus, Bacolod City</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 mt-0.5 text-primary-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Mon-Fri: 8:00 AM - 5:00 PM</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} LCCB Bookstore. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
