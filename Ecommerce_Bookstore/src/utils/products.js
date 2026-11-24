const LETTER_SIZE_ORDER = {
  XS: 1,
  'X-SMALL': 1,
  S: 2,
  SMALL: 2,
  M: 3,
  MEDIUM: 3,
  L: 4,
  LARGE: 4,
  XL: 5,
  'X-LARGE': 5,
  XXL: 6,
  '2XL': 6,
  XXXL: 7,
  '3XL': 7,
  '4XL': 8,
}

export function sizeRank(size) {
  const normalized = String(size || '').trim().toUpperCase()
  if (LETTER_SIZE_ORDER[normalized]) return 10000 + LETTER_SIZE_ORDER[normalized]
  const numeric = normalized.match(/(\d+(?:\.\d+)?)/)
  if (numeric) return Number(numeric[1])
  return 20000
}

export function sortVariantsBySize(variants = []) {
  return [...variants].sort((a, b) => sizeRank(a.size) - sizeRank(b.size))
}

export function dedupeProductsByName(products = []) {
  const seen = new Set()
  return products.filter((product) => {
    const key = String(product.name || product._id).trim().toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
