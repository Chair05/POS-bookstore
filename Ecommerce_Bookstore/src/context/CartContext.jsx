import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)

function getCartKey(userId) {
  return userId ? `cart_${userId}` : 'cart_guest'
}

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [cart, setCart] = useState([])
  const [selectedIds, setSelectedIds] = useState(new Set())

  const getItemKey = (item) => `${item._id}_${item.selectedSize || ''}`

  useEffect(() => {
    const key = getCartKey(user?.id)
    const savedCart = localStorage.getItem(key)
    setCart(savedCart ? JSON.parse(savedCart) : [])
    setSelectedIds(new Set())
  }, [user?.id])

  useEffect(() => {
    const key = getCartKey(user?.id)
    localStorage.setItem(key, JSON.stringify(cart))
  }, [cart, user?.id])

  const previousCartRef = useRef(null)

  useEffect(() => {
    const previous = previousCartRef.current
    previousCartRef.current = cart

    if (cart.length === 0) return
    if (previous !== null && previous.length > 0) return

    setSelectedIds(new Set(cart.map(getItemKey)))
  }, [cart])

  const toggleItem = useCallback((itemKey) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(itemKey)) {
        next.delete(itemKey)
      } else {
        next.add(itemKey)
      }
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === cart.length) {
        return new Set()
      }
      return new Set(cart.map((item) => getItemKey(item)))
    })
  }, [cart])

  const selectedItems = cart.filter((item) => selectedIds.has(getItemKey(item)))
  const selectedTotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const selectedCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0)
  const allSelected = cart.length > 0 && selectedIds.size === cart.length

  const removeSelectedFromCart = () => {
    setCart((prev) => prev.filter((item) => !selectedIds.has(getItemKey(item))))
    setSelectedIds(new Set())
  }

  const addToCart = (product, quantity = 1, selectedSize = null, variants = []) => {
    const maxOrderQty = Number(product.maxOrderQuantity || 5)
    const maxAllowed = Math.min(Number(product.stock || maxOrderQty), maxOrderQty)
    let capped = false

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) => item._id === product._id && item.selectedSize === selectedSize
      )

      if (existingIndex > -1) {
        const updated = [...prevCart]
        const nextQty = updated[existingIndex].quantity + quantity
        if (nextQty > maxAllowed) {
          capped = true
          updated[existingIndex].quantity = Math.max(1, maxAllowed)
        } else {
          updated[existingIndex].quantity = nextQty
        }
        updated[existingIndex].maxOrderQuantity = maxOrderQty
        return updated
      }

      const initialQty = Math.min(quantity, Math.max(1, maxAllowed))
      if (quantity > maxAllowed) capped = true

      return [
        ...prevCart,
        {
          _id: product._id,
          name: product.name,
          price: product.price,
          image: product.image,
          category: product.category,
          stock: product.stock,
          maxOrderQuantity: maxOrderQty,
          sizes: product.sizes || [],
          variants: variants.length > 0 ? variants : (product.variants || []),
          selectedSize,
          quantity: initialQty,
        },
      ]
    })

    return { capped, maxOrderQty }
  }

  const removeFromCart = (productId, selectedSize = null) => {
    setCart((prevCart) =>
      prevCart.filter(
        (item) => !(item._id === productId && item.selectedSize === selectedSize)
      )
    )
  }

  const updateQuantity = (productId, quantity, selectedSize = null) => {
    if (quantity < 1) {
      removeFromCart(productId, selectedSize)
      return { capped: false }
    }
    let capped = false
    let limit = 5
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item._id === productId && item.selectedSize === selectedSize) {
          const maxOrderQty = Number(item.maxOrderQuantity || 5)
          const maxAllowed = Math.min(Number(item.stock || maxOrderQty), maxOrderQty)
          limit = maxOrderQty
          if (quantity > maxAllowed) {
            capped = true
            return { ...item, quantity: Math.max(1, maxAllowed) }
          }
          return { ...item, quantity }
        }
        return item
      })
    )
    return { capped, limit }
  }

  const changeSize = (cartItemId, newSize) => {
    setCart((prevCart) => {
      const oldIndex = prevCart.findIndex((item) => item._id === cartItemId)
      if (oldIndex === -1) return prevCart

      const oldItem = prevCart[oldIndex]
      const newVariant = (oldItem.variants || []).find(
        (v) => v.size === newSize || v.variant_size === newSize
      )
      if (!newVariant) return prevCart

      const existingIndex = prevCart.findIndex(
        (item) => item._id === newVariant._id && item.selectedSize === newSize
      )

      if (existingIndex > -1 && existingIndex !== oldIndex) {
        const updated = [...prevCart]
        const maxAllowed = Math.min(
          Number(newVariant.stock || 5),
          Number(newVariant.maxOrderQuantity || oldItem.maxOrderQuantity || 5)
        )
        updated[existingIndex].quantity = Math.min(
          maxAllowed,
          updated[existingIndex].quantity + oldItem.quantity
        )
        updated.splice(oldIndex, 1)
        return updated
      }

      return prevCart.map((item) =>
        item._id === cartItemId
          ? {
              ...item,
              _id: newVariant._id,
              name: newVariant.name || item.name,
              price: newVariant.price,
              image: newVariant.image || item.image,
              stock: newVariant.stock,
              maxOrderQuantity: newVariant.maxOrderQuantity || item.maxOrderQuantity || 5,
              selectedSize: newSize,
            }
          : item
      )
    })
  }

  const clearCart = () => {
    setCart([])
    setSelectedIds(new Set())
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0)
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        selectedIds,
        selectedItems,
        selectedTotal,
        selectedCount,
        allSelected,
        toggleItem,
        toggleAll,
        removeSelectedFromCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        changeSize,
        clearCart,
        getCartTotal,
        getCartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
