const CATEGORY_META = {
  shirt: {
    subtitle: 'Polo shirts & campus tees',
    badgeBg: 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white',
    ringColor: 'hover:border-blue-300',
  },
  'school clothes': {
    subtitle: 'Uniforms & P.E. attire',
    badgeBg: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white',
    ringColor: 'hover:border-indigo-300',
  },
  'foot wear': {
    subtitle: 'School shoes & P.E. footwear',
    badgeBg: 'bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white',
    ringColor: 'hover:border-amber-300',
  },
  'school supplies': {
    subtitle: 'Notebooks, paper & stationery',
    badgeBg: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white',
    ringColor: 'hover:border-emerald-300',
  },
  merchandise: {
    subtitle: 'Official LCCB campus gear',
    badgeBg: 'bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white',
    ringColor: 'hover:border-purple-300',
  },
  books: {
    subtitle: 'Textbooks & course modules',
    badgeBg: 'bg-sky-50 text-sky-600 group-hover:bg-sky-600 group-hover:text-white',
    ringColor: 'hover:border-sky-300',
  },
}

const DEFAULT_META = {
  subtitle: 'Campus bookstore items',
  badgeBg: 'bg-primary-50 text-primary-600 group-hover:bg-primary-600 group-hover:text-white',
  ringColor: 'hover:border-primary-300',
}

export function resolveCategoryKey(rawName = '') {
  const name = String(rawName || '').trim().toLowerCase()
  if (name.includes('shirt') || name.includes('polo') || name.includes('tee')) return 'shirt'
  if (name.includes('cloth') || name.includes('uniform') || name.includes('pant') || name.includes('pe')) {
    return 'school clothes'
  }
  if (name.includes('foot') || name.includes('shoe') || name.includes('sneaker')) return 'foot wear'
  if (name.includes('suppl') || name.includes('stationery') || name.includes('paper') || name.includes('pen')) {
    return 'school supplies'
  }
  if (name.includes('merch') || name.includes('bag') || name.includes('tote') || name.includes('lanyard')) {
    return 'merchandise'
  }
  if (name.includes('book') || name.includes('module')) return 'books'
  return 'default'
}

export function getCategoryMeta(rawName = '') {
  const key = resolveCategoryKey(rawName)
  return CATEGORY_META[key] || DEFAULT_META
}

export default function CategoryIcon({ category, className = 'w-6 h-6' }) {
  const key = resolveCategoryKey(category)

  if (key === 'shirt') {
    // Collared Polo Shirt with Placket & Buttons
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <path
          d="M16 3l4.5 2.6a1.5 1.5 0 0 1 .55 2.05l-1.7 2.95a1.2 1.2 0 0 1-1.64.44L16 10v9a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-9l-1.71 1.04a1.2 1.2 0 0 1-1.64-.44L2.95 7.65A1.5 1.5 0 0 1 3.5 5.6L8 3"
          fill="currentColor"
          fillOpacity="0.12"
        />
        <path d="M8 3l2 2.5L12 4l2 1.5L16 3" />
        <path d="M8 3a4 4 0 0 0 8 0" />
        <path d="M12 4v5.5" />
        <circle cx="12" cy="6.5" r="0.45" fill="currentColor" />
        <circle cx="12" cy="8.5" r="0.45" fill="currentColor" />
      </svg>
    )
  }

  if (key === 'school clothes') {
    // School Uniform Jacket / Vest & Pleated Crest Detail
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <path
          d="M8.5 3h7l3.5 3.5-2.2 3L15.5 8v12a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1V8L7.2 9.5 5 6.5 8.5 3z"
          fill="currentColor"
          fillOpacity="0.12"
        />
        <path d="M8.5 3L12 8.5 15.5 3" />
        <path d="M12 8.5V21" />
        <rect x="13.2" y="10.5" width="1.6" height="1.8" rx="0.4" />
        <path d="M8.5 15.5h7" strokeOpacity="0.6" />
      </svg>
    )
  }

  if (key === 'foot wear') {
    // Detailed Campus Sneaker / School Shoe Profile
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <path
          d="M3 16.5V13a3 3 0 0 1 3-3h1.4c.6 0 1.15-.35 1.4-.9L9.8 7h2.4l3.3 4.2c.65.8 1.55 1.35 2.58 1.55l1.42.28A2.8 2.8 0 0 1 21.8 15.8v1.7a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 17.5v-1z"
          fill="currentColor"
          fillOpacity="0.12"
        />
        <path d="M3 16.2h18.8" />
        <path d="M11.8 9.5l1.6-.9" />
        <path d="M13.3 11.3l1.6-.9" />
        <path d="M6.5 16.2c.3-1.6 1.5-2.7 3.1-2.7" strokeOpacity="0.65" />
      </svg>
    )
  }

  if (key === 'school supplies') {
    // Spiral Notebook + Pencil Stationery Icon
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <rect
          x="4"
          y="3.5"
          width="12"
          height="17"
          rx="2"
          fill="currentColor"
          fillOpacity="0.12"
        />
        <path d="M2.8 7h2.2M2.8 11h2.2M2.8 15h2.2" />
        <path d="M8 8.5h4.5M8 12h4.5M8 15.5h2.5" />
        <path
          d="M18.8 5.2a1.3 1.3 0 0 1 1.84 1.84L15.5 12.2l-2.3.5.5-2.3 5.1-5.2z"
          fill="currentColor"
          fillOpacity="0.2"
        />
      </svg>
    )
  }

  if (key === 'merchandise') {
    // Campus Tote / Shopping Bag with LCCB Star Emblem
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <path
          d="M5.5 8h13l1.2 11a2 2 0 0 1-2 2.2H6.3a2 2 0 0 1-2-2.2L5.5 8z"
          fill="currentColor"
          fillOpacity="0.12"
        />
        <path d="M8.5 8V6a3.5 3.5 0 0 1 7 0v2" />
        <path d="M12 11.8l.9 1.8 2 .3-1.45 1.4.35 2-1.8-.95-1.8.95.35-2-1.45-1.4 2-.3.9-1.8z" />
      </svg>
    )
  }

  if (key === 'books') {
    // Open Book with Pages
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <path
          d="M12 6.2C10.5 5 8.5 4.5 6.5 4.5c-1.5 0-3 .4-4 1.1v13c1-.7 2.5-1.1 4-1.1 2 0 4 .5 5.5 1.7m0-13c1.5-1.2 3.5-1.7 5.5-1.7 1.5 0 3 .4 4 1.1v13c-1-.7-2.5-1.1-4-1.1-2 0-4 .5-5.5 1.7m0-13v13"
          fill="currentColor"
          fillOpacity="0.12"
        />
      </svg>
    )
  }

  // Fallback Grid / Catalog Icon
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="2" fill="currentColor" fillOpacity="0.12" />
      <rect x="13" y="3.5" width="7.5" height="7.5" rx="2" />
      <rect x="3.5" y="13" width="7.5" height="7.5" rx="2" />
      <rect x="13" y="13" width="7.5" height="7.5" rx="2" fill="currentColor" fillOpacity="0.12" />
    </svg>
  )
}
